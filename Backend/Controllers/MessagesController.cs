using System.Security.Claims;
using CompanyChat.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Controllers;

[ApiController]
[Route("api/messages")]
[Authorize]
public class MessagesController(AppDbContext db) : ControllerBase
{
    private int CurrentUserId =>
        int.Parse(
            User.FindFirstValue(
                ClaimTypes.NameIdentifier)!);

    // =========================================================
    // XÓA CHỈ Ở PHÍA TÔI
    // =========================================================

    [HttpDelete("{messageId:long}/me")]
    public async Task<IActionResult> DeleteForMe(long messageId)
    {
        var state = await db.MessageUserStates
            .FirstOrDefaultAsync(x =>
                x.MessageId == messageId &&
                x.UserId == CurrentUserId);

        if (state is null)
        {
            return NotFound(new
            {
                message = "Message not found."
            });
        }

        state.IsDeletedForMe = true;
        state.DeletedForMeAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        return Ok(new
        {
            messageId,
            message = "Message deleted for you."
        });
    }


    // =========================================================
    // XÓA Ở CẢ HAI PHÍA
    // =========================================================

    [HttpDelete("{messageId:long}/everyone")]
    public async Task<IActionResult> DeleteForEveryone(
        long messageId)
    {
        var message = await db.Messages
            .Include(x => x.UserStates)
            .FirstOrDefaultAsync(x =>
                x.Id == messageId);

        if (message is null)
        {
            return NotFound(new
            {
                message = "Message not found."
            });
        }

        // Chỉ người gửi mới được xóa cho mọi người
        if (message.SenderId != CurrentUserId)
        {
            return Forbid();
        }

        // Tìm trạng thái của người nhận
        var receiverState = message.UserStates
            .FirstOrDefault(x =>
                x.UserId != CurrentUserId);

        // =====================================================
        // NGƯỜI NHẬN CHƯA ĐỌC
        // → XÓA HOÀN TOÀN KHỎI DATABASE
        // → CẢ HAI KHÔNG CÒN THẤY
        // =====================================================

        if (receiverState is not null &&
            !receiverState.IsRead)
        {
            db.Messages.Remove(message);

            await db.SaveChangesAsync();

            return Ok(new
            {
                messageId,
                hardDeleted = true,
                message = "Message permanently deleted."
            });
        }

        // =====================================================
        // NGƯỜI NHẬN ĐÃ ĐỌC
        // → GIỮ MESSAGE
        // → HIỂN THỊ "TIN NHẮN ĐÃ BỊ XÓA" CHO NGƯỜI NHẬN
        // =====================================================

        message.IsDeleted = true;
        message.DeletedAt = DateTime.UtcNow;
        message.DeletedBy = CurrentUserId;

        // Người gửi cũng không còn thấy nội dung message
        var senderState = message.UserStates
            .FirstOrDefault(x =>
                x.UserId == CurrentUserId);

        if (senderState is not null)
        {
            senderState.IsDeletedForMe = true;
            senderState.DeletedForMeAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();

        return Ok(new
        {
            messageId,
            hardDeleted = false,
            message = "Message deleted for everyone."
        });
    }
}