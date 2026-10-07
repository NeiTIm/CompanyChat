namespace CompanyChat.Api.Models;

public class Conversation
{
    public int Id { get; set; }

    public string Type { get; set; } = "Private";

    // Tên Group. Private/Department có thể để null.
    public string? Name { get; set; }

    // User tạo Group.
    public int? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Conversation thuộc Department nào.
    // Private/Group không bắt buộc phải có.
    public int? DepartmentId { get; set; }

    public Department? Department { get; set; }

    // =========================
    // RELATIONSHIPS
    // =========================

    public ICollection<ConversationMember> Members { get; set; } = [];

    public ICollection<Message> Messages { get; set; } = [];

    
}