using System.Security.Claims;
using CompanyChat.Api.Authorization;
using CompanyChat.Api.Data;
using CompanyChat.Api.Models;
using Microsoft.EntityFrameworkCore;
using CompanyChat.Api.WebSockets;
using CompanyChat.Api.Services.Notification;

namespace CompanyChat.Api.Services.Chat;

public record ReplyMessagePayload(
    long Id,
    int SenderId,
    string SenderName,
    string Content);

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

public record NotificationPayload(
    long Id,
    int UserId,
    string Type,
    string Title,
    string Content,
    int? ConversationId,
    long? MessageId,
    bool IsRead,
    DateTime CreatedAt);

public record ChatMessageResult(
    long MessageId,
    IReadOnlyList<int> ReceiverIds,
    ChatMessagePayload Message,
    IReadOnlyList<NotificationPayload> Notifications);

public class ChatMessageService(
    AppDbContext db,
    ConversationAccessService accessService,
    INotificationService notificationService)
{
    public async Task<(ChatMessageResult? Result, string? Error)>
        CreateMessageAsync(
            ClaimsPrincipal currentUser,
            int senderId,
            ChatMessage request,
            CancellationToken cancellationToken)
    {
        /*
         * ==========================
         * SECURITY / DATA SCOPE
         * ==========================
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
         * ==========================
         * GET CONVERSATION
         * ==========================
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
         * ==========================
         * GET RECEIVERS
         * ==========================
         *
         * Private:
         * - Chỉ có 1 receiver.
         *
         * Department:
         * - Lấy tất cả member.
         * - Không gửi lại cho sender.
         */

        List<int> receiverIds;

        if (conversationType == "Private")
        {
            /*
             * Private bắt buộc phải có ReceiverId.
             */

            if (!request.ReceiverId.HasValue)
            {
                return (
                    null,
                    "Receiver is required for private conversation.");
            }

            var receiverId =
                request.ReceiverId.Value;

            /*
             * Receiver phải là member.
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
        else if (conversationType == "Department")
        {
            /*
             * Department không sử dụng ReceiverId.
             *
             * Lấy tất cả thành viên trong conversation
             * ngoại trừ người gửi.
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
                    .ToListAsync(
                        cancellationToken);

            if (receiverIds.Count == 0)
            {
                return (
                    null,
                    "There are no other members in this department conversation.");
            }
        }
        else
        {
            return (
                null,
                "Unsupported conversation type.");
        }

        /*
         * ==========================
         * REPLY SECURITY CHECK
         * ==========================
         */

        if (request.ReplyToMessageId.HasValue)
        {
            var replyMessageExists =
                await db.Messages
                    .AsNoTracking()
                    .AnyAsync(
                        x =>
                            x.Id ==
                                request.ReplyToMessageId.Value &&
                            x.ConversationId ==
                                request.ConversationId,
                        cancellationToken);

            if (!replyMessageExists)
            {
                return (
                    null,
                    "Reply message does not belong to this conversation.");
            }
        }

        /*
         * ==========================
         * CREATE MESSAGE
         * ==========================
         */

        var message =
            new Message
            {
                ConversationId =
                    request.ConversationId,

                SenderId =
                    senderId,

                Content =
                    request.Content.Trim(),

                SentAt =
                    DateTime.UtcNow,

                ReplyToMessageId =
                    request.ReplyToMessageId
            };

        db.Messages.Add(message);

        await db.SaveChangesAsync(
            cancellationToken);

        /*
         * ==========================
         * CREATE MESSAGE STATES
         * ==========================
         *
         * Sender:
         * - Delivered = true
         * - Read = true
         *
         * Receivers:
         * - Delivered = false
         * - Read = false
         */

        var now =
            DateTime.UtcNow;

        var states =
            new List<MessageUserState>();

        /*
         * Sender state
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
                    now
            });

        /*
         * Receiver states
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
                        false
                });
        }

        db.MessageUserStates.AddRange(states);

        await db.SaveChangesAsync(
            cancellationToken);

        /*
         * ==========================
         * GET SENDER
         * ==========================
         */

        var sender =
            await db.Users
                .AsNoTracking()
                .FirstAsync(
                    x =>
                        x.Id ==
                        senderId,
                    cancellationToken);

        /*
         * ==========================
         * CREATE NOTIFICATIONS
         * ==========================
         */

        var notifications =
            new List<NotificationPayload>();

        foreach (var receiverId in receiverIds)
        {
            var notification =
                await notificationService.CreateAsync(
                    receiverId,

                    conversationType == "Department"
                        ? "DepartmentMessage"
                        : "Message",

                    conversationType == "Department"
                        ? "Tin nhắn phòng ban mới"
                        : "Tin nhắn mới",

                    $"{sender.FullName} đã gửi cho bạn một tin nhắn",

                    conversation.Id,

                    message.Id);

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
                    notification.CreatedAt));
        }

        /*
         * ==========================
         * GET REPLY MESSAGE
         * ==========================
         */

        var replyMessage =
            request.ReplyToMessageId.HasValue
                ? await db.Messages
                    .AsNoTracking()
                    .Include(x => x.Sender)
                    .FirstOrDefaultAsync(
                        x =>
                            x.Id ==
                                request.ReplyToMessageId.Value &&
                            x.ConversationId ==
                                request.ConversationId,
                        cancellationToken)
                : null;

        ReplyMessagePayload? replyTo =
            replyMessage is null
                ? null
                : new ReplyMessagePayload(
                    replyMessage.Id,
                    replyMessage.SenderId,
                    replyMessage.Sender.FullName,
                    replyMessage.Content);

        /*
         * ==========================
         * BUILD MESSAGE PAYLOAD
         * ==========================
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
         * ==========================
         * RESULT
         * ==========================
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

    public async Task MarkDeliveredAsync(
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
            return;
        }

        if (state.IsDelivered)
        {
            return;
        }

        state.IsDelivered = true;

        state.DeliveredAt =
            DateTime.UtcNow;

        await db.SaveChangesAsync(
            cancellationToken);
    }
}