using System.Security.Claims;
using CompanyChat.Api.Data;
using CompanyChat.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Authorization;

public class ConversationAccessService
{
    private readonly AppDbContext db;

    public ConversationAccessService(AppDbContext db)
    {
        this.db = db;
    }

    /*
     * ==================================================
     * GET CURRENT USER ID
     * ==================================================
     */

    public int? GetUserId(ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (int.TryParse(value, out var userId))
        {
            return userId;
        }

        return null;
    }


    /*
     * ==================================================
     * GET CURRENT USER
     * ==================================================
     */

    private async Task<User?> GetCurrentUserAsync(
        ClaimsPrincipal user)
    {
        var userId = GetUserId(user);

        if (!userId.HasValue)
        {
            return null;
        }

        return await db.Users
            .FirstOrDefaultAsync(
                x => x.Id == userId.Value);
    }


    /*
     * ==================================================
     * GET CONVERSATION
     * ==================================================
     */

    private async Task<Conversation?> GetConversationAsync(
        int conversationId)
    {
        return await db.Conversations
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == conversationId);
    }


    /*
     * ==================================================
     * CHECK MEMBER - CLAIMS PRINCIPAL
     *
     * Giữ method cũ để Controller không bị ảnh hưởng.
     * ==================================================
     */

    public async Task<bool> IsMemberAsync(
        ClaimsPrincipal user,
        int conversationId)
    {
        var userId = GetUserId(user);

        if (!userId.HasValue)
        {
            return false;
        }

        return await IsMemberAsync(
            userId.Value,
            conversationId);
    }


    /*
     * ==================================================
     * CHECK MEMBER - USER ID
     *
     * Dùng cho WebSocket Handler.
     * ==================================================
     */

    public async Task<bool> IsMemberAsync(
        int userId,
        int conversationId)
    {
        return await db.ConversationMembers
            .AsNoTracking()
            .AnyAsync(
                x =>
                    x.ConversationId == conversationId &&
                    x.UserId == userId);
    }


    /*
     * ==================================================
     * GET MEMBER - CLAIMS PRINCIPAL
     *
     * Giữ method cũ để Controller không bị ảnh hưởng.
     * ==================================================
     */

    public async Task<ConversationMember?> GetMemberAsync(
        ClaimsPrincipal user,
        int conversationId)
    {
        var userId = GetUserId(user);

        if (!userId.HasValue)
        {
            return null;
        }

        return await GetMemberAsync(
            userId.Value,
            conversationId);
    }


    /*
     * ==================================================
     * GET MEMBER - USER ID
     *
     * Dùng khi đã có UserId.
     * ==================================================
     */

    public async Task<ConversationMember?> GetMemberAsync(
        int userId,
        int conversationId)
    {
        return await db.ConversationMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x =>
                    x.ConversationId == conversationId &&
                    x.UserId == userId);
    }


    /*
     * ==================================================
     * GET CONVERSATION TYPE
     * ==================================================
     */

    public async Task<string?> GetConversationTypeAsync(
        int conversationId)
    {
        return await db.Conversations
            .AsNoTracking()
            .Where(
                x => x.Id == conversationId)
            .Select(
                x => x.Type)
            .FirstOrDefaultAsync();
    }


    /*
     * ==================================================
     * CHECK CONVERSATION ACCESS
     * ==================================================
     */

    public async Task<bool> CanAccessAsync(
        ClaimsPrincipal user,
        int conversationId)
    {
        if (user.Identity?.IsAuthenticated != true)
        {
            return false;
        }

        var currentUser =
            await GetCurrentUserAsync(user);

        if (currentUser == null)
        {
            return false;
        }

        var conversation =
            await GetConversationAsync(
                conversationId);

        if (conversation == null)
        {
            return false;
        }

        /*
         * User phải là member
         */

        var isMember =
            await IsMemberAsync(
                currentUser.Id,
                conversationId);

        if (!isMember)
        {
            return false;
        }


        /*
         * ==================================================
         * PRIVATE CHAT
         * ==================================================
         */

        if (conversation.Type == "Private")
        {
            return true;
        }


        /*
         * ==================================================
         * DEPARTMENT CHAT
         * ==================================================
         */

        if (conversation.Type == "Department")
        {
            if (!conversation.DepartmentId.HasValue)
            {
                return false;
            }

            if (!currentUser.DepartmentId.HasValue)
            {
                return false;
            }

            return
                conversation.DepartmentId.Value ==
                currentUser.DepartmentId.Value;
        }


        /*
         * ==================================================
         * GROUP CHAT
         *
         * Chưa làm Group Chat.
         *
         * Để sẵn access theo member cho tương lai.
         * Không ảnh hưởng Private / Department.
         * ==================================================
         */

        if (conversation.Type == "Group")
        {
            return true;
        }


        return false;
    }
}