using System.Net.WebSockets;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

using Microsoft.EntityFrameworkCore;
using CompanyChat.Api.Models;
using CompanyChat.Api.Authorization;
using CompanyChat.Api.Data;
using CompanyChat.Api.Services;
using CompanyChat.Api.Services.Chat;

namespace CompanyChat.Api.WebSockets;

public class ChatWebSocketHandler
{
    private readonly AppDbContext db;

    private readonly ConnectionManager connections;

    private readonly ConversationAccessService
        conversationAccess;

    private readonly ChatMessageService
        chatMessageService;

    private readonly PrivateChatHandler
        privateChatHandler;

    private readonly DepartmentChatHandler
        departmentChatHandler;

    private readonly GroupChatHandler
        groupChatHandler;

    private readonly ILogger<ChatWebSocketHandler>
        logger;


    public ChatWebSocketHandler(
        AppDbContext db,
        ConnectionManager connections,
        ConversationAccessService conversationAccess,
        ChatMessageService chatMessageService,
        PrivateChatHandler privateChatHandler,
        DepartmentChatHandler departmentChatHandler,
        GroupChatHandler groupChatHandler,
        ILogger<ChatWebSocketHandler> logger)
    {
        this.db = db;

        this.connections =
            connections;

        this.conversationAccess =
            conversationAccess;

        this.chatMessageService =
            chatMessageService;

        this.privateChatHandler =
            privateChatHandler;

        this.departmentChatHandler =
            departmentChatHandler;

        this.groupChatHandler =
            groupChatHandler;

        this.logger =
            logger;
    }


    /* ==================================================
       HANDLE WEBSOCKET CONNECTION
    ================================================== */

    public async Task HandleAsync(
        HttpContext context,
        WebSocket socket)
    {
        var userIdClaim =
            context.User.FindFirst(
                ClaimTypes.NameIdentifier);

        if (userIdClaim == null ||
            !int.TryParse(
                userIdClaim.Value,
                out var userId))
        {
            await socket.CloseAsync(
                WebSocketCloseStatus.PolicyViolation,
                "Unauthorized",
                CancellationToken.None);

            return;
        }


        /* ==================================================
           ADD CONNECTION
        ================================================== */

        var becameOnline =
            connections.Add(
                userId,
                socket);

        if (becameOnline)
        {
            var user = await db.Users
                .FirstOrDefaultAsync(x =>
                    x.Id == userId);

            if (user != null)
            {
                user.IsOnline = true;

                await db.SaveChangesAsync();
            }
        }


        /* ==================================================
           SEND CURRENT ONLINE USERS
        ================================================== */

        var onlineUserIds =
            connections.GetOnlineUserIds();

        foreach (var onlineUserId in onlineUserIds)
        {
            // Không cần gửi trạng thái của chính mình.

            if (onlineUserId == userId)
            {
                continue;
            }

            var onlineJson =
                JsonSerializer.Serialize(
                    new
                    {
                        type = "user_status",

                        userId = onlineUserId,

                        isOnline = true
                    });

            await connections.SendToSocketAsync(
                socket,
                onlineJson,
                CancellationToken.None);
        }


        /* ==================================================
           USER ONLINE

           Chỉ broadcast khi user thực sự
           chuyển Offline -> Online.
        ================================================== */

        if (becameOnline)
        {
            var userOnlineJson =
                JsonSerializer.Serialize(
                    new
                    {
                        type = "user_status",

                        userId,

                        isOnline = true
                    });

            await connections.BroadcastAsync(
                userOnlineJson);
        }


        try
        {
            await ReceiveLoopAsync(
                context,
                socket,
                userId);
        }
        catch (OperationCanceledException)
        {
            // Connection bị hủy bình thường.
        }
        catch (WebSocketException ex)
        {
            logger.LogWarning(
                ex,
                "WebSocket disconnected for user {UserId}",
                userId);
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "WebSocket error for user {UserId}",
                userId);
        }
        finally
        {
            /* ==================================================
               REMOVE CONNECTION

               Chỉ chuyển Offline khi đây là connection
               cuối cùng của user.
            ================================================== */

            var becameOffline =
                connections.Remove(
                    userId,
                    socket);

            DateTime? lastSeen = null;

            if (becameOffline)
            {
                lastSeen =
                    DateTime.UtcNow;

                var user = await db.Users
                    .FirstOrDefaultAsync(x =>
                        x.Id == userId);

                if (user != null)
                {
                    user.IsOnline = false;

                    user.LastSeen =
                        lastSeen.Value;

                    await db.SaveChangesAsync();
                }
            }


            /* ==================================================
               USER OFFLINE

               Chỉ broadcast khi connection cuối cùng
               của user đóng.

               lastSeen dùng đúng thời điểm đã lưu DB.
            ================================================== */

            if (becameOffline)
            {
                var userOfflineJson =
                    JsonSerializer.Serialize(
                        new
                        {
                            type = "user_status",

                            userId,

                            isOnline = false,

                            lastSeen
                        });

                await connections.BroadcastAsync(
                    userOfflineJson);
            }


            /* ==================================================
               CLOSE SOCKET
            ================================================== */

            if (socket.State ==
                    WebSocketState.Open ||

                socket.State ==
                    WebSocketState.CloseReceived)
            {
                try
                {
                    await socket.CloseAsync(
                        WebSocketCloseStatus.NormalClosure,
                        "Connection closed",
                        CancellationToken.None);
                }
                catch
                {
                    // Ignore close errors.
                }
            }
        }
    }


    /* ==================================================
       RECEIVE LOOP

       Đọc đầy đủ WebSocket message.

       Không giả định:
       1 ReceiveAsync = 1 JSON hoàn chỉnh.
    ================================================== */

    private async Task ReceiveLoopAsync(
        HttpContext context,
        WebSocket socket,
        int senderId)
    {
        var currentUser =
            context.User;

        var buffer =
            new byte[64 * 1024];


        while (
            socket.State ==
            WebSocketState.Open)
        {
            using var messageStream =
                new MemoryStream();

            WebSocketReceiveResult result;


            /* ==================================================
               ĐỌC ĐỦ MESSAGE
            ================================================== */

            do
            {
                result =
                    await socket.ReceiveAsync(
                        new ArraySegment<byte>(
                            buffer),
                        CancellationToken.None);


                /* ==================================================
                   CLIENT ĐÓNG CONNECTION
                ================================================== */

                if (result.MessageType ==
                    WebSocketMessageType.Close)
                {
                    return;
                }


                /* ==================================================
                   CHỈ XỬ LÝ TEXT
                ================================================== */

                if (result.MessageType !=
                    WebSocketMessageType.Text)
                {
                    continue;
                }


                await messageStream.WriteAsync(
                    buffer.AsMemory(
                        0,
                        result.Count));

            }
            while (!result.EndOfMessage);


            if (result.MessageType !=
                WebSocketMessageType.Text)
            {
                continue;
            }


            var json =
                Encoding.UTF8.GetString(
                    messageStream.ToArray());


            ChatMessage? message;


            /* ==================================================
               DESERIALIZE
            ================================================== */

            try
            {
                message =
                    JsonSerializer.Deserialize<ChatMessage>(
                        json,
                        new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive =
                                true
                        });
            }
            catch (JsonException)
            {
                await SendErrorAsync(
                    senderId,
                    "Dữ liệu gửi lên không hợp lệ.",
                    CancellationToken.None);

                continue;
            }


            if (message == null)
            {
                continue;
            }


            /* ==================================================
               ROUTE MESSAGE
            ================================================== */

            switch (message.Type)
            {
                case "conversation_change":

                    await HandleConversationChangeAsync(
                        currentUser,
                        senderId,
                        message);

                    break;


                case "read":

                    await HandleReadAsync(
                        currentUser,
                        senderId,
                        message);

                    break;


                case "typing_start":

                    await HandleTypingAsync(
                        currentUser,
                        senderId,
                        message,
                        true);

                    break;


                case "typing_stop":

                    await HandleTypingAsync(
                        currentUser,
                        senderId,
                        message,
                        false);

                    break;


                case "message":

                    await HandleMessageAsync(
                        currentUser,
                        senderId,
                        message);

                    break;


                default:

                    await SendErrorAsync(
                        senderId,
                        "Loại message không được hỗ trợ.",
                        CancellationToken.None);

                    break;
            }
        }
    }


    /* ==================================================
       HANDLE MESSAGE

       ChatMessageService xử lý:
       - Private
       - Department
       - Group
       - Reply
       - MessageUserState
       - Notification
    ================================================== */

    private async Task HandleMessageAsync(
        ClaimsPrincipal currentUser,
        int senderId,
        ChatMessage request)
    {
        var result =
            await chatMessageService
                .CreateMessageAsync(
                    currentUser,
                    senderId,
                    request,
                    CancellationToken.None);


        /* ==================================================
           CREATE MESSAGE ERROR
        ================================================== */

        if (!string.IsNullOrEmpty(
                result.Error))
        {
            await SendErrorAsync(
                senderId,
                result.Error,
                CancellationToken.None);

            return;
        }


        var messageResult =
            result.Result!;


        /* ==================================================
           MESSAGE JSON
        ================================================== */

        var messageJson =
            JsonSerializer.Serialize(
                new
                {
                    type = "message",

                    message =
                        messageResult.Message
                });


        /* ==================================================
           SEND MESSAGE TO RECEIVERS

           Group:
           message được gửi tới từng member.

           Nếu gửi thành công:
           MessageUserState.IsDelivered = true.
        ================================================== */

        foreach (
            var receiverId
            in messageResult.ReceiverIds)
        {
            var delivered =
                await connections.SendToUserAsync(
                    receiverId,
                    messageJson);


            if (delivered)
            {
                await chatMessageService
                    .MarkDeliveredAsync(
                        messageResult.MessageId,
                        receiverId,
                        CancellationToken.None);
            }
        }


        /* ==================================================
           SEND NOTIFICATIONS

           Notification đã được quyết định
           ở ChatMessageService.
        ================================================== */

        foreach (
            var notification
            in messageResult.Notifications)
        {
            var notificationJson =
                JsonSerializer.Serialize(
                    new
                    {
                        type =
                            "notification",

                        notification
                    });


            await connections.SendToUserAsync(
                notification.UserId,
                notificationJson);
        }


        /* ==================================================
           SENDER DELIVERY STATUS

           Không dùng:

           Any(IsOnline)

           Vì Group có nhiều receiver.

           Dựa vào MessageUserState thực tế:

           - tất cả read       -> read
           - có receiver
             delivered        -> delivered
           - chưa receiver    -> sent
        ================================================== */

        var receiverStates =
            await db.MessageUserStates
                .AsNoTracking()
                .Where(x =>
                    x.MessageId ==
                        messageResult.MessageId &&

                    x.UserId != senderId)
                .ToListAsync();


        var senderStatus =
            GetGroupDeliveryStatus(
                receiverStates);


        var senderMessage =
            messageResult.Message with
            {
                DeliveryStatus =
                    senderStatus
            };


        var senderJson =
            JsonSerializer.Serialize(
                new
                {
                    type = "message",

                    message =
                        senderMessage
                });


        /* ==================================================
           SEND MESSAGE BACK TO SENDER

           Dùng để replace optimistic message
           ở React.
        ================================================== */

        await connections.SendToUserAsync(
            senderId,
            senderJson);
    }


    /* ==================================================
       GET DELIVERY STATUS

       Dùng được cho:
       - Private
       - Department
       - Group

       Group:
       - Không có receiver -> sent
       - Tất cả read -> read
       - Có ít nhất một receiver delivered -> delivered
       - Chưa ai nhận -> sent
    ================================================== */

    private static string GetGroupDeliveryStatus(
        List<MessageUserState> receiverStates)
    {
        if (receiverStates.Count == 0)
        {
            return "sent";
        }


        if (receiverStates.All(
                x => x.IsRead))
        {
            return "read";
        }


        if (receiverStates.Any(
                x => x.IsDelivered))
        {
            return "delivered";
        }


        return "sent";
    }


    /* ==================================================
       CHANGE ACTIVE CONVERSATION
    ================================================== */

    private async Task HandleConversationChangeAsync(
        ClaimsPrincipal currentUser,
        int senderId,
        ChatMessage request)
    {
        if (!await conversationAccess
                .CanAccessAsync(
                    currentUser,
                    request.ConversationId))
        {
            await SendErrorAsync(
                senderId,
                "Bạn không có quyền truy cập cuộc trò chuyện.",
                CancellationToken.None);

            return;
        }


        connections.SetActiveConversation(
            senderId,
            request.ConversationId);
    }


    /* ==================================================
       HANDLE READ

       Khi user mở Group:
       React gửi:

       {
           type: "read",
           conversationId: 23
       }

       Backend chỉ mark read những message:
       - thuộc conversation
       - thuộc user hiện tại
       - chưa read
       - chưa DeleteForMe
       - nằm sau HistoryDeletedAt
    ================================================== */

    private async Task HandleReadAsync(
        ClaimsPrincipal currentUser,
        int senderId,
        ChatMessage request)
    {
        /* ==================================================
           CHECK ACCESS
        ================================================== */

        if (!await conversationAccess
                .CanAccessAsync(
                    currentUser,
                    request.ConversationId))
        {
            await SendErrorAsync(
                senderId,
                "Bạn không có quyền truy cập cuộc trò chuyện.",
                CancellationToken.None);

            return;
        }


        /* ==================================================
           LẤY HISTORY DELETED AT

           Nếu user từng xóa lịch sử:

           HistoryDeletedAt = 10:00

           thì message trước 10:00
           không được mark read.
        ================================================== */

        var member =
            await db.ConversationMembers
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.ConversationId ==
                            request.ConversationId &&

                        x.UserId ==
                            senderId);


        if (member == null)
        {
            await SendErrorAsync(
                senderId,
                "Bạn không còn là thành viên của cuộc trò chuyện.",
                CancellationToken.None);

            return;
        }


        var historyDeletedAt =
            member.HistoryDeletedAt;


        /* ==================================================
           LẤY MESSAGE CHƯA READ
        ================================================== */

        var unreadStates =
            await db.MessageUserStates
                .Include(x => x.Message)
                .Where(x =>
                    x.UserId ==
                        senderId &&

                    x.Message.ConversationId ==
                        request.ConversationId &&

                    !x.IsRead &&

                    !x.IsDeletedForMe &&

                    (
                        historyDeletedAt == null ||

                        x.Message.SentAt >
                            historyDeletedAt.Value
                    ))
                .ToListAsync();


        if (unreadStates.Count == 0)
        {
            return;
        }


        /* ==================================================
           MARK READ
        ================================================== */

        var now =
            DateTime.UtcNow;

        foreach (var state in unreadStates)
        {
            state.IsRead =
                true;

            state.ReadAt =
                now;


            if (state.DeliveredAt == null)
            {
                state.IsDelivered =
                    true;

                state.DeliveredAt =
                    now;
            }
        }


        await db.SaveChangesAsync();


        /* ==================================================
           BÁO CHO SENDER

           Message đã được read.

           Với Group:
           có thể có nhiều sender khác nhau.
        ================================================== */

        foreach (var state in unreadStates)
        {
            if (state.Message.SenderId ==
                senderId)
            {
                continue;
            }


            await SendMessageStatusAsync(
                state.Message.SenderId,
                state.MessageId,
                "read");
        }
    }


    /* ==================================================
       SEND MESSAGE STATUS
    ================================================== */

    private async Task SendMessageStatusAsync(
        int userId,
        long messageId,
        string status)
    {
        var json =
            JsonSerializer.Serialize(
                new
                {
                    type =
                        "message_status",

                    messageId,

                    status
                });


        await connections.SendToUserAsync(
            userId,
            json);
    }


    /* ==================================================
       HANDLE TYPING

       ChatWebSocketHandler chỉ route.

       Logic riêng:
       - PrivateChatHandler
       - DepartmentChatHandler
       - GroupChatHandler
    ================================================== */

    private async Task HandleTypingAsync(
        ClaimsPrincipal currentUser,
        int senderId,
        ChatMessage request,
        bool isTyping)
    {
        var conversationType =
            await conversationAccess
                .GetConversationTypeAsync(
                    request.ConversationId);


        if (conversationType == null)
        {
            await SendErrorAsync(
                senderId,
                "Không tìm thấy cuộc trò chuyện.",
                CancellationToken.None);

            return;
        }


        switch (conversationType)
        {
            case "Private":

                await privateChatHandler
                    .HandleTypingAsync(
                        currentUser,
                        senderId,
                        request,
                        isTyping,
                        CancellationToken.None);

                break;


            case "Department":

                await departmentChatHandler
                    .HandleTypingAsync(
                        currentUser,
                        senderId,
                        request,
                        isTyping,
                        CancellationToken.None);

                break;


            case "Group":

                await groupChatHandler
                    .HandleTypingAsync(
                        currentUser,
                        senderId,
                        request,
                        isTyping,
                        CancellationToken.None);

                break;


            default:

                await SendErrorAsync(
                    senderId,
                    "Loại cuộc trò chuyện không được hỗ trợ.",
                    CancellationToken.None);

                break;
        }
    }


    /* ==================================================
       SEND ERROR
    ================================================== */

    private async Task SendErrorAsync(
        int userId,
        string message,
        CancellationToken cancellationToken)
    {
        var payload =
            new
            {
                type = "error",

                message
            };


        var json =
            JsonSerializer.Serialize(
                payload);


        await connections.SendToUserAsync(
            userId,
            json,
            cancellationToken);
    }
}