namespace CompanyChat.Api.DTOs.Message;

public record ReplyMessageDto(
    long Id,
    int SenderId,
    string SenderName,
    string Content);

public record MessageDto(
    long Id,
    int ConversationId,
    int SenderId,
    string SenderName,
    string Content,
    DateTime SentAt,
    bool IsDeleted,
    string DeliveryStatus,
    long? ReplyToMessageId,
    ReplyMessageDto? ReplyTo);