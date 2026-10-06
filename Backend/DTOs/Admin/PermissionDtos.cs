namespace CompanyChat.Api.DTOs.Admin;

public record PermissionDto(
    int Id,
    string Code,
    string Name,
    string Description,
    string Module
);