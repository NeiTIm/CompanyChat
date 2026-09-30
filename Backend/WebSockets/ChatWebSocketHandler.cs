using System.Net.WebSockets;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using CompanyChat.Api.Data;
using CompanyChat.Api.Models;
using CompanyChat.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.WebSockets;

public class ChatWebSocketHandler(
    AppDbContext db,
    ConnectionManager connections,
    ILogger<ChatWebSocketHandler> logger)
{
    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);

    public async Task HandleAsync(
        HttpContext context,
        WebSocket socket)
    {
        var idText =
            context.User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!int.TryParse(
                idText,
                out var userId))
        {
            await socket.CloseAsync(
                WebSocketCloseStatus.PolicyViolation,
                "Unauthorized",
                CancellationToken.None);

            return;
        }

        connections.Add(
            userId,
            socket);

        var user =
            await db.Users.FindAsync(userId);

        /*
         * ==========================
         * USER ONLINE
         * ==========================
         */

        if (user is not null)
        {
            user.IsOnline = true;
            user.LastSeen = null;

            await db.SaveChangesAsync();

            await BroadcastUserStatusAsync(
                user,
                true);
        }

        try
        {
            await ReceiveLoopAsync(
                userId,
                socket,
                context.RequestAborted);
        }
        catch (OperationCanceledException)
        {
        }
        catch (WebSocketException ex)
        {
            logger.LogWarning(
                ex,
                "WebSocket error for user {UserId}.",
                userId);
        }
        finally
        {
            var removed =
                connections.Remove(
                    userId,
                    socket);

            if (removed &&
                user is not null)
            {
                user.IsOnline = false;
                user.LastSeen =
                    DateTime.UtcNow;

                await db.SaveChangesAsync();

                await BroadcastUserStatusAsync(
                    user,
                    false);
            }

            try
            {
                if (socket.State ==
                        WebSocketState.Open ||
                    socket.State ==
                        WebSocketState.CloseReceived)
                {
                    await socket.CloseAsync(
                        WebSocketCloseStatus.NormalClosure,
                        "Disconnected",
                        CancellationToken.None);
                }
            }
            catch
            {
            }
        }
    }

    private async Task BroadcastUserStatusAsync(
        User user,
        bool isOnline)
    {
        var json =
            JsonSerializer.Serialize(
                new
                {
                    type = "user_status",

                    userId = user.Id,

                    isOnline,

                    lastSeen =
                        isOnline
                            ? null
                            : user.LastSeen
                },
                JsonOptions);

        await connections.BroadcastAsync(
            json);
    }

    private async Task ReceiveLoopAsync(
        int senderId,
        WebSocket socket,
        CancellationToken cancellationToken)
    {
        var buffer =
            new byte[4096];

        while (
            socket.State ==
                WebSocketState.Open &&
            !cancellationToken
                .IsCancellationRequested)
        {
            using var stream =
                new MemoryStream();

            WebSocketReceiveResult result;

            do
            {
                result =
                    await socket.ReceiveAsync(
                        buffer,
                        cancellationToken);

                if (result.MessageType ==
                    WebSocketMessageType.Close)
                {
                    return;
                }

                stream.Write(
                    buffer,
                    0,
                    result.Count);

            } while (
                !result.EndOfMessage);

            var json =
                Encoding.UTF8.GetString(
                    stream.ToArray());

            ChatMessage? request;

            try
            {
                request =
                    JsonSerializer.Deserialize<ChatMessage>(
                        json,
                        JsonOptions);
            }
            catch
            {
                await SendErrorAsync(
                    senderId,
                    "Invalid JSON.");

                continue;
            }

            if (request is null)
            {
                continue;
            }

            /*
             * ==========================
             * TYPING INDICATOR
             * ==========================
             */

            if (request.Type == "typing_start" ||
                request.Type == "typing_stop")
            {
                await HandleTypingAsync(
                    senderId,
                    request,
                    cancellationToken);

                continue;
            }

            /*
             * ==========================
             * MESSAGE
             * ==========================
             */

            if (request.Type != "message")
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(
                    request.Content))
            {
                continue;
            }

            /*
             * ==========================
             * SECURITY CHECK
             * ==========================
             */

            var senderIsMember =
                await db.ConversationMembers
                    .AnyAsync(
                        x =>
                            x.ConversationId ==
                                request.ConversationId &&
                            x.UserId ==
                                senderId,
                        cancellationToken);

            if (!senderIsMember)
            {
                await SendErrorAsync(
                    senderId,
                    "You are not a member of this conversation.");

                continue;
            }

            var receiverIsMember =
                await db.ConversationMembers
                    .AnyAsync(
                        x =>
                            x.ConversationId ==
                                request.ConversationId &&
                            x.UserId ==
                                request.ReceiverId,
                        cancellationToken);

            if (!receiverIsMember)
            {
                await SendErrorAsync(
                    senderId,
                    "Receiver is not a member of this conversation.");

                continue;
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
                        .AnyAsync(
                            x =>
                                x.Id ==
                                    request.ReplyToMessageId.Value &&
                                x.ConversationId ==
                                    request.ConversationId,
                            cancellationToken);

                if (!replyMessageExists)
                {
                    await SendErrorAsync(
                        senderId,
                        "Reply message does not belong to this conversation.");

                    continue;
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

                    IsDelivered = true,

                    DeliveredAt =
                        now,

                    IsRead = true,

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

                    IsDelivered = false,

                    IsRead = false
                };

            db.MessageUserStates.Add(
                senderState);

            db.MessageUserStates.Add(
                receiverState);

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

            var replyMessage = request.ReplyToMessageId.HasValue
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

            var replyTo =
                replyMessage is null
                    ? null
                    : new
                    {
                        id = replyMessage.Id,

                        senderId =
                            replyMessage.SenderId,

                        senderName =
                            replyMessage.Sender.FullName,

                        content =
                            replyMessage.Content
                    };
            /*
             * ==========================
             * SEND TO RECEIVER
             * ==========================
             */

            var receiverResponse =
                new
                {
                    type = "message",

                    message =
                        new
                        {
                            id =
                                message.Id,

                            conversationId =
                                message.ConversationId,

                            senderId =
                                message.SenderId,

                            senderName =
                                sender.FullName,

                            content =
                                message.Content,

                            replyToMessageId =
                                message.ReplyToMessageId,

                            replyTo =
                                replyTo,

                            sentAt =
                                message.SentAt,

                            deliveryStatus =
                                "delivered"
                        }
                };

            var receiverJson =
                JsonSerializer.Serialize(
                    receiverResponse,
                    JsonOptions);

            var delivered =
                await connections.SendToUserAsync(
                    request.ReceiverId,
                    receiverJson,
                    cancellationToken);

            /*
             * Nếu receiver đang online
             * và WebSocket gửi thành công
             * => Delivered.
             */

            if (delivered)
            {
                receiverState.IsDelivered = true;

                receiverState.DeliveredAt =
                    DateTime.UtcNow;

                await db.SaveChangesAsync(
                    cancellationToken);
            }

            /*
             * ==========================
             * SEND BACK TO SENDER
             * ==========================
             */

            var senderResponse =
                new
                {
                    type = "message",

                    message =
                        new
                        {
                            id =
                                message.Id,

                            conversationId =
                                message.ConversationId,

                            senderId =
                                message.SenderId,

                            senderName =
                                sender.FullName,

                            content =
                                message.Content,

                            replyToMessageId =
                                message.ReplyToMessageId,

                            replyTo =
                                replyTo,

                            sentAt =
                                message.SentAt,

                            deliveryStatus =
                                delivered
                                    ? "delivered"
                                    : "sent"
                        }
                };

            var senderJson =
                JsonSerializer.Serialize(
                    senderResponse,
                    JsonOptions);

            await connections.SendToUserAsync(
                senderId,
                senderJson,
                cancellationToken);
        }
    }

    private async Task HandleTypingAsync(
        int senderId,
        ChatMessage request,
        CancellationToken cancellationToken)
    {
        /*
         * Kiểm tra người gửi có thuộc
         * conversation hay không.
         */

        var senderIsMember =
            await db.ConversationMembers
                .AnyAsync(
                    x =>
                        x.ConversationId ==
                            request.ConversationId &&
                        x.UserId ==
                            senderId,
                    cancellationToken);

        if (!senderIsMember)
        {
            await SendErrorAsync(
                senderId,
                "You are not a member of this conversation.");

            return;
        }

        /*
         * Kiểm tra receiver có thuộc
         * conversation hay không.
         */

        var receiverIsMember =
            await db.ConversationMembers
                .AnyAsync(
                    x =>
                        x.ConversationId ==
                            request.ConversationId &&
                        x.UserId ==
                            request.ReceiverId,
                    cancellationToken);

        if (!receiverIsMember)
        {
            await SendErrorAsync(
                senderId,
                "Receiver is not a member of this conversation.");

            return;
        }

        /*
         * Gửi trạng thái typing
         * cho receiver.
         */

        var response =
            new
            {
                type = "typing",

                conversationId =
                    request.ConversationId,

                userId =
                    senderId,

                isTyping =
                    request.Type ==
                        "typing_start"
            };

        var json =
            JsonSerializer.Serialize(
                response,
                JsonOptions);

        await connections.SendToUserAsync(
            request.ReceiverId,
            json,
            cancellationToken);
    }

    private async Task SendErrorAsync(
        int userId,
        string message)
    {
        var json =
            JsonSerializer.Serialize(
                new
                {
                    type = "error",
                    message
                },
                JsonOptions);

        await connections.SendToUserAsync(
            userId,
            json);
    }
}