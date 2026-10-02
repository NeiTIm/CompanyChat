using System.Net.WebSockets;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

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


        /* ==================================================
           SEND CURRENT ONLINE USERS
           
           Browser vừa đăng nhập phải biết
           những user khác đang Online.
        ================================================== */

        var onlineUserIds =
            connections.GetOnlineUserIds();

        foreach (var onlineUserId in onlineUserIds)
        {
            /*
             * Không cần gửi chính mình.
             */

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
            ================================================== */

            var becameOffline =
                connections.Remove(
                    userId,
                    socket);


            /* ==================================================
               USER OFFLINE
               
               Chỉ broadcast khi connection
               cuối cùng của user đóng.
            ================================================== */

            if (becameOffline)
            {
                var userOfflineJson =
                    JsonSerializer.Serialize(
                        new
                        {
                            type =
                                "user_status",

                            userId,

                            isOnline = false,

                            lastSeen =
                                DateTime.UtcNow
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
            var result =
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
                break;
            }


            /* ==================================================
               CHỈ XỬ LÝ TEXT
            ================================================== */

            if (result.MessageType !=
                WebSocketMessageType.Text)
            {
                continue;
            }


            var json =
                Encoding.UTF8.GetString(
                    buffer,
                    0,
                    result.Count);


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
            catch
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
        ================================================== */

        var hasOnlineReceiver =
            messageResult.ReceiverIds
                .Any(
                    receiverId =>
                        connections.IsOnline(
                            receiverId));


        var senderStatus =
            hasOnlineReceiver
                ? "delivered"
                : "sent";


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


        await connections.SendToUserAsync(
            senderId,
            senderJson);
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
       HANDLE TYPING
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