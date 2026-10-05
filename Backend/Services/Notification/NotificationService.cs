using CompanyChat.Api.Data;
using CompanyChat.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Services.Notification;

public class NotificationService(AppDbContext db)
    : INotificationService
{
    /*
     * =========================================================
     * GET DEPARTMENT NAME
     * =========================================================
     */
    private async Task<string?> GetDepartmentNameAsync(
        int? conversationId)
    {
        if (!conversationId.HasValue)
        {
            return null;
        }

        return await db.Conversations
            .AsNoTracking()
            .Where(x =>
                x.Id == conversationId.Value &&
                x.Type == "Department" &&
                x.DepartmentId.HasValue)
            .Select(x =>
                x.Department != null
                    ? x.Department.Name
                    : null)
            .FirstOrDefaultAsync();
    }

    /*
     * =========================================================
     * APPLY DEPARTMENT NAME
     * =========================================================
     */
    private async Task ApplyDepartmentNameAsync(
        Models.Notification notification)
    {
        if (
            notification.Type !=
            "DepartmentMessage")
        {
            notification.DepartmentName = null;
            return;
        }

        notification.DepartmentName =
            await GetDepartmentNameAsync(
                notification.ConversationId);
    }

    /*
     * =========================================================
     * CREATE
     * =========================================================
     */
    public async Task<Models.Notification> CreateAsync(
        int userId,
        string type,
        string title,
        string content,
        int? conversationId = null,
        long? messageId = null)
    {
        /*
         * =====================================================
         * TÌM NOTIFICATION CHƯA ĐỌC ĐANG GOM
         * =====================================================
         */
        var existingNotification =
            conversationId.HasValue
                ? await db.Notifications
                    .FirstOrDefaultAsync(
                        x =>
                            x.UserId == userId &&
                            x.ConversationId ==
                                conversationId &&
                            x.Type == type &&
                            !x.IsRead)
                : null;

        /*
         * =====================================================
         * UPDATE NOTIFICATION CŨ
         * =====================================================
         */
        if (existingNotification is not null)
        {
            /*
             * Luôn trỏ đến message mới nhất.
             */
            existingNotification.MessageId =
                messageId;

            /*
             * Đếm message chưa đọc
             * trong đúng conversation.
             */
            var unreadMessageCount =
                await db.MessageUserStates
                    .CountAsync(
                        x =>
                            x.UserId == userId &&
                            x.Message.ConversationId ==
                                conversationId &&
                            !x.IsRead &&
                            !x.IsDeletedForMe);

            /*
             * =================================================
             * PRIVATE
             * =================================================
             */
            if (type == "Message")
            {
                var senderName =
                    messageId.HasValue
                        ? await db.Messages
                            .Where(
                                x =>
                                    x.Id ==
                                    messageId.Value)
                            .Select(
                                x =>
                                    x.Sender.FullName)
                            .FirstOrDefaultAsync()
                        : null;

                if (!string.IsNullOrWhiteSpace(
                    senderName))
                {
                    existingNotification.Title =
                        "Tin nhắn mới";

                    existingNotification.Content =
                        $"{senderName} đã gửi cho bạn " +
                        $"{unreadMessageCount} tin nhắn";
                }
                else
                {
                    existingNotification.Title =
                        title;

                    existingNotification.Content =
                        content;
                }
            }

            /*
             * =================================================
             * DEPARTMENT
             * =================================================
             */
            else if (
                type ==
                "DepartmentMessage")
            {
                existingNotification.Title =
                    "Tin nhắn phòng ban mới";

                existingNotification.Content =
                    $"Phòng ban có " +
                    $"{unreadMessageCount} tin nhắn mới";
            }

            /*
             * =================================================
             * OTHER
             * =================================================
             */
            else
            {
                existingNotification.Title =
                    title;

                existingNotification.Content =
                    content;
            }

            /*
             * Cập nhật thời gian.
             */
            existingNotification.CreatedAt =
                DateTime.UtcNow;

            /*
             * Quan trọng:
             * realtime notification phải có DepartmentName.
             */
            await ApplyDepartmentNameAsync(
                existingNotification);

            await db.SaveChangesAsync();

            return existingNotification;
        }

        /*
         * =====================================================
         * CREATE NOTIFICATION MỚI
         * =====================================================
         */
        var notification =
            new Models.Notification
            {
                UserId =
                    userId,

                Type =
                    type,

                Title =
                    title,

                Content =
                    content,

                ConversationId =
                    conversationId,

                MessageId =
                    messageId,

                IsRead =
                    false,

                CreatedAt =
                    DateTime.UtcNow
            };

        /*
         * =====================================================
         * PRIVATE
         * =====================================================
         */
        if (
            type == "Message" &&
            messageId.HasValue)
        {
            var senderName =
                await db.Messages
                    .Where(
                        x =>
                            x.Id ==
                            messageId.Value)
                    .Select(
                        x =>
                            x.Sender.FullName)
                    .FirstOrDefaultAsync();

            if (!string.IsNullOrWhiteSpace(
                senderName))
            {
                notification.Title =
                    "Tin nhắn mới";

                notification.Content =
                    $"{senderName} đã gửi cho bạn 1 tin nhắn";
            }
        }

        /*
         * =====================================================
         * DEPARTMENT
         * =====================================================
         */
        else if (
            type ==
            "DepartmentMessage")
        {
            notification.Title =
                "Tin nhắn phòng ban mới";

            notification.Content =
                "Phòng ban có 1 tin nhắn mới";
        }

        /*
         * =====================================================
         * DEPARTMENT NAME
         * =====================================================
         */
        await ApplyDepartmentNameAsync(
            notification);

        /*
         * =====================================================
         * SAVE
         * =====================================================
         */
        db.Notifications.Add(
            notification);

        await db.SaveChangesAsync();

        return notification;
    }

    /*
     * =========================================================
     * GET USER NOTIFICATIONS
     * =========================================================
     */
    public async Task<List<DTOs.Notification.NotificationDto>>
        GetUserNotificationsAsync(
            int userId)
    {
        return await db.Notifications
            .AsNoTracking()
            .Where(
                x =>
                    x.UserId ==
                    userId)
            .OrderByDescending(
                x =>
                    x.CreatedAt)
            .Select(
                x =>
                    new DTOs.Notification.NotificationDto(
                        x.Id,
                        x.UserId,
                        x.Type,
                        x.Title,
                        x.Content,
                        x.ConversationId,
                        x.MessageId,
                        x.IsRead,
                        x.ReadAt,
                        x.CreatedAt,

                        x.Type == "DepartmentMessage" &&
                        x.Conversation != null &&
                        x.Conversation.Department != null
                            ? x.Conversation.Department.Name
                            : null
                    ))
            .ToListAsync();
    }

    /*
     * =========================================================
     * UNREAD COUNT
     * =========================================================
     */
    public async Task<int> GetUnreadCountAsync(
        int userId)
    {
        return await db.Notifications
            .CountAsync(
                x =>
                    x.UserId == userId &&
                    !x.IsRead);
    }

    /*
     * =========================================================
     * MARK AS READ
     * =========================================================
     */
    public async Task<bool> MarkAsReadAsync(
        long notificationId,
        int userId)
    {
        var notification =
            await db.Notifications
                .FirstOrDefaultAsync(
                    x =>
                        x.Id ==
                            notificationId &&
                        x.UserId ==
                            userId);

        if (notification is null)
        {
            return false;
        }

        if (!notification.IsRead)
        {
            notification.IsRead =
                true;

            notification.ReadAt =
                DateTime.UtcNow;

            await db.SaveChangesAsync();
        }

        return true;
    }

    /*
     * =========================================================
     * MARK ALL AS READ
     * =========================================================
     */
    public async Task<int> MarkAllAsReadAsync(
        int userId)
    {
        var notifications =
            await db.Notifications
                .Where(
                    x =>
                        x.UserId ==
                            userId &&
                        !x.IsRead)
                .ToListAsync();

        if (notifications.Count == 0)
        {
            return 0;
        }

        var now =
            DateTime.UtcNow;

        foreach (
            var notification
            in notifications)
        {
            notification.IsRead =
                true;

            notification.ReadAt =
                now;
        }

        await db.SaveChangesAsync();

        return notifications.Count;
    }

    /*
     * =========================================================
     * GET NOTIFICATION TARGET
     * =========================================================
     */
    public async Task<object?>
        GetNotificationTargetAsync(
            long notificationId,
            int userId)
    {
        var notification =
            await db.Notifications
                .AsNoTracking()
                .Include(x => x.Message)
                .Include(x => x.Conversation)
                .FirstOrDefaultAsync(
                    x =>
                        x.Id ==
                            notificationId &&
                        x.UserId ==
                            userId);

        if (notification is null)
        {
            return null;
        }

        if (notification.ConversationId is null)
        {
            return null;
        }

        var conversationType =
            notification
                .Conversation?
                .Type;

        /*
         * =====================================================
         * DEPARTMENT
         * =====================================================
         */
        if (conversationType == "Department")
        {
            return new
            {
                conversationId =
                    notification.ConversationId,

                senderId =
                    (int?)null,

                conversationType
            };
        }

        /*
         * =====================================================
         * PRIVATE
         * =====================================================
         */
        if (conversationType == "Private")
        {
            if (notification.Message is null)
            {
                return null;
            }

            return new
            {
                conversationId =
                    notification.ConversationId,

                senderId =
                    notification
                        .Message
                        .SenderId,

                conversationType
            };
        }

        /*
         * =====================================================
         * GROUP
         * =====================================================
         */
        if (conversationType == "Group")
        {
            if (notification.Message is null)
            {
                return null;
            }

            return new
            {
                conversationId =
                    notification.ConversationId,

                senderId =
                    notification
                        .Message
                        .SenderId,

                conversationType
            };
        }

        return null;
    }

    /*
     * =========================================================
     * DELETE
     * =========================================================
     */
    public async Task<bool> DeleteAsync(
        long notificationId,
        int userId)
    {
        var notification =
            await db.Notifications
                .FirstOrDefaultAsync(
                    x =>
                        x.Id ==
                            notificationId &&
                        x.UserId ==
                            userId);

        if (notification is null)
        {
            return false;
        }

        if (!notification.IsRead)
        {
            return false;
        }

        db.Notifications.Remove(
            notification);

        await db.SaveChangesAsync();

        return true;
    }

    /*
     * =========================================================
     * DELETE ALL READ
     * =========================================================
     */
    public async Task<int> DeleteAllReadAsync(
        int userId)
    {
        var notifications =
            await db.Notifications
                .Where(
                    x =>
                        x.UserId ==
                            userId &&
                        x.IsRead)
                .ToListAsync();

        if (notifications.Count == 0)
        {
            return 0;
        }

        db.Notifications.RemoveRange(
            notifications);

        await db.SaveChangesAsync();

        return notifications.Count;
    }
}