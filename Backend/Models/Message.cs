namespace CompanyChat.Api.Models;

public class Message
{
    public long Id { get; set; }

    public int ConversationId { get; set; }

    public int SenderId { get; set; }

    public string Content { get; set; } = string.Empty;

    public DateTime SentAt { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? DeletedBy { get; set; }

    public Conversation Conversation { get; set; } = null!;

    public User Sender { get; set; } = null!;

    public ICollection<MessageUserState> UserStates { get; set; }
        = new List<MessageUserState>();
}