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
             * TYPING INDICATOR
             * ==========================
             */

            if (request.Type == "typing_start" ||
                request.Type == "typing_stop")
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
         * SEND TO RECEIVER
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
                messageResult.ReceiverId,
                receiverJson,
                cancellationToken);

        /*
         * ==========================
         * UPDATE DELIVERED
         * ==========================
         *
         * Nếu receiver đang online
         * và WebSocket gửi thành công
         * => Delivered.
         */

        if (delivered)
        {
            await chatMessageService.MarkDeliveredAsync(
                messageResult.MessageId,
                messageResult.ReceiverId,
                cancellationToken);
        }

        /*
         * ==========================
         * SEND BACK TO SENDER
         * ==========================
         */

        var senderPayload =
            messageResult.Message with
            {
                DeliveryStatus =
                    delivered
                        ? "delivered"
                        : "sent"
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
         * SECURITY / DATA SCOPE
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
            await SendErrorAsync(
                senderId,
                "Receiver is not a member of this conversation.");

            return;
        }

        /*
         * ==========================
         * SEND TYPING
         * ==========================
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