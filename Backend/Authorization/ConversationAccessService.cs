using System.Security.Claims;
using CompanyChat.Api.Data;
using CompanyChat.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Authorization;

public class ConversationAccessService(AppDbContext db)
{
    /*
     * =========================================================
     * GET CURRENT USER ID
     * =========================================================
     */

    public int GetUserId(ClaimsPrincipal user)
    {
        var userId = user.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(userId, out var id))
        {
            throw new UnauthorizedAccessException(
                "User ID is missing from token.");
        }

        return id;
    }


    /*
     * =========================================================
     * GET CURRENT USER
     * =========================================================
     */

    private async Task<User?> GetCurrentUserAsync(
        ClaimsPrincipal user)
    {
        var userId = GetUserId(user);

        return await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == userId);
    }


    /*
     * =========================================================
     * GET CONVERSATION
     * =========================================================
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
     * =========================================================
     * IS MEMBER
     * =========================================================
     */

    public async Task<bool> IsMemberAsync(
        ClaimsPrincipal user,
        int conversationId)
    {
        var userId = GetUserId(user);

        return await db.ConversationMembers
            .AsNoTracking()
            .AnyAsync(
                x =>
                    x.ConversationId ==
                        conversationId &&

                    x.UserId ==
                        userId);
    }


    /*
     * =========================================================
     * GET MEMBER
     * =========================================================
     */

    public async Task<ConversationMember?> GetMemberAsync(
        ClaimsPrincipal user,
        int conversationId)
    {
        var userId = GetUserId(user);

        return await db.ConversationMembers
            .FirstOrDefaultAsync(
                x =>
                    x.ConversationId ==
                        conversationId &&

                    x.UserId ==
                        userId);
    }


    /*
     * =========================================================
     * CAN ACCESS CONVERSATION
     * =========================================================
     *
     * RULE:
     *
     * 1. User phải đăng nhập.
     *
     * 2. User phải là member của conversation.
     *
     * 3. Private conversation:
     *      member là đủ.
     *
     * 4. Department conversation:
     *      user phải thuộc đúng Department
     *      của conversation.
     *
     * 5. Admin KHÔNG được bypass membership.
     *
     * =========================================================
     */

    public async Task<bool> CanAccessAsync(
        ClaimsPrincipal user,
        int conversationId)
    {
        if (user.Identity?.IsAuthenticated != true)
        {
            return false;
        }


        /*
         * =====================================================
         * LẤY CURRENT USER
         * =====================================================
         */

        var currentUser =
            await GetCurrentUserAsync(user);

        if (currentUser is null)
        {
            return false;
        }


        /*
         * =====================================================
         * KIỂM TRA MEMBER
         * =====================================================
         *
         * Đây là lớp bảo vệ quan trọng nhất.
         *
         * Admin cũng không được tự động
         * truy cập Private Conversation.
         */

        var isMember =
            await IsMemberAsync(
                user,
                conversationId);

        if (!isMember)
        {
            return false;
        }


        /*
         * =====================================================
         * LẤY CONVERSATION
         * =====================================================
         */

        var conversation =
            await GetConversationAsync(
                conversationId);

        if (conversation is null)
        {
            return false;
        }


        /*
         * =====================================================
         * PRIVATE CONVERSATION
         * =====================================================
         *
         * Private:
         *
         *     DepartmentId = null
         *
         * Chỉ cần là member.
         */

        if (conversation.Type == "Private")
        {
            return true;
        }


        /*
         * =====================================================
         * DEPARTMENT CONVERSATION
         * =====================================================
         *
         * Department conversation bắt buộc
         * phải có DepartmentId.
         */

        if (conversation.Type == "Department")
        {
            /*
             * Conversation chưa được gắn Department
             * -> không cho truy cập.
             */

            if (conversation.DepartmentId is null)
            {
                return false;
            }


            /*
             * User chưa thuộc Department
             * -> không cho truy cập.
             */

            if (currentUser.DepartmentId is null)
            {
                return false;
            }


            /*
             * User phải thuộc đúng Department
             * của conversation.
             */

            return currentUser.DepartmentId ==
                conversation.DepartmentId;
        }


        /*
         * =====================================================
         * LOẠI CONVERSATION KHÔNG XÁC ĐỊNH
         * =====================================================
         *
         * Không whitelist loại conversation
         * -> mặc định từ chối.
         */

        return false;
    }
}