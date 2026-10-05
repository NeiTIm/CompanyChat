using System.Security.Claims;

using CompanyChat.Api.Authorization;
using CompanyChat.Api.Data;
using CompanyChat.Api.Models;
using CompanyChat.Api.Services;
using CompanyChat.Api.Services.Notification;
using CompanyChat.Api.WebSockets;

using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Services.Chat;


/*
 * =========================================================
 * REPLY MESSAGE PAYLOAD
 * =========================================================
 */

public record ReplyMessagePayload(
    long Id,
    int SenderId,
    string SenderName,
    string Content);


/*
 * =========================================================
 * CHAT MESSAGE PAYLOAD
 * =========================================================
 */

public record ChatMessagePayload(
    long Id,
    int ConversationId,
    string ConversationType,
    int SenderId,
    string SenderName,
    string Content,
    long? ReplyToMessageId,
    ReplyMessagePayload? ReplyTo,
    DateTime SentAt,
    string DeliveryStatus);


/*
 * =========================================================
 * NOTIFICATION PAYLOAD
 *
 * DepartmentName được thêm vào để realtime
 * Department notification có thể hiển thị
 * đúng tên phòng ban mà không cần reload.
 * =========================================================
 */

public record NotificationPayload(
    long Id,
    int UserId,
    string Type,
    string Title,
    string Content,
    int? ConversationId,
    long? MessageId,
    bool IsRead,
    DateTime CreatedAt,
    string? DepartmentName);


/*
 * =========================================================
 * CHAT MESSAGE RESULT
 * =========================================================
 */

public record ChatMessageResult(
    long MessageId,
    IReadOnlyList<int> ReceiverIds,
    ChatMessagePayload Message,
    IReadOnlyList<NotificationPayload> Notifications);


/*
 * =========================================================
 * CHAT MESSAGE SERVICE
 * =========================================================
 */

public class ChatMessageService(
    AppDbContext db,
    ConversationAccessService accessService,
    INotificationService notificationService,
    ConnectionManager connections)
{
    /*
     * ==================================================
     * CREATE MESSAGE
     * ==================================================
     */

    public async Task<(ChatMessageResult? Result, string? Error)>
        CreateMessageAsync(
            ClaimsPrincipal currentUser,
            int senderId,
            ChatMessage request,
            CancellationToken cancellationToken)
    {
        /*
         * ==================================================
         * VALIDATE CONTENT
         * ==================================================
         */

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return (
                null,
                "Message content is required.");
        }

        var content =
            request.Content.Trim();

        if (content.Length > 5000)
        {
            return (
                null,
                "Message cannot exceed 5000 characters.");
        }


        /*
         * ==================================================
         * CHECK ACCESS
         * ==================================================
         */

        var canAccess =
            await accessService.CanAccessAsync(
                currentUser,
                request.ConversationId);

        if (!canAccess)
        {
            return (
                null,
                "You do not have access to this conversation.");
        }


        /*
         * ==================================================
         * GET CONVERSATION
         * ==================================================
         */

        var conversation =
            await db.Conversations
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.Id ==
                            request.ConversationId,
                    cancellationToken);

        if (conversation is null)
        {
            return (
                null,
                "Conversation does not exist.");
        }


        var conversationType =
            conversation.Type;


        /*
         * ==================================================
         * GET RECEIVERS
         * ==================================================
         */

        List<int> receiverIds;

        if (conversationType == "Private")
        {
            /*
             * Private phải có ReceiverId.
             */

            if (!request.ReceiverId.HasValue)
            {
                return (
                    null,
                    "Receiver is required for private conversation.");
            }

            var receiverId =
                request.ReceiverId.Value;

            if (receiverId == senderId)
            {
                return (
                    null,
                    "You cannot send a message to yourself.");
            }


            /*
             * Receiver phải thuộc conversation.
             */

            var receiverIsMember =
                await db.ConversationMembers
                    .AsNoTracking()
                    .AnyAsync(
                        x =>
                            x.ConversationId ==
                                request.ConversationId &&

                            x.UserId ==
                                receiverId,
                        cancellationToken);

            if (!receiverIsMember)
            {
                return (
                    null,
                    "Receiver is not a member of this conversation.");
            }

            receiverIds =
            [
                receiverId
            ];
        }
        else if (
            conversationType == "Department" ||
            conversationType == "Group")
        {
            /*
             * Group / Department:
             *
             * Gửi cho tất cả member
             * ngoại trừ sender.
             */

            receiverIds =
                await db.ConversationMembers
                    .AsNoTracking()
                    .Where(
                        x =>
                            x.ConversationId ==
                                request.ConversationId &&

                            x.UserId !=
                                senderId)
                    .Select(
                        x => x.UserId)
                    .Distinct()
                    .ToListAsync(
                        cancellationToken);

            if (receiverIds.Count == 0)
            {
                return (
                    null,
                    conversationType == "Group"
                        ? "There are no other members in this group."
                        : "There are no other members in this department conversation.");
            }
        }
        else
        {
            return (
                null,
                "Unsupported conversation type.");
        }


        /*
         * ==================================================
         * REPLY VALIDATION
         * ==================================================
         */

        Message? replyMessage = null;

        if (request.ReplyToMessageId.HasValue)
        {
            replyMessage =
                await db.Messages
                    .AsNoTracking()
                    .Include(x => x.Sender)
                    .FirstOrDefaultAsync(
                        x =>
                            x.Id ==
                                request.ReplyToMessageId.Value &&

                            x.ConversationId ==
                                request.ConversationId,
                        cancellationToken);

            if (replyMessage is null)
            {
                return (
                    null,
                    "Reply message does not belong to this conversation.");
            }
        }


        /*
         * ==================================================
         * CREATE MESSAGE
         * ==================================================
         */

        var now =
            DateTime.UtcNow;

        var message =
            new Message
            {
                ConversationId =
                    request.ConversationId,

                SenderId =
                    senderId,

                Content =
                    content,

                SentAt =
                    now,

                ReplyToMessageId =
                    request.ReplyToMessageId
            };

        db.Messages.Add(message);

        await db.SaveChangesAsync(
            cancellationToken);


        /*
         * ==================================================
         * CREATE MESSAGE USER STATES
         * ==================================================
         */

        var states =
            new List<MessageUserState>();


        /*
         * Sender
         *
         * Sender đã gửi message nên:
         * Delivered = true
         * Read = true
         */

        states.Add(
            new MessageUserState
            {
                MessageId =
                    message.Id,

                UserId =
                    senderId,

                IsDelivered =
                    true,

                DeliveredAt =
                    now,

                IsRead =
                    true,

                ReadAt =
                    now,

                IsDeletedForMe =
                    false
            });


        /*
         * Receivers
         */

        foreach (var receiverId in receiverIds)
        {
            states.Add(
                new MessageUserState
                {
                    MessageId =
                        message.Id,

                    UserId =
                        receiverId,

                    IsDelivered =
                        false,

                    IsRead =
                        false,

                    IsDeletedForMe =
                        false
                });
        }

        db.MessageUserStates.AddRange(states);

        await db.SaveChangesAsync(
            cancellationToken);


        /*
         * ==================================================
         * GET SENDER
         * ==================================================
         */

        var sender =
            await db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.Id ==
                            senderId,
                    cancellationToken);

        if (sender is null)
        {
            return (
                null,
                "Sender does not exist.");
        }


        /*
         * ==================================================
         * CREATE NOTIFICATIONS
         * ==================================================
         */

        var notifications =
            new List<NotificationPayload>();

        foreach (var receiverId in receiverIds)
        {
            /*
             * Nếu receiver đang mở conversation:
             *
             * - Vẫn gửi realtime message.
             * - Không tạo notification.
             */

            if (connections.IsUserViewingConversation(
                    receiverId,
                    conversation.Id))
            {
                continue;
            }


            var notificationType =
                conversationType switch
                {
                    "Group" =>
                        "GroupMessage",

                    "Department" =>
                        "DepartmentMessage",

                    _ =>
                        "Message"
                };


            var notificationTitle =
                conversationType switch
                {
                    "Group" =>
                        "Tin nhắn nhóm mới",

                    "Department" =>
                        "Tin nhắn phòng ban mới",

                    _ =>
                        "Tin nhắn mới"
                };


            var notification =
                await notificationService.CreateAsync(
                    receiverId,

                    notificationType,

                    notificationTitle,

                    $"{sender.FullName} đã gửi cho bạn một tin nhắn",

                    conversation.Id,

                    message.Id);


            /*
             * ==================================================
             * ADD NOTIFICATION PAYLOAD
             *
             * QUAN TRỌNG:
             *
             * notificationService.CreateAsync()
             * đã lấy DepartmentName.
             *
             * Trước đây DepartmentName bị bỏ mất
             * khi chuyển sang NotificationPayload.
             *
             * Bây giờ truyền nó vào realtime payload.
             * ==================================================
             */

            notifications.Add(
                new NotificationPayload(
                    notification.Id,
                    notification.UserId,
                    notification.Type,
                    notification.Title,
                    notification.Content,
                    notification.ConversationId,
                    notification.MessageId,
                    notification.IsRead,
                    notification.CreatedAt,
                    notification.DepartmentName));
        }


        /*
         * ==================================================
         * REPLY DTO
         * ==================================================
         */

        ReplyMessagePayload? replyTo =
            replyMessage is null
                ? null
                : new ReplyMessagePayload(
                    replyMessage.Id,
                    replyMessage.SenderId,
                    replyMessage.Sender.FullName,
                    replyMessage.Content);


        /*
         * ==================================================
         * MESSAGE PAYLOAD
         * ==================================================
         */

        var payload =
            new ChatMessagePayload(
                message.Id,
                message.ConversationId,
                conversationType,
                message.SenderId,
                sender.FullName,
                message.Content,
                message.ReplyToMessageId,
                replyTo,
                message.SentAt,
                "sent");


        /*
         * ==================================================
         * RESULT
         * ==================================================
         */

        var result =
            new ChatMessageResult(
                message.Id,
                receiverIds,
                payload,
                notifications);


        return (
            result,
            null);
    }


    /*
     * ==================================================
     * MARK DELIVERED
     * ==================================================
     */

    public async Task<bool> MarkDeliveredAsync(
        long messageId,
        int receiverId,
        CancellationToken cancellationToken)
    {
        var state =
            await db.MessageUserStates
                .FirstOrDefaultAsync(
                    x =>
                        x.MessageId ==
                            messageId &&

                        x.UserId ==
                            receiverId,
                    cancellationToken);

        if (state is null)
        {
            return false;
        }

        if (state.IsDelivered)
        {
            return false;
        }

        state.IsDelivered = true;

        state.DeliveredAt =
            DateTime.UtcNow;

        await db.SaveChangesAsync(
            cancellationToken);

        return true;
    }
}