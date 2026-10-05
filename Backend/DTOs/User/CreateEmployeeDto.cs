namespace CompanyChat.Api.DTOs.User;

public record CreateEmployeeDto(
    string Username,
    string FullName,
    string Email,
    string Password,
    string? Role,
    int? DepartmentId
);