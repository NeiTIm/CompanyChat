

namespace CompanyChat.Api.WebSockets;

public class ChatMessage
{
    public string Type { get; set; } = string.Empty;

    public int ConversationId { get; set; }

    public int ReceiverId { get; set; }

    public long MessageId { get; set; }

    public long? ReplyToMessageId { get; set; }

    public string Content { get; set; } = string.Empty;

    public bool DeleteForMe { get; set; }
}