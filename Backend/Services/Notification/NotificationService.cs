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
        var notification = new Models.Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Content = content,
            ConversationId = conversationId,
            MessageId = messageId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        db.Notifications.Add(notification);

        await db.SaveChangesAsync();

        return notification;
    }

    public async Task<List<Models.Notification>>
        GetUserNotificationsAsync(int userId)
    {
        return await db.Notifications
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(
        int userId)
    {
        return await db.Notifications
            .CountAsync(x =>
                x.UserId == userId &&
                !x.IsRead);
    }

    public async Task<bool> MarkAsReadAsync(
        long notificationId,
        int userId)
    {
        var notification =
            await db.Notifications
                .FirstOrDefaultAsync(x =>
                    x.Id == notificationId &&
                    x.UserId == userId);

        if (notification is null)
        {
            return false;
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;

            await db.SaveChangesAsync();
        }

        return true;
    }

    public async Task<int> MarkAllAsReadAsync(
        int userId)
    {
        var notifications =
            await db.Notifications
                .Where(x =>
                    x.UserId == userId &&
                    !x.IsRead)
                .ToListAsync();

        if (notifications.Count == 0)
        {
            return 0;
        }

        var now = DateTime.UtcNow;

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAt = now;
        }

        await db.SaveChangesAsync();

        return notifications.Count;
    }

    public async Task<object?> GetNotificationTargetAsync(
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
                        x.Id == notificationId &&
                        x.UserId == userId);

        if (notification is null)
        {
            return null;
        }

        if (notification.ConversationId is null)
        {
            return null;
        }

        var conversationType =
            notification.Conversation?.Type;

        if (conversationType == "Department")
        {
            return new
            {
                conversationId =
                    notification.ConversationId,

                senderId = (int?)null,

                conversationType
            };
        }

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
                    notification.Message.SenderId,

                conversationType
            };
        }

        return null;
    }
}