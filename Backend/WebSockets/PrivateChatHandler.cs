using System.Security.Claims;
using System.Text.Json;
using CompanyChat.Api.Authorization;
using CompanyChat.Api.Services;

namespace CompanyChat.Api.WebSockets;

public class PrivateChatHandler
{
    private readonly ConversationAccessService conversationAccess;
    private readonly ConnectionManager connections;

    public PrivateChatHandler(
        ConversationAccessService conversationAccess,
        ConnectionManager connections)
    {
        this.conversationAccess = conversationAccess;
        this.connections = connections;
    }

    public async Task HandleTypingAsync(
        ClaimsPrincipal currentUser,
        int senderId,
        ChatMessage request,
        bool isTyping,
        CancellationToken cancellationToken)
    {
        /*
         * Kiểm tra sender có quyền truy cập conversation.
         */

        if (!await conversationAccess.CanAccessAsync(
                currentUser,
                request.ConversationId))
        {
            await SendErrorAsync(
                senderId,
                "Bạn không có quyền truy cập cuộc trò chuyện.",
                cancellationToken);

            return;
        }


        /*
         * Private Chat phải có ReceiverId.
         */

        if (!request.ReceiverId.HasValue)
        {
            await SendErrorAsync(
                senderId,
                "Thiếu ReceiverId.",
                cancellationToken);

            return;
        }


        var receiverId =
            request.ReceiverId.Value;


        /*
         * Kiểm tra receiver có thuộc conversation.
         */

        if (!await conversationAccess.IsMemberAsync(
                receiverId,
                request.ConversationId))
        {
            await SendErrorAsync(
                senderId,
                "Người nhận không thuộc cuộc trò chuyện.",
                cancellationToken);

            return;
        }


        /*
         * Tạo typing event.
         */

        var payload = new
        {
            type = isTyping
                ? "typing_start"
                : "typing_stop",

            conversationId =
                request.ConversationId,

            userId = senderId
        };


        var json =
            JsonSerializer.Serialize(payload);


        /*
         * Gửi tới người nhận.
         */

        await connections.SendToUserAsync(
            receiverId,
            json,
            cancellationToken);
    }


    /*
     * ==================================================
     * SEND ERROR
     * ==================================================
     */

    private async Task SendErrorAsync(
        int userId,
        string message,
        CancellationToken cancellationToken)
    {
        var payload = new
        {
            type = "error",
            message
        };

        var json =
            JsonSerializer.Serialize(payload);

        await connections.SendToUserAsync(
            userId,
            json,
            cancellationToken);
    }
}