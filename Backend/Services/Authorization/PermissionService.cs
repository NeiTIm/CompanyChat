using CompanyChat.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Services.Authorization;

public class PermissionService(AppDbContext db)
{
    // =========================================================
    // CHECK ONE PERMISSION
    // =========================================================

    public async Task<bool> HasPermissionAsync(
        int userId,
        string permissionCode)
    {
        if (userId <= 0 ||
            string.IsNullOrWhiteSpace(permissionCode))
        {
            return false;
        }

        permissionCode = permissionCode.Trim();

        return await db.Users
            .AsNoTracking()
            .Where(user =>
                user.Id == userId &&
                !user.IsDeleted &&
                user.IsActive)
            .Join(
                db.Roles,
                user => user.Role,
                role => role.Name,
                (user, role) => role.Id
            )
            .Join(
                db.RolePermissions,
                roleId => roleId,
                rolePermission => rolePermission.RoleId,
                (roleId, rolePermission) =>
                    rolePermission.PermissionId
            )
            .Join(
                db.Permissions,
                permissionId => permissionId,
                permission => permission.Id,
                (permissionId, permission) => permission.Code
            )
            .AnyAsync(code => code == permissionCode);
    }


    // =========================================================
    // CHECK ANY PERMISSION
    //
    // true nếu User có ít nhất một permission
    // =========================================================

    public async Task<bool> HasAnyPermissionAsync(
        int userId,
        params string[] permissionCodes)
    {
        if (userId <= 0 ||
            permissionCodes == null ||
            permissionCodes.Length == 0)
        {
            return false;
        }

        var codes = permissionCodes
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct()
            .ToList();

        if (codes.Count == 0)
        {
            return false;
        }

        return await db.Users
            .AsNoTracking()
            .Where(user =>
                user.Id == userId &&
                !user.IsDeleted &&
                user.IsActive)
            .Join(
                db.Roles,
                user => user.Role,
                role => role.Name,
                (user, role) => role.Id
            )
            .Join(
                db.RolePermissions,
                roleId => roleId,
                rolePermission => rolePermission.RoleId,
                (roleId, rolePermission) =>
                    rolePermission.PermissionId
            )
            .Join(
                db.Permissions,
                permissionId => permissionId,
                permission => permission.Id,
                (permissionId, permission) => permission.Code
            )
            .AnyAsync(code => codes.Contains(code));
    }


    // =========================================================
    // CHECK ALL PERMISSIONS
    //
    // true nếu User có đầy đủ tất cả permissions
    // =========================================================

    public async Task<bool> HasAllPermissionsAsync(
        int userId,
        params string[] permissionCodes)
    {
        if (userId <= 0 ||
            permissionCodes == null ||
            permissionCodes.Length == 0)
        {
            return false;
        }

        var codes = permissionCodes
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct()
            .ToList();

        if (codes.Count == 0)
        {
            return false;
        }

        var userPermissionCodes = await db.Users
            .AsNoTracking()
            .Where(user =>
                user.Id == userId &&
                !user.IsDeleted &&
                user.IsActive)
            .Join(
                db.Roles,
                user => user.Role,
                role => role.Name,
                (user, role) => role.Id
            )
            .Join(
                db.RolePermissions,
                roleId => roleId,
                rolePermission => rolePermission.RoleId,
                (roleId, rolePermission) =>
                    rolePermission.PermissionId
            )
            .Join(
                db.Permissions,
                permissionId => permissionId,
                permission => permission.Id,
                (permissionId, permission) => permission.Code
            )
            .Where(code => codes.Contains(code))
            .Distinct()
            .ToListAsync();

        return codes.All(
            code => userPermissionCodes.Contains(code));
    }


    // =========================================================
    // GET USER PERMISSIONS
    //
    // Lấy toàn bộ Permission của User
    // =========================================================

    public async Task<List<string>> GetUserPermissionsAsync(
        int userId)
    {
        if (userId <= 0)
        {
            return [];
        }

        return await db.Users
            .AsNoTracking()
            .Where(user =>
                user.Id == userId &&
                !user.IsDeleted &&
                user.IsActive)
            .Join(
                db.Roles,
                user => user.Role,
                role => role.Name,
                (user, role) => role.Id
            )
            .Join(
                db.RolePermissions,
                roleId => roleId,
                rolePermission => rolePermission.RoleId,
                (roleId, rolePermission) =>
                    rolePermission.PermissionId
            )
            .Join(
                db.Permissions,
                permissionId => permissionId,
                permission => permission.Id,
                (permissionId, permission) => permission.Code
            )
            .Distinct()
            .OrderBy(code => code)
            .ToListAsync();
    }
}