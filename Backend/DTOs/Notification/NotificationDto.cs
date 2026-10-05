namespace CompanyChat.Api.DTOs.Notification;

public record NotificationDto(
    long Id,
    int UserId,
    string Type,
    string Title,
    string Content,
    int? ConversationId,
    long? MessageId,
    bool IsRead,
    DateTime? ReadAt,
    DateTime CreatedAt,
    string? DepartmentName);