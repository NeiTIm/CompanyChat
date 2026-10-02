using System.Net.WebSockets;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using CompanyChat.Api.Authorization;
using CompanyChat.Api.Data;
using CompanyChat.Api.Models;
using CompanyChat.Api.Services;
using CompanyChat.Api.Services.Chat;

using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.WebSockets;

public class ChatWebSocketHandler(
    AppDbContext db,
    ConnectionManager connections,
    ConversationAccessService conversationAccess,
    ChatMessageService chatMessageService,
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
                context.User,
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

                    userId =
                        user.Id,

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
        ClaimsPrincipal currentUser,
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
             * TYPING
             * ==========================
             */

            if (request.Type ==
                    "typing_start" ||
                request.Type ==
                    "typing_stop")
            {
                await HandleTypingAsync(
                    currentUser,
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

            await HandleMessageAsync(
                currentUser,
                senderId,
                request,
                cancellationToken);
        }
    }

    private async Task HandleMessageAsync(
        ClaimsPrincipal currentUser,
        int senderId,
        ChatMessage request,
        CancellationToken cancellationToken)
    {
        /*
         * ==========================
         * CREATE MESSAGE
         * ==========================
         */

        var result =
            await chatMessageService.CreateMessageAsync(
                currentUser,
                senderId,
                request,
                cancellationToken);

        if (result.Error is not null)
        {
            await SendErrorAsync(
                senderId,
                result.Error);

            return;
        }

        var messageResult =
            result.Result!;

        /*
         * ==========================
         * SEND TO RECEIVERS
         * ==========================
         *
         * Private:
         *     1 receiver
         *
         * Department:
         *     nhiều receivers
         */

        var deliveredReceiverIds =
            new List<int>();

        foreach (
            var receiverId
            in messageResult.ReceiverIds)
        {
            /*
             * ==========================
             * SEND MESSAGE
             * ==========================
             */

            var receiverPayload =
                messageResult.Message with
                {
                    DeliveryStatus =
                        "delivered"
                };

            var receiverResponse =
                new
                {
                    type = "message",

                    message =
                        receiverPayload
                };

            var receiverJson =
                JsonSerializer.Serialize(
                    receiverResponse,
                    JsonOptions);

            var delivered =
                await connections.SendToUserAsync(
                    receiverId,
                    receiverJson,
                    cancellationToken);

            if (delivered)
            {
                deliveredReceiverIds.Add(
                    receiverId);

                await chatMessageService
                    .MarkDeliveredAsync(
                        messageResult.MessageId,
                        receiverId,
                        cancellationToken);
            }

            /*
             * ==========================
             * SEND NOTIFICATION
             * ==========================
             */

            var notification =
                messageResult.Notifications
                    .FirstOrDefault(
                        x =>
                            x.UserId ==
                            receiverId);

            if (notification is not null)
            {
                var notificationResponse =
                    new
                    {
                        type = "notification",

                        notification = new
                        {
                            notification.Id,
                            notification.UserId,
                            notification.Type,
                            notification.Title,
                            notification.Content,
                            notification.ConversationId,
                            notification.MessageId,
                            notification.IsRead,
                            notification.CreatedAt
                        }
                    };

                var notificationJson =
                    JsonSerializer.Serialize(
                        notificationResponse,
                        JsonOptions);

                await connections.SendToUserAsync(
                    receiverId,
                    notificationJson,
                    cancellationToken);
            }
        }

        /*
         * ==========================
         * SEND BACK TO SENDER
         * ==========================
         *
         * Nếu ít nhất một receiver
         * nhận được qua WebSocket
         * => delivered.
         *
         * Nếu không có receiver online
         * => sent.
         */

        var senderDeliveryStatus =
            deliveredReceiverIds.Count > 0
                ? "delivered"
                : "sent";

        var senderPayload =
            messageResult.Message with
            {
                DeliveryStatus =
                    senderDeliveryStatus
            };

        var senderResponse =
            new
            {
                type = "message",

                message =
                    senderPayload
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

    private async Task HandleTypingAsync(
        ClaimsPrincipal currentUser,
        int senderId,
        ChatMessage request,
        CancellationToken cancellationToken)
    {
        /*
         * ==========================
         * SECURITY
         * ==========================
         */

        var canAccess =
            await conversationAccess.CanAccessAsync(
                currentUser,
                request.ConversationId);

        if (!canAccess)
        {
            await SendErrorAsync(
                senderId,
                "You do not have access to this conversation.");

            return;
        }

        /*
         * ==========================
         * GET CONVERSATION TYPE
         * ==========================
         */

        var conversationType =
            await db.Conversations
                .AsNoTracking()
                .Where(
                    x =>
                        x.Id ==
                        request.ConversationId)
                .Select(
                    x => x.Type)
                .FirstOrDefaultAsync(
                    cancellationToken);

        if (conversationType is null)
        {
            await SendErrorAsync(
                senderId,
                "Conversation does not exist.");

            return;
        }

        /*
         * ==========================
         * PRIVATE TYPING
         * ==========================
         */

        if (conversationType == "Private")
        {
            if (!request.ReceiverId.HasValue)
            {
                await SendErrorAsync(
                    senderId,
                    "Receiver is required.");

                return;
            }

            var receiverId =
                request.ReceiverId.Value;

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
                await SendErrorAsync(
                    senderId,
                    "Receiver is not a member of this conversation.");

                return;
            }

            await SendTypingToUserAsync(
                senderId,
                receiverId,
                request,
                cancellationToken);

            return;
        }

        /*
         * ==========================
         * DEPARTMENT TYPING
         * ==========================
         *
         * Gửi typing tới tất cả
         * thành viên khác trong department.
         */

        if (conversationType == "Department")
        {
            var receiverIds =
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

            foreach (var receiverId
                     in receiverIds)
            {
                await SendTypingToUserAsync(
                    senderId,
                    receiverId,
                    request,
                    cancellationToken);
            }

            return;
        }

        await SendErrorAsync(
            senderId,
            "Unsupported conversation type.");
    }

    private async Task SendTypingToUserAsync(
        int senderId,
        int receiverId,
        ChatMessage request,
        CancellationToken cancellationToken)
    {
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
            receiverId,
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