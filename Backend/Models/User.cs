namespace CompanyChat.Api.Models;

public class User
{
    public int Id { get; set; }

    public string Username { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";

    public string Role { get; set; } = "Employee";

    // =========================
    // DEPARTMENT
    // =========================

    public int? DepartmentId { get; set; }

    public Department? Department { get; set; }

    // =========================
    // STATUS
    // =========================

    public bool IsActive { get; set; } = true;

    public bool IsOnline { get; set; }

    public DateTime? LastSeen { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // =========================
    // RELATIONSHIPS
    // =========================

    public ICollection<ConversationMember> ConversationMembers
    {
        get;
        set;
    } = [];

    public ICollection<Message> Messages
    {
        get;
        set;
    } = [];
}