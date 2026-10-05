namespace CompanyChat.Api.DTOs.User;

public record UserDepartmentDto(
    int Id,
    string Name,
    string? Description,
    bool IsActive);