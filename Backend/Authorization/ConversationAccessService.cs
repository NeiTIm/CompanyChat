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
            .Include(x => x.UserDepartments)
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
     * CHECK DEPARTMENT MEMBERSHIP
     * ==================================================
     *
     * User có thể thuộc Department theo 2 cách:
     *
     * 1. Primary Department
     * 2. Additional Department
     *
     * Ví dụ:
     *
     * Primary:
     *     IT
     *
     * Additional:
     *     Marketing
     *     R&D
     *
     * User có quyền truy cập cả 3 Department Chat.
     *
     * ==================================================
     */

    private static bool BelongsToDepartment(
        User user,
        int departmentId)
    {
        /*
         * ==================================================
         * PRIMARY DEPARTMENT
         * ==================================================
         */

        if (user.DepartmentId == departmentId)
        {
            return true;
        }


        /*
         * ==================================================
         * ADDITIONAL DEPARTMENTS
         * ==================================================
         */

        return user.UserDepartments
            .Any(
                x =>
                    x.DepartmentId ==
                    departmentId);
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
        /*
         * ==================================================
         * AUTHENTICATION
         * ==================================================
         */

        if (user.Identity?.IsAuthenticated != true)
        {
            return false;
        }


        /*
         * ==================================================
         * GET CURRENT USER
         * ==================================================
         */

        var currentUser =
            await GetCurrentUserAsync(user);

        if (currentUser == null)
        {
            return false;
        }


        /*
         * ==================================================
         * USER PHẢI ACTIVE
         * ==================================================
         *
         * User bị disable / inactive
         * không được truy cập conversation.
         *
         * ==================================================
         */

        if (!currentUser.IsActive)
        {
            return false;
        }


        /*
         * ==================================================
         * GET CONVERSATION
         * ==================================================
         */

        var conversation =
            await GetConversationAsync(
                conversationId);

        if (conversation == null)
        {
            return false;
        }


        /*
         * ==================================================
         * USER PHẢI LÀ MEMBER
         * ==================================================
         *
         * Private / Group / Department đều phải
         * vượt qua bước này.
         *
         * ==================================================
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
         *
         * Private conversation:
         *
         * Chỉ cần là ConversationMember.
         *
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
            /*
             * Department Conversation bắt buộc
             * phải có DepartmentId.
             */

            if (!conversation.DepartmentId.HasValue)
            {
                return false;
            }


            var departmentId =
                conversation.DepartmentId.Value;


            /*
             * ==================================================
             * KIỂM TRA DEPARTMENT CÓ ACTIVE KHÔNG
             * ==================================================
             */

            var departmentIsActive =
                await db.Departments
                    .AsNoTracking()
                    .AnyAsync(
                        x =>
                            x.Id == departmentId &&
                            x.IsActive);

            if (!departmentIsActive)
            {
                return false;
            }


            /*
             * ==================================================
             * KIỂM TRA PRIMARY + ADDITIONAL
             * ==================================================
             *
             * Primary:
             *
             *     currentUser.DepartmentId
             *
             * Additional:
             *
             *     currentUser.UserDepartments
             *
             * Chỉ cần thuộc một trong hai
             * là được phép truy cập.
             * ==================================================
             */

            return BelongsToDepartment(
                currentUser,
                departmentId);
        }


        /*
         * ==================================================
         * GROUP CHAT
         * ==================================================
         *
         * Group access dựa trên ConversationMember.
         *
         * Không phụ thuộc DepartmentId.
         *
         * ==================================================
         */

        if (conversation.Type == "Group")
        {
            return true;
        }


        /*
         * ==================================================
         * UNSUPPORTED CONVERSATION TYPE
         * ==================================================
         */

        return false;
    }
}