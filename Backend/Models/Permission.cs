namespace CompanyChat.Api.Models;

public class Permission
{
    public int Id { get; set; }

    // Ví dụ:
    // Employee.View
    // Employee.Create
    // Department.ManageMembers
    // Message.DeleteOwn
    public string Code { get; set; } = "";

    public string Name { get; set; } = "";

    public string Description { get; set; } = "";

    // Ví dụ:
    // Employee
    // Department
    // Message
    // Conversation
    public string Module { get; set; } = "";

    // =========================
    // RELATIONSHIPS
    // =========================

    public ICollection<RolePermission> RolePermissions
    {
        get;
        set;
    } = [];
}