using CompanyChat.Api.Data;
using CompanyChat.Api.DTOs.Admin;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/permissions")]
public class PermissionController(AppDbContext db) : ControllerBase
{
    // =========================================================
    // GET: api/admin/permissions
    //
    // Permission: Role.View
    //
    // Query:
    // ?search=employee
    // ?module=Employee
    // =========================================================

    [HttpGet]
    [Authorize(Policy = "Permission:Role.View")]
    public async Task<IActionResult> GetPermissions(
        [FromQuery] string? search = null,
        [FromQuery] string? module = null)
    {
        search = search?.Trim();
        module = module?.Trim();

        var query = db.Permissions
            .AsNoTracking()
            .AsQueryable();

        // -----------------------------------------------------
        // Search
        // -----------------------------------------------------

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x =>
                x.Code.Contains(search) ||
                x.Name.Contains(search) ||
                x.Description.Contains(search));
        }

        // -----------------------------------------------------
        // Module
        // -----------------------------------------------------

        if (!string.IsNullOrWhiteSpace(module))
        {
            query = query.Where(x =>
                x.Module == module);
        }

        var permissions = await query
            .OrderBy(x => x.Module)
            .ThenBy(x => x.Code)
            .Select(x => new PermissionDto(
                x.Id,
                x.Code,
                x.Name,
                x.Description,
                x.Module
            ))
            .ToListAsync();

        return Ok(permissions);
    }

    // =========================================================
    // GET: api/admin/permissions/{id}
    //
    // Permission: Role.View
    // =========================================================

    [HttpGet("{id:int}")]
    [Authorize(Policy = "Permission:Role.View")]
    public async Task<IActionResult> GetPermission(int id)
    {
        var permission = await db.Permissions
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new PermissionDto(
                x.Id,
                x.Code,
                x.Name,
                x.Description,
                x.Module
            ))
            .FirstOrDefaultAsync();

        if (permission == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy permission."
            });
        }

        return Ok(permission);
    }

    // =========================================================
    // GET: api/admin/permissions/modules
    //
    // Permission: Role.View
    // =========================================================

    [HttpGet("modules")]
    [Authorize(Policy = "Permission:Role.View")]
    public async Task<IActionResult> GetModules()
    {
        var modules = await db.Permissions
            .AsNoTracking()
            .Select(x => x.Module)
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync();

        return Ok(modules);
    }

    // =========================================================
    // GET:
    // api/admin/permissions/{id}/roles
    //
    // Permission: Role.View
    // =========================================================

    [HttpGet("{id:int}/roles")]
    [Authorize(Policy = "Permission:Role.View")]
    public async Task<IActionResult> GetPermissionRoles(int id)
    {
        var permission = await db.Permissions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (permission == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy permission."
            });
        }

        var roles = await db.RolePermissions
            .AsNoTracking()
            .Where(x => x.PermissionId == id)
            .OrderBy(x => x.Role.Name)
            .Select(x => new
            {
                x.Role.Id,
                x.Role.Name,
                x.Role.Description,
                x.Role.IsSystemRole,
                x.Role.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            permission = new PermissionDto(
                permission.Id,
                permission.Code,
                permission.Name,
                permission.Description,
                permission.Module
            ),

            roles
        });
    }

    // =========================================================
    // GET:
    // api/admin/permissions/{id}/users
    //
    // Permission: Role.View
    //
    // Query:
    // ?search=nguyen
    // &page=1
    // &pageSize=20
    // =========================================================

    [HttpGet("{id:int}/users")]
    [Authorize(Policy = "Permission:Role.View")]
    public async Task<IActionResult> GetPermissionUsers(
        int id,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1)
        {
            page = 1;
        }

        if (pageSize < 1)
        {
            pageSize = 20;
        }

        if (pageSize > 100)
        {
            pageSize = 100;
        }

        // -----------------------------------------------------
        // Permission
        // -----------------------------------------------------

        var permission = await db.Permissions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (permission == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy permission."
            });
        }

        search = search?.Trim();

        // -----------------------------------------------------
        // Role có Permission
        // -----------------------------------------------------

        var roleNamesQuery = db.RolePermissions
            .Where(x => x.PermissionId == id)
            .Select(x => x.Role.Name);

        // -----------------------------------------------------
        // User có Role tương ứng
        // -----------------------------------------------------

        var query = db.Users
            .AsNoTracking()
            .Where(x =>
                !x.IsDeleted &&
                roleNamesQuery.Contains(x.Role));

        // -----------------------------------------------------
        // Search
        // -----------------------------------------------------

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x =>
                x.Username.Contains(search) ||
                x.FullName.Contains(search) ||
                x.Email.Contains(search));
        }

        var total = await query.CountAsync();

        var totalPages = (int)Math.Ceiling(
            total / (double)pageSize);

        if (totalPages > 0 && page > totalPages)
        {
            page = totalPages;
        }

        var users = await query
            .OrderBy(x => x.FullName)
            .ThenBy(x => x.Username)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Id,
                x.Username,
                x.FullName,
                x.Email,
                x.Role,
                x.IsActive,
                x.IsOnline,
                x.LastSeen,
                x.DepartmentId,

                DepartmentName = x.Department != null
                    ? x.Department.Name
                    : null
            })
            .ToListAsync();

        return Ok(new
        {
            permission = new PermissionDto(
                permission.Id,
                permission.Code,
                permission.Name,
                permission.Description,
                permission.Module
            ),

            items = users,

            page,
            pageSize,
            total,
            totalPages
        });
    }

    // =========================================================
    // GET:
    // api/admin/permissions/statistics
    //
    // Permission: Role.View
    // =========================================================

    [HttpGet("statistics")]
    [Authorize(Policy = "Permission:Role.View")]
    public async Task<IActionResult> GetStatistics()
    {
        var totalPermissions = await db.Permissions
            .CountAsync();

        var totalModules = await db.Permissions
            .Select(x => x.Module)
            .Distinct()
            .CountAsync();

        var assignedPermissions = await db.RolePermissions
            .Select(x => x.PermissionId)
            .Distinct()
            .CountAsync();

        var unusedPermissions =
            totalPermissions - assignedPermissions;

        var totalRoles = await db.Roles
            .CountAsync();

        var rolesWithPermissions = await db.RolePermissions
            .Select(x => x.RoleId)
            .Distinct()
            .CountAsync();

        return Ok(new
        {
            totalPermissions,
            totalModules,
            assignedPermissions,
            unusedPermissions,
            totalRoles,
            rolesWithPermissions
        });
    }

    // =========================================================
    // GET:
    // api/admin/permissions/by-module/{module}
    //
    // Permission: Role.View
    // =========================================================

    [HttpGet("by-module/{module}")]
    [Authorize(Policy = "Permission:Role.View")]
    public async Task<IActionResult> GetPermissionsByModule(
        string module)
    {
        module = module?.Trim() ?? "";

        if (string.IsNullOrWhiteSpace(module))
        {
            return BadRequest(new
            {
                message = "Module không được để trống."
            });
        }

        var permissions = await db.Permissions
            .AsNoTracking()
            .Where(x => x.Module == module)
            .OrderBy(x => x.Code)
            .Select(x => new PermissionDto(
                x.Id,
                x.Code,
                x.Name,
                x.Description,
                x.Module
            ))
            .ToListAsync();

        if (permissions.Count == 0)
        {
            var moduleExists = await db.Permissions
                .AnyAsync(x =>
                    x.Module == module);

            if (!moduleExists)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy module."
                });
            }
        }

        return Ok(permissions);
    }

    // =========================================================
    // GET:
    // api/admin/permissions/check/{roleId}/{permissionId}
    //
    // Permission: Role.View
    // =========================================================

    [HttpGet("check/{roleId:int}/{permissionId:int}")]
    [Authorize(Policy = "Permission:Role.View")]
    public async Task<IActionResult> CheckRolePermission(
        int roleId,
        int permissionId)
    {
        // -----------------------------------------------------
        // Role
        // -----------------------------------------------------

        var role = await db.Roles
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.Id == roleId);

        if (role == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy role."
            });
        }

        // -----------------------------------------------------
        // Permission
        // -----------------------------------------------------

        var permission = await db.Permissions
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.Id == permissionId);

        if (permission == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy permission."
            });
        }

        // -----------------------------------------------------
        // Check Mapping
        // -----------------------------------------------------

        var assigned = await db.RolePermissions
            .AsNoTracking()
            .AnyAsync(x =>
                x.RoleId == roleId &&
                x.PermissionId == permissionId);

        return Ok(new
        {
            roleId,
            roleName = role.Name,

            permissionId,
            permissionCode = permission.Code,

            assigned
        });
    }
}