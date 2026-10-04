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
         * ==================================================
         * CHECK ACCESS
         * ==================================================
         */

        var canAccess =
            await conversationAccess.CanAccessAsync(
                currentUser,
                request.ConversationId);

        if (!canAccess)
        {
            await SendErrorAsync(
                senderId,
                "Bạn không có quyền truy cập cuộc trò chuyện.",
                cancellationToken);

            return;
        }


        /*
         * ==================================================
         * CHECK CONVERSATION TYPE
         * ==================================================
         */

        var isGroup =
            await db.Conversations
                .AsNoTracking()
                .AnyAsync(
                    x =>
                        x.Id ==
                            request.ConversationId &&

                        x.Type ==
                            "Group",
                    cancellationToken);

        if (!isGroup)
        {
            await SendErrorAsync(
                senderId,
                "Cuộc trò chuyện không phải Group.",
                cancellationToken);

            return;
        }


        /*
         * ==================================================
         * GET GROUP MEMBERS
         * ==================================================
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
                .Distinct()
                .ToListAsync(
                    cancellationToken);


        /*
         * Không có member khác.
         */

        if (receiverIds.Count == 0)
        {
            return;
        }


        /*
         * ==================================================
         * CREATE TYPING EVENT
         * ==================================================
         */

        var payload =
            new
            {
                type =
                    isTyping
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
         * ==================================================
         * SEND TO ALL MEMBERS
         * ==================================================
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