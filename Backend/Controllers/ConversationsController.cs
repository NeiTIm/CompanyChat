using System.Security.Claims;
using CompanyChat.Api.Data;
using CompanyChat.Api.DTOs;
using CompanyChat.Api.Models;
using CompanyChat.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Controllers;

[ApiController]
[Route("api/conversations")]
[Authorize]
public class ConversationsController(
    AppDbContext db,
    ConnectionManager connections) : ControllerBase
{
    private int CurrentUserId =>
        int.Parse(
            User.FindFirstValue(
                ClaimTypes.NameIdentifier)!);


    /*
     * ==================================================
     * GET OR CREATE PRIVATE CONVERSATION
     * ==================================================
     */

    [HttpPost("private/{otherUserId:int}")]
    public async Task<ActionResult<ConversationDto>>
        GetOrCreatePrivate(
            int otherUserId)
    {
        if (otherUserId == CurrentUserId)
        {
            return BadRequest(
                new
                {
                    message =
                        "You cannot chat with yourself."
                });
        }

        var other =
            await db.Users
                .FirstOrDefaultAsync(
                    x =>
                        x.Id ==
                            otherUserId &&
                        x.IsActive);

        if (other is null)
        {
            return NotFound(
                new
                {
                    message =
                        "User not found."
                });
        }

        var conversation =
            await db.Conversations
                .Include(x => x.Members)
                .FirstOrDefaultAsync(
                    x =>
                        x.Type ==
                            "Private" &&

                        x.Members.Count ==
                            2 &&

                        x.Members.Any(
                            m =>
                                m.UserId ==
                                    CurrentUserId) &&

                        x.Members.Any(
                            m =>
                                m.UserId ==
                                    otherUserId));

        if (conversation is null)
        {
            conversation =
                new Conversation
                {
                    Type = "Private",

                    Members =
                    [
                        new ConversationMember
                        {
                            UserId =
                                CurrentUserId
                        },

                        new ConversationMember
                        {
                            UserId =
                                otherUserId
                        }
                    ]
                };

            db.Conversations.Add(
                conversation);

            await db.SaveChangesAsync();
        }

        return Ok(
            new ConversationDto(
                conversation.Id,
                conversation.Type,

                new UserDto(
                    other.Id,
                    other.Username,
                    other.FullName,
                    other.Email,
                    other.Role,
                    other.IsOnline,
                    other.LastSeen),

                conversation.CreatedAt));
    }

    [HttpGet("unread")]
    public async Task<ActionResult<IEnumerable<UnreadConversationDto>>>
        GetUnreadCounts()
    {
        var unreadCounts =
            await db.MessageUserStates
                .Where(x =>
                    x.UserId == CurrentUserId &&
                    !x.IsRead &&
                    !x.IsDeletedForMe)
                .GroupBy(x => x.Message.ConversationId)
                .Select(x =>
                    new UnreadConversationDto(
                        x.Key,
                        x.Select(s => s.Message.SenderId)
                            .FirstOrDefault(),
                        x.Count()))
                .ToListAsync();

        return Ok(unreadCounts);
    }

    /*
     * ==================================================
     * GET MESSAGES
     * ==================================================
     */

    [HttpGet("{conversationId:int}/messages")]
    public async Task<ActionResult<IEnumerable<MessageDto>>>
        GetMessages(
            int conversationId,
            [FromQuery] int take = 50)
    {
        take =
            Math.Clamp(
                take,
                1,
                100);

        var isMember =
            await db.ConversationMembers
                .AnyAsync(
                    x =>
                        x.ConversationId ==
                            conversationId &&

                        x.UserId ==
                            CurrentUserId);

        if (!isMember)
        {
            return Forbid();
        }

        /*
         * ==================================================
         * QUAN TRỌNG
         *
         * KHÔNG lọc !x.IsDeleted ở đây.
         *
         * Vì nếu message đã bị xóa cho mọi người nhưng
         * người nhận đã đọc trước đó thì người nhận phải
         * thấy:
         *
         * "Tin nhắn đã bị xóa"
         *
         * Chỉ lọc IsDeletedForMe của CurrentUser.
         * ==================================================
         */

        var messages =
            await db.Messages
                .Include(x => x.UserStates)
                .Include(x => x.Sender)
                .Where(
                    x =>
                        x.ConversationId ==
                            conversationId &&

                        !x.UserStates.Any(
                            s =>
                                s.UserId ==
                                    CurrentUserId &&

                                s.IsDeletedForMe))
                .OrderByDescending(
                    x => x.SentAt)
                .Take(take)
                .ToListAsync();

        messages.Reverse();


        /*
         * ==============================================
         * Những message receiver vừa tải về
         * được xem là đã nhận.
         * ==============================================
         */

        var undeliveredStates =
            messages
                .SelectMany(
                    x =>
                        x.UserStates
                            .Where(
                                s =>
                                    s.UserId ==
                                        CurrentUserId &&

                                    !s.IsDelivered))
                .ToList();

        if (undeliveredStates.Count > 0)
        {
            var now =
                DateTime.UtcNow;

            foreach (
                var state
                in undeliveredStates)
            {
                state.IsDelivered = true;
                state.DeliveredAt = now;
            }

            await db.SaveChangesAsync();


            /*
             * Báo cho sender:
             * message đã delivered.
             */

            foreach (
                var state
                in undeliveredStates)
            {
                var senderId =
                    messages
                        .First(
                            x =>
                                x.Id ==
                                    state.MessageId)
                        .SenderId;

                await SendMessageStatusAsync(
                    senderId,
                    state.MessageId,
                    "delivered");
            }
        }


        /*
         * ==================================================
         * TẠO DTO
         * ==================================================
         */

        var result =
            messages.Select(
                x =>
                {
                    var deliveryStatus =
                        GetDeliveryStatus(
                            x);

                    return new MessageDto(
                        x.Id,
                        x.ConversationId,
                        x.SenderId,
                        x.Sender.FullName,
                        x.Content,
                        x.SentAt,
                        x.IsDeleted,
                        deliveryStatus);
                })
                .ToList();

        return Ok(result);
    }


    /*
     * ==================================================
     * MARK CONVERSATION AS READ
     * ==================================================
     */

    [HttpPost("{conversationId:int}/read")]
    public async Task<IActionResult>
        MarkAsRead(
            int conversationId)
    {
        var isMember =
            await db.ConversationMembers
                .AnyAsync(
                    x =>
                        x.ConversationId ==
                            conversationId &&

                        x.UserId ==
                            CurrentUserId);

        if (!isMember)
        {
            return Forbid();
        }

        var unreadStates =
            await db.MessageUserStates
                .Include(x => x.Message)
                .Where(
                    x =>
                        x.UserId ==
                            CurrentUserId &&

                        x.Message.ConversationId ==
                            conversationId &&

                        !x.IsRead &&

                        !x.IsDeletedForMe)
                .ToListAsync();

        if (unreadStates.Count == 0)
        {
            return Ok(
                new
                {
                    message =
                        "No unread messages.",

                    count = 0
                });
        }

        var now =
            DateTime.UtcNow;

        foreach (
            var state
            in unreadStates)
        {
            state.IsRead = true;
            state.ReadAt = now;

            /*
             * Đọc được thì chắc chắn
             * đã nhận.
             */

            state.IsDelivered = true;

            if (state.DeliveredAt is null)
            {
                state.DeliveredAt =
                    now;
            }
        }

        await db.SaveChangesAsync();


        /*
         * Báo cho sender:
         * message đã READ.
         */

        foreach (
            var state
            in unreadStates)
        {
            await SendMessageStatusAsync(
                state.Message.SenderId,
                state.MessageId,
                "read");
        }

        return Ok(
            new
            {
                message =
                    "Messages marked as read.",

                count =
                    unreadStates.Count
            });
    }


    /*
     * ==================================================
     * DELIVERY STATUS
     * ==================================================
     */

    private static string GetDeliveryStatus(
        Message message)
    {
        /*
         * Message của người khác:
         * frontend không cần hiển thị
         * trạng thái gửi.
         */

        if (message.SenderId != 0)
        {
            var receiverState =
                message.UserStates
                    .FirstOrDefault(
                        x =>
                            x.UserId !=
                            message.SenderId);

            if (receiverState is null)
            {
                return "sent";
            }

            if (receiverState.IsRead)
            {
                return "read";
            }

            if (receiverState.IsDelivered)
            {
                return "delivered";
            }
        }

        return "sent";
    }


    /*
     * ==================================================
     * SEND MESSAGE STATUS VIA WEBSOCKET
     * ==================================================
     */

    private async Task SendMessageStatusAsync(
        int userId,
        long messageId,
        string status)
    {
        var json =
            System.Text.Json.JsonSerializer.Serialize(
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


    /*
     * =========================================================
     * XÓA TOÀN BỘ LỊCH SỬ CUỘC TRÒ CHUYỆN
     *
     * LOGIC:
     *
     * 1. Người nhận CHƯA ĐỌC
     *    → XÓA MESSAGE KHỎI DATABASE
     *    → A mất
     *    → B cũng mất
     *
     * 2. Người nhận ĐÃ ĐỌC
     *    → KHÔNG xóa Message
     *    → Message.IsDeleted = true
     *    → A: IsDeletedForMe = true
     *    → B: thấy "Tin nhắn đã bị xóa"
     * =========================================================
     */

    [HttpDelete("{conversationId:int}/messages")]
    public async Task<IActionResult>
        DeleteConversationHistory(
            int conversationId)
    {
        /*
         * Kiểm tra CurrentUser có thuộc
         * conversation hay không.
         */

        var isMember =
            await db.ConversationMembers
                .AnyAsync(
                    x =>
                        x.ConversationId ==
                            conversationId &&

                        x.UserId ==
                            CurrentUserId);

        if (!isMember)
        {
            return Forbid();
        }


        /*
         * Lấy toàn bộ message
         * trong conversation.
         */

        var messages =
            await db.Messages
                .Include(x => x.UserStates)
                .Where(
                    x =>
                        x.ConversationId ==
                            conversationId)
                .ToListAsync();

        if (messages.Count == 0)
        {
            return Ok(
                new
                {
                    conversationId,

                    deletedCount = 0,

                    message =
                        "Conversation history is already empty."
                });
        }


        var hardDeletedCount = 0;
        var softDeletedCount = 0;


        foreach (var message in messages)
        {
            /*
             * Tìm người nhận.
             *
             * Trong private conversation:
             * UserStates gồm:
             *
             * CurrentUser
             * OtherUser
             */

            var receiverState =
                message.UserStates
                    .FirstOrDefault(
                        x =>
                            x.UserId !=
                            CurrentUserId);


            /*
             * =================================================
             * TRƯỜNG HỢP 1
             *
             * NGƯỜI NHẬN CHƯA ĐỌC
             *
             * → XÓA HẲN MESSAGE
             *
             * → A mất
             * → B mất
             * =================================================
             */

            if (receiverState is not null &&
                !receiverState.IsRead)
            {
                db.Messages.Remove(message);

                hardDeletedCount++;

                continue;
            }


            /*
             * =================================================
             * TRƯỜNG HỢP 2
             *
             * NGƯỜI NHẬN ĐÃ ĐỌC
             *
             * → Giữ Message
             * → Đánh dấu IsDeleted
             * → A không thấy
             * → B thấy "Tin nhắn đã bị xóa"
             * =================================================
             */

            message.IsDeleted = true;
            message.DeletedAt = DateTime.UtcNow;
            message.DeletedBy = CurrentUserId;


            /*
             * CurrentUser không còn thấy message.
             */

            var myState =
                message.UserStates
                    .FirstOrDefault(
                        x =>
                            x.UserId ==
                            CurrentUserId);

            if (myState is not null)
            {
                myState.IsDeletedForMe = true;
                myState.DeletedForMeAt =
                    DateTime.UtcNow;
            }

            softDeletedCount++;
        }


        await db.SaveChangesAsync();


        return Ok(
            new
            {
                conversationId,

                hardDeletedCount,

                softDeletedCount,

                message =
                    "Conversation history deleted."
            });
    }
}