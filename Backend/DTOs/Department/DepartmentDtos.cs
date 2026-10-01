namespace CompanyChat.Api.DTOs.Department;

public record DepartmentDto(
    int Id,
    string Name,
    string Description,
    bool IsActive,
    DateTime CreatedAt,
    int UserCount);