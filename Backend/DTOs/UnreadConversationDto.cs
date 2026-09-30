namespace CompanyChat.Api.DTOs;

public record UnreadConversationDto(
    int ConversationId,
    int UserId,
    int UnreadCount);