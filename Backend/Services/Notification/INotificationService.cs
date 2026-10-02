using CompanyChat.Api.Models;

namespace CompanyChat.Api.Services.Notification;

public interface INotificationService
{
    Task<Models.Notification> CreateAsync(
        int userId,
        string type,
        string title,
        string content,
        int? conversationId = null,
        long? messageId = null);

    Task<List<Models.Notification>> GetUserNotificationsAsync(
        int userId);

    Task<int> GetUnreadCountAsync(
        int userId);

    Task<bool> MarkAsReadAsync(
        long notificationId,
        int userId);

    Task<int> MarkAllAsReadAsync(
        int userId);

    Task<object?> GetNotificationTargetAsync(
    long notificationId,
    int userId);
    Task<bool> DeleteAsync(
        long notificationId,
        int userId);
    Task<int> DeleteAllReadAsync(int userId);
}