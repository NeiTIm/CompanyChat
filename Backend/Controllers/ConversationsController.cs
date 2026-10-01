using CompanyChat.Api.Authorization;
using CompanyChat.Api.Data;
using CompanyChat.Api.DTOs.Conversation;
using CompanyChat.Api.DTOs.User;
using CompanyChat.Api.DTOs.Message;
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
    ConnectionManager connections,
    ConversationAccessService conversationAccess) : ControllerBase
{
    private int CurrentUserId =>
        conversationAccess.GetUserId(User);


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
                .Include(x => x.Department)
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

                    /*
                     * Private conversation không thuộc
                     * Department.
                     */
                    DepartmentId = null,

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
                    other.LastSeen,
                    other.IsActive,
                    other.DepartmentId,
                    other.Department != null
                        ? other.Department.Name
                        : null),

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
         * =================================================
         * KIỂM TRA QUYỀN TRUY CẬP
         * =================================================
         *
         * ConversationAccessService kiểm tra:
         *
         * Private:
         *     -> phải là member
         *
         * Department:
         *     -> phải là member
         *     -> phải thuộc đúng Department
         *
         * Admin không tự động được bypass.
         */

        var canAccess =
            await conversationAccess.CanAccessAsync(
                User,
                conversationId);

        if (!canAccess)
        {
            return Forbid();
        }


        /*
         * =================================================
         * LẤY MEMBER CỦA CURRENT USER
         * =================================================
         *
         * Vẫn lấy ConversationMember riêng để sử dụng
         * HistoryDeletedAt.
         */

        var currentMember =
            await conversationAccess.GetMemberAsync(
                User,
                conversationId);

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
                         * HISTORY DELETE
                         */
                        (
                            historyDeletedAt == null ||

                            x.SentAt >
                                historyDeletedAt
                        ))
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
         * =================================================
         * KIỂM TRA QUYỀN TRUY CẬP
         * =================================================
         */

        var canAccess =
            await conversationAccess.CanAccessAsync(
                User,
                conversationId);

        if (!canAccess)
        {
            return Forbid();
        }


        /*
         * Lấy ConversationMember để sử dụng
         * HistoryDeletedAt.
         */

        var member =
            await conversationAccess.GetMemberAsync(
                User,
                conversationId);

        if (member is null)
        {
            return Forbid();
        }


        /*
         * ==================================================
         * LẤY NHỮNG MESSAGE CHƯA ĐỌC
         * ==================================================
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
     */

    [HttpDelete("{conversationId:int}/history")]
    public async Task<IActionResult>
        DeleteConversationHistory(
            int conversationId)
    {
        /*
         * =================================================
         * KIỂM TRA QUYỀN TRUY CẬP
         * =================================================
         */

        var canAccess =
            await conversationAccess.CanAccessAsync(
                User,
                conversationId);

        if (!canAccess)
        {
            return Forbid();
        }


        /*
         * Lấy ConversationMember của CurrentUser.
         */

        var member =
            await conversationAccess.GetMemberAsync(
                User,
                conversationId);

        if (member is null)
        {
            return Forbid();
        }


        /*
         * Ghi nhận thời điểm CurrentUser
         * xóa lịch sử.
         *
         * User còn lại không bị ảnh hưởng.
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

    /*
 * ==================================================
 * GET OR CREATE DEPARTMENT CONVERSATION
 * ==================================================
 */

    [HttpPost("department")]
    public async Task<ActionResult<DepartmentConversationDto>>
        GetOrCreateDepartment()
    {
        /*
         * =================================================
         * LẤY CURRENT USER
         * =================================================
         */

        var currentUser =
            await db.Users
                .Include(x => x.Department)
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == CurrentUserId &&
                        x.IsActive);

        if (currentUser is null)
        {
            return Unauthorized(
                new
                {
                    message =
                        "Current user not found."
                });
        }


        /*
         * =================================================
         * USER PHẢI THUỘC DEPARTMENT
         * =================================================
         */

        if (currentUser.DepartmentId is null)
        {
            return BadRequest(
                new
                {
                    message =
                        "You are not assigned to a department."
                });
        }

        var departmentId =
            currentUser.DepartmentId.Value;


        /*
         * =================================================
         * DEPARTMENT PHẢI ACTIVE
         * =================================================
         */

        var department =
            currentUser.Department;

        if (department is null ||
            !department.IsActive)
        {
            return BadRequest(
                new
                {
                    message =
                        "Your department is not active."
                });
        }


        /*
         * =================================================
         * TÌM DEPARTMENT CONVERSATION
         * =================================================
         */

        var conversation =
            await db.Conversations
                .FirstOrDefaultAsync(
                    x =>
                        x.Type == "Department" &&
                        x.DepartmentId ==
                            departmentId);


        /*
         * =================================================
         * CHƯA CÓ → TẠO CONVERSATION
         * =================================================
         */

        if (conversation is null)
        {
            conversation =
                new Conversation
                {
                    Type =
                        "Department",

                    DepartmentId =
                        departmentId
                };

            db.Conversations.Add(
                conversation);

            await db.SaveChangesAsync();
        }


        /*
         * =================================================
         * ĐẢM BẢO CURRENT USER LÀ MEMBER
         * =================================================
         */

        var isMember =
            await db.ConversationMembers
                .AnyAsync(
                    x =>
                        x.ConversationId ==
                            conversation.Id &&

                        x.UserId ==
                            CurrentUserId);

        if (!isMember)
        {
            db.ConversationMembers.Add(
                new ConversationMember
                {
                    ConversationId =
                        conversation.Id,

                    UserId =
                        CurrentUserId
                });

            await db.SaveChangesAsync();
        }


        /*
         * =================================================
         * ĐẢM BẢO CÁC USER ACTIVE TRONG DEPARTMENT
         * LÀ MEMBER CỦA DEPARTMENT CHAT
         * =================================================
         */

        var departmentUserIds =
            await db.Users
                .Where(
                    x =>
                        x.IsActive &&
                        x.DepartmentId ==
                            departmentId)
                .Select(
                    x =>
                        x.Id)
                .ToListAsync();

        var existingMemberIds =
            await db.ConversationMembers
                .Where(
                    x =>
                        x.ConversationId ==
                            conversation.Id)
                .Select(
                    x =>
                        x.UserId)
                .ToListAsync();

        var newMemberIds =
            departmentUserIds
                .Except(existingMemberIds)
                .ToList();

        if (newMemberIds.Count > 0)
        {
            foreach (
                var userId
                in newMemberIds)
            {
                db.ConversationMembers.Add(
                    new ConversationMember
                    {
                        ConversationId =
                            conversation.Id,

                        UserId =
                            userId
                    });
            }

            await db.SaveChangesAsync();
        }


        /*
         * =================================================
         * TRẢ RESPONSE
         * =================================================
         */

        return Ok(
            new DepartmentConversationDto(
                conversation.Id,
                conversation.Type,
                department.Id,
                department.Name,
                conversation.CreatedAt));
    }


}