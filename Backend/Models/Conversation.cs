namespace CompanyChat.Api.Models;

public class Conversation
{
    public int Id { get; set; }

    public string Type { get; set; } = "Private";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Conversation thuộc Department nào.
    // Private conversation sẽ để null.
    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }

    public ICollection<ConversationMember> Members { get; set; } = [];
    public ICollection<Message> Messages { get; set; } = [];
}