using CompanyChat.Api.DTOs.User;

namespace CompanyChat.Api.DTOs.Conversation;

public record ConversationDto(
    int Id,
    string Type,
    UserDto OtherUser,
    DateTime CreatedAt);

public record DepartmentConversationDto(
    int Id,
    string Type,
    int DepartmentId,
    string DepartmentName,
    DateTime CreatedAt);

public record UnreadConversationDto(
    int ConversationId,
    int UserId,
    int UnreadCount);