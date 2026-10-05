namespace CompanyChat.Api.DTOs.Department;

public record DepartmentMemberDto(
    int UserId,
    string Username,
    string FullName,
    string Email,
    string Role,
    bool IsActive,
    bool IsOnline,
    DateTime? LastSeen,
    bool IsPrimary);