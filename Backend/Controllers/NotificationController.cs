using System.Security.Claims;
using CompanyChat.Api.Services.Notification;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CompanyChat.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationController(
    INotificationService notificationService)
    : ControllerBase
{
    private int GetUserId()
    {
        var userId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(userId, out var id))
        {
            throw new UnauthorizedAccessException(
                "User ID is missing from token.");
        }

        return id;
    }

    // GET: /api/notifications
    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var userId = GetUserId();

        var notifications =
            await notificationService
                .GetUserNotificationsAsync(userId);

        return Ok(notifications);
    }

    // GET: /api/notifications/unread-count
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = GetUserId();

        var count =
            await notificationService
                .GetUnreadCountAsync(userId);

        return Ok(new
        {
            unreadCount = count
        });
    }

    // POST: /api/notifications/{id}/read
    [HttpPost("{id:long}/read")]
    public async Task<IActionResult> MarkAsRead(
        long id)
    {
        var userId = GetUserId();

        var success =
            await notificationService
                .MarkAsReadAsync(id, userId);

        if (!success)
        {
            return NotFound(new
            {
                message = "Notification not found."
            });
        }

        return Ok(new
        {
            message = "Notification marked as read."
        });
    }

    // POST: /api/notifications/read-all
    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetUserId();

        var count =
            await notificationService
                .MarkAllAsReadAsync(userId);

        return Ok(new
        {
            markedCount = count
        });
    }
    // GET: /api/notifications/{id}/target
    [HttpGet("{id:long}/target")]
    public async Task<IActionResult> GetNotificationTarget(
        long id)
    {
        var userId = GetUserId();

        var notification =
            await notificationService
                .GetNotificationTargetAsync(
                    id,
                    userId);

        if (notification is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Notification target not found."
                });
        }

        return Ok(notification);
    }

}