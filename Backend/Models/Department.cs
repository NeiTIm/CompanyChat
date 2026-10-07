namespace CompanyChat.Api.Models;

public class Department
{
    public int Id { get; set; }

    public string Name { get; set; } = "";

    public string Description { get; set; } = "";

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // =========================
    // RELATIONSHIPS
    // =========================

    public ICollection<User> Users { get; set; } = [];

    public ICollection<UserDepartment> UserDepartments { get; set; } = [];

    public ICollection<Conversation> Conversations { get; set; } = [];

    public ICollection<UserManagedDepartment> UserManagedDepartments { get; set; } = [];

    // =========================
    // GROUP SCOPE
    // =========================

    public ICollection<ScopeGroupDepartment> ScopeGroupDepartments
    {
        get;
        set;
    } = [];
}