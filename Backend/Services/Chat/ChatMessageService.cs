using System.Security.Claims;
using CompanyChat.Api.Authorization;
using CompanyChat.Api.Data;
using CompanyChat.Api.Models;
using Microsoft.EntityFrameworkCore;
using CompanyChat.Api.WebSockets;

namespace CompanyChat.Api.Services.Chat;

public record ReplyMessagePayload(
    long Id,
    int SenderId,
    string SenderName,
    string Content);

public record ChatMessagePayload(
    long Id,
    int ConversationId,
    int SenderId,
    string SenderName,
    string Content,
    long? ReplyToMessageId,
    ReplyMessagePayload? ReplyTo,
    DateTime SentAt,
    string DeliveryStatus);

public record ChatMessageResult(
    long MessageId,
    int ReceiverId,
    ChatMessagePayload Message);

public class ChatMessageService(
    AppDbContext db,
    ConversationAccessService conversationAccess)
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
         *
         * Private conversation:
         * - User phải là member.
         *
         * Department conversation:
         * - User phải là member.
         * - User phải thuộc đúng Department.
         */

        var canAccess =
            await conversationAccess.CanAccessAsync(
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
         * RECEIVER SECURITY CHECK
         * ==========================
         */

        var receiverIsMember =
            await db.ConversationMembers
                .AsNoTracking()
                .AnyAsync(
                    x =>
                        x.ConversationId ==
                            request.ConversationId &&
                        x.UserId ==
                            request.ReceiverId,
                    cancellationToken);

        if (!receiverIsMember)
        {
            return (
                null,
                "Receiver is not a member of this conversation.");
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
         */

        var now =
            DateTime.UtcNow;

        var senderState =
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
            };

        var receiverState =
            new MessageUserState
            {
                MessageId =
                    message.Id,

                UserId =
                    request.ReceiverId,

                IsDelivered =
                    false,

                IsRead =
                    false
            };

        db.MessageUserStates.Add(senderState);
        db.MessageUserStates.Add(receiverState);

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
                message.SenderId,
                sender.FullName,
                message.Content,
                message.ReplyToMessageId,
                replyTo,
                message.SentAt,
                "sent");

        var result =
            new ChatMessageResult(
                message.Id,
                request.ReceiverId,
                payload);

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
        state.DeliveredAt = DateTime.UtcNow;

        await db.SaveChangesAsync(
            cancellationToken);
    }
}