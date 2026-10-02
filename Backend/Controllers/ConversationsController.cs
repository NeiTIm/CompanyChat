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
     conversationAccess.GetUserId(User)
     ?? throw new UnauthorizedAccessException();


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
                .Where(
                    x =>
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
                        new
                        {
                            x.Message.ConversationId,

                            x.Message.Conversation.Type
                        })
                .Select(
                    x =>
                        new UnreadConversationDto(
                            x.Key.ConversationId,

                            /*
                             * Private:
                             * UserId là người gửi.
                             *
                             * Department:
                             * Không dùng UserId để đại diện
                             * cho unread của phòng ban.
                             */
                            x.Key.Type == "Private"
                                ? x.Select(
                                    s =>
                                        s.Message.SenderId)
                                    .FirstOrDefault()
                                : 0,

                            x.Key.Type,

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

                .Include(x => x.ReplyToMessage)
                    .ThenInclude(x => x!.Sender)

                .Where(
                    x =>
                        x.ConversationId ==
                            conversationId &&

                        /*
                         * Không lấy những message
                         * mà CurrentUser đã xóa cho tôi.
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
         * Lấy ConversationMember
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
         * Lấy ConversationMember
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

    /*
    * ==================================================
    * CREATE GROUP CONVERSATION
    * ==================================================
    */

    [HttpPost("group")]
    public async Task<IActionResult> CreateGroup(
        [FromBody] CreateGroupRequest request)
    {
        // Kiểm tra tên group
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new
            {
                message = "Group name is required."
            });
        }

        var groupName = request.Name.Trim();

        if (groupName.Length > 100)
        {
            return BadRequest(new
            {
                message = "Group name cannot exceed 100 characters."
            });
        }


        // Lấy danh sách member hợp lệ
        var memberIds = request.MemberIds
            .Where(x => x > 0)
            .Distinct()
            .ToList();


        // Không tính người tạo vào danh sách member
        memberIds.Remove(CurrentUserId);

        if (memberIds.Count == 0)
        {
            return BadRequest(new
            {
                message =
                    "A group must have at least one other member."
            });
        }


        // Kiểm tra các user có tồn tại và đang Active
        var users = await db.Users
            .Where(x =>
                memberIds.Contains(x.Id) &&
                x.IsActive)
            .Select(x => x.Id)
            .ToListAsync();


        var invalidUserIds = memberIds
            .Except(users)
            .ToList();

        if (invalidUserIds.Count > 0)
        {
            return BadRequest(new
            {
                message =
                    "One or more selected users are invalid or inactive.",

                invalidUserIds
            });
        }


        // Tạo group conversation
        var conversation = new Conversation
        {
            Type = "Group",

            Name = groupName,

            CreatedBy = CurrentUserId,

            DepartmentId = null
        };

        db.Conversations.Add(conversation);


        // Thêm người tạo làm Owner
        conversation.Members.Add(
            new ConversationMember
            {
                UserId = CurrentUserId,
                Role = "Owner"
            });


        // Thêm các member vào group
        foreach (var userId in memberIds)
        {
            conversation.Members.Add(
                new ConversationMember
                {
                    UserId = userId,
                    Role = "Member"
                });
        }


        // Lưu database
        await db.SaveChangesAsync();


        // Trả thông tin group vừa tạo
        return Ok(new
        {
            conversationId = conversation.Id,

            type = conversation.Type,

            name = conversation.Name,

            createdBy = conversation.CreatedBy,

            createdAt = conversation.CreatedAt,

            members = conversation.Members
                .Select(x => new
                {
                    userId = x.UserId,
                    role = x.Role
                })
                .ToList()
        });
    }

    /*
    * ==================================================
    * GET MY GROUPS
    * ==================================================
    */

    [HttpGet("groups")]
    public async Task<IActionResult> GetMyGroups()
    {
        /*
         * ==================================================
         * LẤY CÁC GROUP CURRENT USER ĐANG THAM GIA
         * ==================================================
         */

        var groups = await db.Conversations
            .Where(x =>
                x.Type == "Group" &&

                x.Members.Any(
                    m =>
                        m.UserId == CurrentUserId))
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                conversationId = x.Id,

                type = x.Type,

                name = x.Name,

                createdBy = x.CreatedBy,

                createdAt = x.CreatedAt,

                memberCount = x.Members.Count()
            })
            .ToListAsync();


        /*
         * ==================================================
         * TRẢ RESPONSE
         * ==================================================
         */

        return Ok(groups);
    }

    /*
    * ==================================================
    * GET GROUP MEMBERS
    * ==================================================
    */

    [HttpGet("{conversationId:int}/members")]
    public async Task<IActionResult> GetGroupMembers(
        int conversationId)
    {
        /*
         * ==================================================
         * KIỂM TRA GROUP
         * ==================================================
         */

        var conversation =
            await db.Conversations
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == conversationId &&
                        x.Type == "Group");

        if (conversation is null)
        {
            return NotFound(
                new
                {
                    message = "Group not found."
                });
        }


        /*
         * ==================================================
         * KIỂM TRA CURRENT USER CÓ PHẢI MEMBER
         * ==================================================
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
         * ==================================================
         * LẤY DANH SÁCH MEMBER
         * ==================================================
         */

        var members =
            await db.ConversationMembers
                .Where(
                    x =>
                        x.ConversationId ==
                            conversationId)
                .Include(x => x.User)
                .ThenInclude(x => x.Department)
                .Select(
                    x => new
                    {
                        userId =
                            x.UserId,

                        username =
                            x.User.Username,

                        fullName =
                            x.User.FullName,

                        email =
                            x.User.Email,

                        role =
                            x.Role,

                        isOnline =
                            x.User.IsOnline,

                        lastSeen =
                            x.User.LastSeen,

                        departmentId =
                            x.User.DepartmentId,

                        departmentName =
                            x.User.Department != null
                                ? x.User.Department.Name
                                : null,

                        isActive =
                            x.User.IsActive
                    })
                .OrderBy(
                    x =>
                        x.role == "Owner"
                            ? 0
                            : x.role == "Admin"
                                ? 1
                                : 2)
                .ThenBy(
                    x =>
                        x.fullName)
                .ToListAsync();


        /*
         * ==================================================
         * TRẢ RESPONSE
         * ==================================================
         */

        return Ok(
            new
            {
                conversationId,

                total =
                    members.Count,

                members
            });
    }

    /*
    * ==================================================
    * ADD MEMBER TO GROUP
    * ==================================================
    */

    [HttpPost("{conversationId:int}/members")]
    public async Task<IActionResult> AddGroupMember(
        int conversationId,
        [FromBody] AddGroupMemberRequest request)
    {
        /*
         * ==================================================
         * KIỂM TRA GROUP
         * ==================================================
         */

        var conversation =
            await db.Conversations
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == conversationId &&
                        x.Type == "Group");

        if (conversation is null)
        {
            return NotFound(
                new
                {
                    message = "Group not found."
                });
        }


        /*
         * ==================================================
         * LẤY ROLE CỦA CURRENT USER
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


        /*
         * ==================================================
         * CHỈ OWNER / ADMIN ĐƯỢC THÊM MEMBER
         * ==================================================
         */

        if (currentMember.Role != "Owner" &&
            currentMember.Role != "Admin")
        {
            return Forbid();
        }


        /*
         * ==================================================
         * KHÔNG ĐƯỢC TỰ THÊM CHÍNH MÌNH
         * ==================================================
         */

        if (request.UserId == CurrentUserId)
        {
            return BadRequest(
                new
                {
                    message =
                        "You are already a member of this group."
                });
        }


        /*
         * ==================================================
         * KIỂM TRA USER
         * ==================================================
         */

        var user =
            await db.Users
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == request.UserId &&
                        x.IsActive);

        if (user is null)
        {
            return NotFound(
                new
                {
                    message =
                        "User not found or inactive."
                });
        }


        /*
         * ==================================================
         * KIỂM TRA USER ĐÃ Ở TRONG GROUP CHƯA
         * ==================================================
         */

        var alreadyMember =
            await db.ConversationMembers
                .AnyAsync(
                    x =>
                        x.ConversationId ==
                            conversationId &&

                        x.UserId ==
                            request.UserId);

        if (alreadyMember)
        {
            return Conflict(
                new
                {
                    message =
                        "User is already a member of this group."
                });
        }


        /*
         * ==================================================
         * THÊM MEMBER
         * ==================================================
         */

        var member =
            new ConversationMember
            {
                ConversationId =
                    conversationId,

                UserId =
                    request.UserId,

                Role =
                    "Member"
            };

        db.ConversationMembers.Add(member);

        await db.SaveChangesAsync();


        /*
         * ==================================================
         * RESPONSE
         * ==================================================
         */

        return Ok(
            new
            {
                conversationId,

                userId =
                    user.Id,

                username =
                    user.Username,

                fullName =
                    user.FullName,

                role =
                    member.Role,

                message =
                    "Member added successfully."
            });
    }

    /*
    * ==================================================
    * REMOVE MEMBER FROM GROUP
    * ==================================================
    */

    [HttpDelete("{conversationId:int}/members")]
    public async Task<IActionResult> RemoveGroupMember(
        int conversationId,
        [FromBody] RemoveGroupMemberRequest request)
    {
        /*
         * ==================================================
         * KIỂM TRA GROUP
         * ==================================================
         */

        var conversation =
            await db.Conversations
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == conversationId &&
                        x.Type == "Group");

        if (conversation is null)
        {
            return NotFound(
                new
                {
                    message = "Group not found."
                });
        }


        /*
         * ==================================================
         * LẤY ROLE CỦA CURRENT USER
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


        /*
         * ==================================================
         * CHỈ OWNER / ADMIN ĐƯỢC XÓA MEMBER
         * ==================================================
         */

        if (currentMember.Role != "Owner" &&
            currentMember.Role != "Admin")
        {
            return Forbid();
        }


        /*
         * ==================================================
         * KHÔNG ĐƯỢC TỰ XÓA CHÍNH MÌNH
         * ==================================================
         */

        if (request.UserId == CurrentUserId)
        {
            return BadRequest(
                new
                {
                    message =
                        "You cannot remove yourself from the group."
                });
        }


        /*
         * ==================================================
         * LẤY MEMBER CẦN XÓA
         * ==================================================
         */

        var targetMember =
            await db.ConversationMembers
                .FirstOrDefaultAsync(
                    x =>
                        x.ConversationId ==
                            conversationId &&

                        x.UserId ==
                            request.UserId);

        if (targetMember is null)
        {
            return NotFound(
                new
                {
                    message =
                        "User is not a member of this group."
                });
        }


        /*
         * ==================================================
         * KIỂM TRA QUYỀN OWNER / ADMIN
         * ==================================================
         */

        /*
         * Owner có thể xóa Admin hoặc Member.
         */

        if (currentMember.Role == "Owner")
        {
            // Owner được phép xóa Admin / Member.
        }

        /*
         * Admin chỉ được xóa Member.
         */

        else if (currentMember.Role == "Admin")
        {
            if (targetMember.Role != "Member")
            {
                return Forbid();
            }
        }


        /*
         * ==================================================
         * XÓA MEMBER
         * ==================================================
         */

        db.ConversationMembers.Remove(
            targetMember);

        await db.SaveChangesAsync();


        /*
         * ==================================================
         * RESPONSE
         * ==================================================
         */

        return Ok(
            new
            {
                conversationId,

                userId =
                    request.UserId,

                message =
                    "Member removed successfully."
            });
    }

    /*
    * ==================================================
    * UPDATE GROUP MEMBER ROLE
    * ==================================================
    */

    [HttpPatch("{conversationId:int}/members/{userId:int}/role")]
    public async Task<IActionResult> UpdateGroupMemberRole(
        int conversationId,
        int userId,
        [FromBody] UpdateGroupMemberRoleRequest request)
    {
        /*
         * ==================================================
         * KIỂM TRA GROUP
         * ==================================================
         */

        var conversation =
            await db.Conversations
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == conversationId &&
                        x.Type == "Group");

        if (conversation is null)
        {
            return NotFound(
                new
                {
                    message = "Group not found."
                });
        }

        /*
         * ==================================================
         * LẤY MEMBER HIỆN TẠI
         * ==================================================
         */

        var currentMember =
            await db.ConversationMembers
                .FirstOrDefaultAsync(
                    x =>
                        x.ConversationId == conversationId &&
                        x.UserId == CurrentUserId);

        if (currentMember is null)
        {
            return Forbid();
        }

        /*
         * ==================================================
         * CHỈ OWNER ĐƯỢC ĐỔI ROLE
         * ==================================================
         */

        if (currentMember.Role != "Owner")
        {
            return Forbid();
        }

        /*
         * ==================================================
         * KHÔNG CHO TỰ ĐỔI ROLE
         * ==================================================
         */

        if (userId == CurrentUserId)
        {
            return BadRequest(
                new
                {
                    message =
                        "You cannot change your own role."
                });
        }

        /*
         * ==================================================
         * KIỂM TRA ROLE MỚI
         * ==================================================
         */

        var newRole =
            request.Role?.Trim();

        if (newRole != "Admin" &&
            newRole != "Member")
        {
            return BadRequest(
                new
                {
                    message =
                        "Role must be Admin or Member."
                });
        }

        /*
         * ==================================================
         * TÌM MEMBER CẦN ĐỔI ROLE
         * ==================================================
         */

        var targetMember =
            await db.ConversationMembers
                .FirstOrDefaultAsync(
                    x =>
                        x.ConversationId == conversationId &&
                        x.UserId == userId);

        if (targetMember is null)
        {
            return NotFound(
                new
                {
                    message =
                        "User is not a member of this group."
                });
        }

        /*
         * ==================================================
         * KHÔNG CHO ĐỔI OWNER
         * ==================================================
         */

        if (targetMember.Role == "Owner")
        {
            return BadRequest(
                new
                {
                    message =
                        "Owner role cannot be changed."
                });
        }

        /*
         * ==================================================
         * KIỂM TRA ROLE HIỆN TẠI
         * ==================================================
         */

        if (targetMember.Role == newRole)
        {
            return BadRequest(
                new
                {
                    message =
                        $"User is already {newRole}."
                });
        }

        /*
         * ==================================================
         * CẬP NHẬT ROLE
         * ==================================================
         */

        targetMember.Role = newRole;

        await db.SaveChangesAsync();

        return Ok(
            new
            {
                conversationId,
                userId,
                role = targetMember.Role,
                message =
                    "Member role updated successfully."
            });
    }

    /*
 * ==================================================
 * LEAVE GROUP
 * ==================================================
 */

    [HttpDelete("{conversationId:int}/leave")]
    public async Task<IActionResult> LeaveGroup(
        int conversationId)
    {
        /*
         * ==================================================
         * KIỂM TRA GROUP
         * ==================================================
         */

        var conversation =
            await db.Conversations
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == conversationId &&
                        x.Type == "Group");

        if (conversation is null)
        {
            return NotFound(
                new
                {
                    message = "Group not found."
                });
        }

        /*
         * ==================================================
         * TÌM MEMBER HIỆN TẠI
         * ==================================================
         */

        var currentMember =
            await db.ConversationMembers
                .FirstOrDefaultAsync(
                    x =>
                        x.ConversationId == conversationId &&
                        x.UserId == CurrentUserId);

        if (currentMember is null)
        {
            return Forbid();
        }

        /*
         * ==================================================
         * OWNER KHÔNG ĐƯỢC RỜI GROUP
         * ==================================================
         */

        if (currentMember.Role == "Owner")
        {
            return BadRequest(
                new
                {
                    message =
                        "Owner must transfer ownership before leaving the group."
                });
        }

        /*
         * ==================================================
         * XÓA MEMBER
         * ==================================================
         */

        db.ConversationMembers.Remove(currentMember);

        await db.SaveChangesAsync();

        return Ok(
            new
            {
                conversationId,
                userId = CurrentUserId,
                message = "You left the group successfully."
            });
    }

    /*
    * ==================================================
    * TRANSFER GROUP OWNERSHIP
    * ==================================================
    */

    [HttpPatch("{conversationId:int}/transfer-owner/{userId:int}")]
    public async Task<IActionResult> TransferGroupOwnership(
        int conversationId,
        int userId)
    {
        /*
         * ==================================================
         * KIỂM TRA GROUP
         * ==================================================
         */

        var conversation =
            await db.Conversations
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == conversationId &&
                        x.Type == "Group");

        if (conversation is null)
        {
            return NotFound(
                new
                {
                    message = "Group not found."
                });
        }

        /*
         * ==================================================
         * LẤY OWNER HIỆN TẠI
         * ==================================================
         */

        var currentOwner =
            await db.ConversationMembers
                .FirstOrDefaultAsync(
                    x =>
                        x.ConversationId == conversationId &&
                        x.UserId == CurrentUserId);

        if (currentOwner is null)
        {
            return Forbid();
        }

        /*
         * ==================================================
         * CHỈ OWNER ĐƯỢC CHUYỂN QUYỀN
         * ==================================================
         */

        if (currentOwner.Role != "Owner")
        {
            return Forbid();
        }

        /*
         * ==================================================
         * KHÔNG CHUYỂN CHO CHÍNH MÌNH
         * ==================================================
         */

        if (userId == CurrentUserId)
        {
            return BadRequest(
                new
                {
                    message =
                        "You are already the owner."
                });
        }

        /*
         * ==================================================
         * TÌM MEMBER MỚI
         * ==================================================
         */

        var newOwner =
            await db.ConversationMembers
                .FirstOrDefaultAsync(
                    x =>
                        x.ConversationId == conversationId &&
                        x.UserId == userId);

        if (newOwner is null)
        {
            return NotFound(
                new
                {
                    message =
                        "User is not a member of this group."
                });
        }

        /*
         * ==================================================
         * CHUYỂN QUYỀN
         * ==================================================
         */

        currentOwner.Role = "Member";
        newOwner.Role = "Owner";

        await db.SaveChangesAsync();

        return Ok(
            new
            {
                conversationId,
                previousOwnerId = CurrentUserId,
                newOwnerId = userId,
                message =
                    "Group ownership transferred successfully."
            });
    }

    /*
    * ==================================================
    * DELETE GROUP
    * ==================================================
    */

    [HttpDelete("{conversationId:int}")]
    public async Task<IActionResult> DeleteGroup(
        int conversationId)
    {
        /*
         * ==================================================
         * TÌM GROUP
         * ==================================================
         */

        var conversation =
            await db.Conversations
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == conversationId &&
                        x.Type == "Group");

        if (conversation is null)
        {
            return NotFound(
                new
                {
                    message = "Group not found."
                });
        }

        /*
         * ==================================================
         * KIỂM TRA MEMBER HIỆN TẠI
         * ==================================================
         */

        var currentMember =
            await db.ConversationMembers
                .FirstOrDefaultAsync(
                    x =>
                        x.ConversationId == conversationId &&
                        x.UserId == CurrentUserId);

        if (currentMember is null)
        {
            return Forbid();
        }

        /*
         * ==================================================
         * CHỈ OWNER ĐƯỢC XÓA GROUP
         * ==================================================
         */

        if (currentMember.Role != "Owner")
        {
            return Forbid();
        }

        /*
         * ==================================================
         * LẤY MESSAGE CỦA GROUP
         * ==================================================
         */

        var messageIds =
            await db.Messages
                .Where(x =>
                    x.ConversationId == conversationId)
                .Select(x => x.Id)
                .ToListAsync();

        /*
         * ==================================================
         * XÓA NOTIFICATION
         * ==================================================
         */

        if (messageIds.Count > 0)
        {
            var messageNotifications =
                await db.Notifications
                    .Where(x =>
                        x.ConversationId == conversationId ||
                        (x.MessageId.HasValue &&
                         messageIds.Contains(x.MessageId.Value)))
                    .ToListAsync();

            db.Notifications.RemoveRange(
                messageNotifications);
        }
        else
        {
            var conversationNotifications =
                await db.Notifications
                    .Where(x =>
                        x.ConversationId == conversationId)
                    .ToListAsync();

            db.Notifications.RemoveRange(
                conversationNotifications);
        }

        /*
         * ==================================================
         * XÓA MESSAGE USER STATE
         * ==================================================
         */

        var messageStates =
            await db.MessageUserStates
                .Where(x =>
                    messageIds.Contains(x.MessageId))
                .ToListAsync();

        db.MessageUserStates.RemoveRange(
            messageStates);

        /*
         * ==================================================
         * XÓA MESSAGE
         * ==================================================
         */

        var messages =
            await db.Messages
                .Where(x =>
                    x.ConversationId == conversationId)
                .ToListAsync();

        db.Messages.RemoveRange(messages);

        /*
         * ==================================================
         * XÓA MEMBERS
         * ==================================================
         */

        var members =
            await db.ConversationMembers
                .Where(x =>
                    x.ConversationId == conversationId)
                .ToListAsync();

        db.ConversationMembers.RemoveRange(
            members);

        /*
         * ==================================================
         * XÓA CONVERSATION
         * ==================================================
         */

        db.Conversations.Remove(conversation);

        await db.SaveChangesAsync();

        return Ok(
            new
            {
                conversationId,
                message = "Group deleted successfully."
            });
    }
}