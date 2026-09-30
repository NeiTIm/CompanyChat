namespace CompanyChat.Api.Models;

public class Conversation
{
    public int Id { get; set; }
    public string Type { get; set; } = "Private";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ConversationMember> Members { get; set; } = [];
    public ICollection<Message> Messages { get; set; } = [];
}
