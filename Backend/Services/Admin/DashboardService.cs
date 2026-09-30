using CompanyChat.Api.Data;
using CompanyChat.Api.DTOs.Admin;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Services.Admin;

public class DashboardService(AppDbContext db)
{
    public async Task<AdminDashboardDto> GetDashboardAsync()
    {
        var totalUsers =
            await db.Users.CountAsync();

        var activeUsers =
            await db.Users.CountAsync(x => x.IsActive);

        var onlineUsers =
            await db.Users.CountAsync(x => x.IsOnline);

        var totalConversations =
            await db.Conversations.CountAsync();

        var totalMessages =
            await db.Messages.CountAsync();

        var deletedMessages =
            await db.Messages.CountAsync(x => x.IsDeleted);

        return new AdminDashboardDto(
            totalUsers,
            activeUsers,
            onlineUsers,
            totalConversations,
            totalMessages,
            deletedMessages
        );
    }
}