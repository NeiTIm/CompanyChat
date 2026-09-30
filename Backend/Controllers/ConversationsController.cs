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
                        x.Id == otherUserId &&
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
                        x.Type == "Private" &&

                        x.Members.Count == 2 &&

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


    /*
     * ==================================================
     * GET UNREAD COUNTS
     * ==================================================
     */

    [HttpGet("unread")]
    public async Task<ActionResult<IEnumerable<UnreadConversationDto>>>
        GetUnreadCounts()
    {
        var unreadCounts =
            await db.MessageUserStates
                .Where(x =>
                    x.UserId ==
                        CurrentUserId &&

                    !x.IsRead &&

                    !x.IsDeletedForMe &&

                    /*
                     * Không tính những message
                     * nằm trước thời điểm CurrentUser
                     * xóa lịch sử.
                     */
                    x.Message.Conversation.Members
                        .Any(
                            m =>
                                m.UserId ==
                                    CurrentUserId &&

                                (
                                    m.HistoryDeletedAt ==
                                        null ||

                                    x.Message.SentAt >
                                        m.HistoryDeletedAt
                                )))
                .GroupBy(
                    x =>
                        x.Message.ConversationId)
                .Select(
                    x =>
                        new UnreadConversationDto(
                            x.Key,

                            x.Select(
                                s =>
                                    s.Message.SenderId)
                                .FirstOrDefault(),

                            x.Count()))
                .ToListAsync();

        return Ok(
            unreadCounts);
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


        /*
         * ==================================================
         * LẤY MEMBER CỦA CURRENT USER
         * ==================================================
         */

        var currentMember =
            await db.ConversationMembers
                .FirstOrDefaultAsync(
                    x =>
                        x.ConversationId ==
                            conversationId &&

                        x.UserId ==
                            CurrentUserId);

        if (currentMember is null)
        {
            return Forbid();
        }

        var historyDeletedAt =
            currentMember.HistoryDeletedAt;


        /*
         * ==================================================
         * LẤY MESSAGES
         * ==================================================
         *
         * Nếu CurrentUser chưa từng xóa lịch sử:
         *
         *     historyDeletedAt == null
         *
         *     -> lấy toàn bộ message.
         *
         *
         * Nếu CurrentUser đã xóa lịch sử:
         *
         *     x.SentAt <= historyDeletedAt
         *
         *     -> message cũ không trả về nữa.
         *
         *
         *     x.SentAt > historyDeletedAt
         *
         *     -> message mới vẫn trả về.
         *
         *
         * Quan trọng:
         *
         * Message KHÔNG bị xóa khỏi database.
         *
         * Chỉ là CurrentUser không nhìn thấy
         * những message trước thời điểm xóa lịch sử.
         */

        var messages =
            await db.Messages

                .Include(x => x.UserStates)

                .Include(x => x.Sender)

                /*
                 * Reply message
                 */
                .Include(x => x.ReplyToMessage)
                    .ThenInclude(x => x!.Sender)

                .Where(
                    x =>
                        x.ConversationId ==
                            conversationId &&

                        /*
                         * Không lấy những message
                         * mà CurrentUser đã
                         * "xóa cho tôi".
                         */
                        !x.UserStates.Any(
                            s =>
                                s.UserId ==
                                    CurrentUserId &&

                                s.IsDeletedForMe) &&

                        /*
                         * =========================================
                         * HISTORY DELETE
                         * =========================================
                         *
                         * Chưa xóa lịch sử:
                         *
                         *     lấy tất cả.
                         *
                         * Đã xóa lịch sử:
                         *
                         *     chỉ lấy message mới hơn
                         *     thời điểm xóa.
                         */
                        (
                            historyDeletedAt == null ||

                            x.SentAt >
                                historyDeletedAt
                        )
                )
                .OrderByDescending(
                    x =>
                        x.SentAt)
                .Take(take)
                .ToListAsync();

        messages.Reverse();


        /*
         * ==================================================
         * MARK MESSAGE AS DELIVERED
         * ==================================================
         *
         * Chỉ những message thực sự được load
         * mới được đánh dấu delivered.
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
                        GetDeliveryStatus(x);

                    return new MessageDto(
                        x.Id,
                        x.ConversationId,
                        x.SenderId,
                        x.Sender.FullName,
                        x.Content,
                        x.SentAt,
                        x.IsDeleted,
                        deliveryStatus,
                        x.ReplyToMessageId,

                        x.ReplyToMessage is null
                            ? null
                            : new ReplyMessageDto(
                                x.ReplyToMessage.Id,
                                x.ReplyToMessage.SenderId,
                                x.ReplyToMessage.Sender.FullName,
                                x.ReplyToMessage.Content));
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
        /*
         * Lấy ConversationMember của CurrentUser.
         */

        var member =
            await db.ConversationMembers
                .FirstOrDefaultAsync(
                    x =>
                        x.ConversationId ==
                            conversationId &&

                        x.UserId ==
                            CurrentUserId);

        if (member is null)
        {
            return Forbid();
        }


        /*
         * Lấy những message chưa đọc.
         */

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

                        !x.IsDeletedForMe &&

                        /*
                         * Không mark read những message
                         * nằm trước HistoryDeletedAt.
                         */
                        (
                            member.HistoryDeletedAt ==
                                null ||

                            x.Message.SentAt >
                                member.HistoryDeletedAt
                        ))
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
             * Đã đọc thì chắc chắn đã nhận.
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
         * ==================================================
         * BÁO CHO SENDER:
         * MESSAGE ĐÃ READ
         * ==================================================
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
     * XÓA LỊCH SỬ CUỘC TRÒ CHUYỆN
     * =========================================================
     *
     * Đây là:
     *
     *     "Xóa lịch sử cho tôi"
     *
     * Không phải:
     *
     *     "Xóa message cho mọi người"
     *
     *
     * Logic:
     *
     *     ConversationMember.HistoryDeletedAt
     *                         ↓
     *                    DateTime.UtcNow
     *
     *
     * Không:
     *
     * - Xóa Message
     * - Message.IsDeleted = true
     * - Xóa MessageUserState
     * - Ảnh hưởng user còn lại
     * - Ảnh hưởng Reply
     *
     * =========================================================
     */

    [HttpDelete("{conversationId:int}/history")]
    public async Task<IActionResult>
        DeleteConversationHistory(
            int conversationId)
    {
        /*
         * Lấy ConversationMember của CurrentUser.
         */

        var member =
            await db.ConversationMembers
                .FirstOrDefaultAsync(
                    x =>
                        x.ConversationId ==
                            conversationId &&

                        x.UserId ==
                            CurrentUserId);

        if (member is null)
        {
            return Forbid();
        }


        /*
         * Ghi nhận thời điểm CurrentUser
         * xóa lịch sử.
         *
         * User còn lại có ConversationMember
         * riêng nên hoàn toàn không bị ảnh hưởng.
         */

        member.HistoryDeletedAt =
            DateTime.UtcNow;

        await db.SaveChangesAsync();


        return Ok(
            new
            {
                conversationId,

                historyDeletedAt =
                    member.HistoryDeletedAt,

                message =
                    "Conversation history deleted."
            });
    }
}