using CompanyChat.Api.Data;
using CompanyChat.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Services.Notification;

public class NotificationService(AppDbContext db)
    : INotificationService
{
    public async Task<Models.Notification> CreateAsync(
        int userId,
        string type,
        string title,
        string content,
        int? conversationId = null,
        long? messageId = null)
    {
        /*
         * =================================================
         * GOM NOTIFICATION CHƯA ĐỌC
         * =================================================
         *
         * Nếu user đã có notification chưa đọc
         * trong cùng conversation và cùng type
         * thì cập nhật notification cũ.
         *
         * Không tạo notification mới.
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

        if (existingNotification is not null)
        {
            /*
             * =================================================
             * CẬP NHẬT MESSAGE ID
             * =================================================
             *
             * Luôn trỏ tới tin nhắn mới nhất.
             */

            existingNotification.MessageId =
                messageId;

            /*
             * =================================================
             * ĐẾM SỐ TIN NHẮN CHƯA ĐỌC
             * =================================================
             *
             * Notification hiện tại đại diện cho
             * toàn bộ nhóm tin nhắn chưa đọc.
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
            else
            {
                existingNotification.Title =
                    title;

                existingNotification.Content =
                    content;
            }

            /*
             * Notification được cập nhật thành
             * notification mới nhất.
             */

            existingNotification.CreatedAt =
                DateTime.UtcNow;

            await db.SaveChangesAsync();

            return existingNotification;
        }

        /*
         * =================================================
         * CHƯA CÓ NOTIFICATION CHƯA ĐỌC
         * =================================================
         *
         * Tạo notification mới.
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
         * Với notification đầu tiên:
         *
         * Private:
         * "Tiến đã gửi cho bạn 1 tin nhắn"
         *
         * Department:
         * "Phòng ban có 1 tin nhắn mới"
         */

        if (type == "Message" &&
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
        else if (
            type ==
            "DepartmentMessage")
        {
            notification.Title =
                "Tin nhắn phòng ban mới";

            notification.Content =
                "Phòng ban có 1 tin nhắn mới";
        }

        db.Notifications.Add(
            notification);

        await db.SaveChangesAsync();

        return notification;
    }

    public async Task<List<Models.Notification>>
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
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(
        int userId)
    {
        return await db.Notifications
            .CountAsync(
                x =>
                    x.UserId ==
                        userId &&
                    !x.IsRead);
    }

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

    public async Task<object?>
        GetNotificationTargetAsync(
            long notificationId,
            int userId)
    {
        var notification =
            await db.Notifications
                .AsNoTracking()
                .Include(
                    x =>
                        x.Message)
                .Include(
                    x =>
                        x.Conversation)
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

        if (notification.ConversationId
            is null)
        {
            return null;
        }

        var conversationType =
            notification
                .Conversation?
                .Type;

        if (
            conversationType ==
            "Department")
        {
            return new
            {
                conversationId =
                    notification
                        .ConversationId,

                senderId =
                    (int?)null,

                conversationType
            };
        }

        if (
            conversationType ==
            "Private")
        {
            if (
                notification.Message
                is null)
            {
                return null;
            }

            return new
            {
                conversationId =
                    notification
                        .ConversationId,

                senderId =
                    notification
                        .Message
                        .SenderId,

                conversationType
            };
        }

        return null;
    }
    //Delete notification
    public async Task<bool> DeleteAsync(
    long notificationId,
    int userId)
    {
        var notification =
            await db.Notifications
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == notificationId &&
                        x.UserId == userId);

        if (notification is null)
        {
            return false;
        }

        // Chưa đọc thì không cho xóa
        if (!notification.IsRead)
        {
            return false;
        }

        db.Notifications.Remove(notification);

        await db.SaveChangesAsync();

        return true;
    }

    public async Task<int> DeleteAllReadAsync(
    int userId)
    {
        var notifications =
            await db.Notifications
                .Where(x =>
                    x.UserId == userId &&
                    x.IsRead)
                .ToListAsync();

        if (notifications.Count == 0)
        {
            return 0;
        }

        db.Notifications.RemoveRange(
            notifications
        );

        await db.SaveChangesAsync();

        return notifications.Count;
    }
}