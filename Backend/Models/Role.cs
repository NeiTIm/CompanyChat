namespace CompanyChat.Api.Models;

public class Role
{
    public int Id { get; set; }

    public string Name { get; set; } = "";

    public string Description { get; set; } = "";

    public bool IsSystemRole { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // =========================
    // RELATIONSHIPS
    // =========================

    public ICollection<RolePermission> RolePermissions
    {
        get;
        set;
    } = [];
}