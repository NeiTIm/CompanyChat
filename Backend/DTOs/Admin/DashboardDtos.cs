namespace CompanyChat.Api.DTOs.Admin;

public record AdminDashboardDto(
    int TotalUsers,
    int ActiveUsers,
    int OnlineUsers,
    int TotalConversations,
    int TotalMessages,
    int DeletedMessages
);