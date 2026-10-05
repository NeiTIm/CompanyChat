namespace CompanyChat.Api.Models;

public class UserDepartment
{
    public int UserId { get; set; }

    public User User { get; set; } = null!;

    public int DepartmentId { get; set; }

    public Department Department { get; set; } = null!;
}