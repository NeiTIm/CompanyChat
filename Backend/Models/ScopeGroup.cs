namespace CompanyChat.Api.Models;

public class ScopeGroup
{
    public int Id { get; set; }

    // Tên nhóm Scope
    public string Name { get; set; } = "";

    // Mô tả mục đích của nhóm Scope
    public string Description { get; set; } = "";

    // Users được gán trực tiếp vào Scope Group
    public ICollection<ScopeGroupMember> Members { get; set; } = [];

    // Departments mà Scope Group được phép quản lý
    public ICollection<ScopeGroupDepartment> Departments { get; set; } = [];
}