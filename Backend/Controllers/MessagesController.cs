using CompanyChat.Api.Authorization;
using CompanyChat.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Controllers;

[ApiController]
[Route("api/messages")]
[Authorize]
public class MessagesController(
    AppDbContext db,
    ConversationAccessService conversationAccess) : ControllerBase
{
    private int CurrentUserId =>
        conversationAccess.GetUserId(User)
        ?? throw new UnauthorizedAccessException();


    // =========================================================
    // XÓA TIN NHẮN CHỈ Ở PHÍA MÌNH
    // DELETE /api/messages/{messageId}/me
    // =========================================================

    [HttpDelete("{messageId:long}/me")]
    public async Task<IActionResult> DeleteForMe(
        long messageId)
    {
        // -----------------------------------------------------
        // 1. Tìm message
        // -----------------------------------------------------

        var message =
            await db.Messages
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == messageId);

        if (message is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Message not found."
                });
        }


        // -----------------------------------------------------
        // 2. Kiểm tra quyền truy cập Conversation
        // -----------------------------------------------------
        //
        // Private:
        //     phải là member.
        //
        // Department:
        //     phải là member
        //     +
        //     phải thuộc đúng Department.
        //
        // -----------------------------------------------------

        var canAccess =
            await conversationAccess.CanAccessAsync(
                User,
                message.ConversationId);

        if (!canAccess)
        {
            return Forbid();
        }


        // -----------------------------------------------------
        // 3. Tìm MessageUserState của CurrentUser
        // -----------------------------------------------------

        var state =
            await db.MessageUserStates
                .FirstOrDefaultAsync(
                    x =>
                        x.MessageId ==
                            messageId &&

                        x.UserId ==
                            CurrentUserId);

        if (state is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Message state not found."
                });
        }


        // -----------------------------------------------------
        // 4. Xóa riêng phía CurrentUser
        // -----------------------------------------------------

        state.IsDeletedForMe = true;
        state.DeletedForMeAt =
            DateTime.UtcNow;

        await db.SaveChangesAsync();


        // -----------------------------------------------------
        // 5. Response
        // -----------------------------------------------------

        return Ok(
            new
            {
                messageId,

                message =
                    "Message deleted for you."
            });
    }


    // =========================================================
    // XÓA TIN NHẮN CHO MỌI NGƯỜI
    // DELETE /api/messages/{messageId}/everyone
    // =========================================================

    [HttpDelete("{messageId:long}/everyone")]
    public async Task<IActionResult> DeleteForEveryone(
        long messageId)
    {
        // -----------------------------------------------------
        // 1. Tìm message + tất cả UserStates
        // -----------------------------------------------------

        var message =
            await db.Messages
                .Include(x => x.UserStates)
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == messageId);

        if (message is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Message not found."
                });
        }


        // -----------------------------------------------------
        // 2. Kiểm tra quyền truy cập Conversation
        // -----------------------------------------------------

        var canAccess =
            await conversationAccess.CanAccessAsync(
                User,
                message.ConversationId);

        if (!canAccess)
        {
            return Forbid();
        }


        // -----------------------------------------------------
        // 3. Chỉ Sender mới được xóa cho mọi người
        // -----------------------------------------------------

        if (message.SenderId != CurrentUserId)
        {
            return Forbid();
        }


        // -----------------------------------------------------
        // 4. Lấy tất cả receiver
        // -----------------------------------------------------
        //
        // Không lấy state của Sender.
        //
        // Điều này hỗ trợ:
        //
        // Private Conversation:
        //     1 receiver
        //
        // Department Conversation:
        //     nhiều receiver
        //
        // -----------------------------------------------------

        var receiverStates =
            message.UserStates
                .Where(
                    x =>
                        x.UserId !=
                            CurrentUserId)
                .ToList();


        // -----------------------------------------------------
        // 5. Kiểm tra receiver đã đọc hay chưa
        // -----------------------------------------------------
        //
        // Nếu có ÍT NHẤT MỘT receiver đã đọc:
        //
        //     -> không hard delete
        //     -> soft delete
        //
        // Nếu TẤT CẢ receiver chưa đọc:
        //
        //     -> hard delete
        //
        // -----------------------------------------------------

        var hasReadReceiver =
            receiverStates.Any(
                x =>
                    x.IsRead);


        // -----------------------------------------------------
        // 6. TẤT CẢ CHƯA ĐỌC
        // -----------------------------------------------------

        if (!hasReadReceiver)
        {
            db.Messages.Remove(message);

            await db.SaveChangesAsync();

            return Ok(
                new
                {
                    messageId,

                    hardDeleted = true,

                    message =
                        "Message permanently deleted."
                });
        }


        // -----------------------------------------------------
        // 7. CÓ ÍT NHẤT MỘT NGƯỜI ĐÃ ĐỌC
        // -----------------------------------------------------
        //
        // Soft delete.
        //
        // Message vẫn tồn tại trong DB.
        //
        // Frontend có thể hiển thị:
        //
        //     "Tin nhắn đã bị xóa"
        //
        // -----------------------------------------------------

        message.IsDeleted = true;

        message.DeletedAt =
            DateTime.UtcNow;

        message.DeletedBy =
            CurrentUserId;


        /*
         * KHÔNG set:
         *
         * senderState.IsDeletedForMe = true
         *
         * vì CurrentUser vẫn phải nhìn thấy
         * message dưới dạng:
         *
         *     "Tin nhắn đã bị xóa"
         *
         * chứ không phải biến mất hoàn toàn.
         */


        await db.SaveChangesAsync();


        // -----------------------------------------------------
        // 8. Response
        // -----------------------------------------------------

        return Ok(
            new
            {
                messageId,

                hardDeleted = false,

                message =
                    "Message deleted for everyone."
            });
    }
}