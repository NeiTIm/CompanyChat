namespace CompanyChat.Api.DTOs.User;

public record UserDto(
    int Id,
    string Username,
    string FullName,
    string Email,
    string Role,
    bool IsOnline,
    DateTime? LastSeen,
    bool IsActive,
    int? DepartmentId,
    string? DepartmentName);