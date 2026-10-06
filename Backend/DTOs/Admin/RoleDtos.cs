namespace CompanyChat.Api.DTOs.Admin;

public record RoleDto(
    int Id,
    string Name,
    string Description,
    bool IsSystemRole,
    DateTime CreatedAt
);

public record CreateRoleDto(
    string Name,
    string Description
);

public record UpdateRoleDto(
    string Name,
    string Description
);

public record RolePermissionDto(
    int PermissionId,
    string Code,
    string Name,
    string Description,
    string Module
);

public record UpdateRolePermissionsDto(
    List<int> PermissionIds
);