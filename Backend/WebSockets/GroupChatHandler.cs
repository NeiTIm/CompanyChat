using System.Security.Claims;
using System.Text.Json;

using CompanyChat.Api.Authorization;
using CompanyChat.Api.Data;
using CompanyChat.Api.Services;

using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.WebSockets;

public class GroupChatHandler
{
    private readonly AppDbContext db;

    private readonly ConversationAccessService
        conversationAccess;

    private readonly ConnectionManager
        connections;


    public GroupChatHandler(
        AppDbContext db,
        ConversationAccessService conversationAccess,
        ConnectionManager connections)
    {
        this.db = db;

        this.conversationAccess =
            conversationAccess;

        this.connections =
            connections;
    }


    /*
     * ==================================================
     * HANDLE GROUP TYPING
     * ==================================================
     */

    public async Task HandleTypingAsync(
        ClaimsPrincipal currentUser,
        int senderId,
        ChatMessage request,
        bool isTyping,
        CancellationToken cancellationToken)
    {
        /*
         * Kiểm tra quyền truy cập group.
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
         * Lấy tất cả member ngoại trừ sender.
         */

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


        /*
         * Tạo typing event.
         */

        var payload =
            new
            {
                type = isTyping
                    ? "typing_start"
                    : "typing_stop",

                conversationId =
                    request.ConversationId,

                userId =
                    senderId
            };


        var json =
            JsonSerializer.Serialize(
                payload);


        /*
         * Gửi tới tất cả member.
         */

        foreach (var receiverId in receiverIds)
        {
            await connections.SendToUserAsync(
                receiverId,
                json,
                cancellationToken);
        }
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