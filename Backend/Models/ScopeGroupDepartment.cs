namespace CompanyChat.Api.Models;

public class ScopeGroupDepartment
{
    public int ScopeGroupId { get; set; }

    public ScopeGroup ScopeGroup { get; set; } = null!;

    public int DepartmentId { get; set; }

    public Department Department { get; set; } = null!;
}