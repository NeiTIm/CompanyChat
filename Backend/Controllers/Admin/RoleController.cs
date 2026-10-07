using CompanyChat.Api.Data;
using CompanyChat.Api.DTOs.Admin;
using CompanyChat.Api.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/roles")]
public class RoleController(AppDbContext db) : ControllerBase
{
    // =========================================================
    // GET: api/admin/roles
    //
    // Permission: Role.View
    // =========================================================

    [HttpGet]
    [Authorize(Policy = "Permission:Role.View")]
    public async Task<IActionResult> GetRoles(
        [FromQuery] string? search = null,
        [FromQuery] bool? systemOnly = null,
        [FromQuery] string? roleName = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (page < 1)
        {
            page = 1;
        }

        if (pageSize < 1)
        {
            pageSize = 10;
        }

        if (pageSize > 100)
        {
            pageSize = 100;
        }

        search = search?.Trim();
        roleName = roleName?.Trim();

        var query = db.Roles
            .AsNoTracking()
            .AsQueryable();

        // -----------------------------------------------------
        // Search
        // -----------------------------------------------------

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x =>
                x.Name.Contains(search) ||
                x.Description.Contains(search));
        }

        // -----------------------------------------------------
        // System / Custom
        // -----------------------------------------------------

        if (systemOnly.HasValue)
        {
            query = query.Where(x =>
                x.IsSystemRole == systemOnly.Value);
        }

        // -----------------------------------------------------
        // Exact Role Name
        // -----------------------------------------------------

        if (!string.IsNullOrWhiteSpace(roleName))
        {
            query = query.Where(x =>
                x.Name == roleName);
        }

        // -----------------------------------------------------
        // Total
        // -----------------------------------------------------

        var total = await query.CountAsync();

        var totalPages = (int)Math.Ceiling(
            total / (double)pageSize);

        if (totalPages > 0 && page > totalPages)
        {
            page = totalPages;
        }

        // -----------------------------------------------------
        // Data
        // -----------------------------------------------------

        var roles = await query
            .OrderByDescending(x => x.IsSystemRole)
            .ThenBy(x => x.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Description,
                x.IsSystemRole,
                x.CreatedAt,

                UserCount = db.Users.Count(u =>
                    u.Role == x.Name &&
                    !u.IsDeleted),

                PermissionCount = db.RolePermissions.Count(rp =>
                    rp.RoleId == x.Id)
            })
            .ToListAsync();

        return Ok(new
        {
            items = roles,
            page,
            pageSize,
            total,
            totalPages
        });
    }

    // =========================================================
    // GET: api/admin/roles/{id}
    //
    // Permission: Role.View
    // =========================================================

    [HttpGet("{id:int}")]
    [Authorize(Policy = "Permission:Role.View")]
    public async Task<IActionResult> GetRole(int id)
    {
        var role = await db.Roles
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Description,
                x.IsSystemRole,
                x.CreatedAt,

                UserCount = db.Users.Count(u =>
                    u.Role == x.Name &&
                    !u.IsDeleted),

                ActiveUserCount = db.Users.Count(u =>
                    u.Role == x.Name &&
                    !u.IsDeleted &&
                    u.IsActive),

                OnlineUserCount = db.Users.Count(u =>
                    u.Role == x.Name &&
                    !u.IsDeleted &&
                    u.IsActive &&
                    u.IsOnline),

                PermissionCount = db.RolePermissions.Count(rp =>
                    rp.RoleId == x.Id)
            })
            .FirstOrDefaultAsync();

        if (role == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy role."
            });
        }

        return Ok(role);
    }

    // =========================================================
    // POST: api/admin/roles
    //
    // Permission: Role.Create
    // =========================================================

    [HttpPost]
    [Authorize(Policy = "Permission:Role.Create")]
    public async Task<IActionResult> CreateRole(
        [FromBody] CreateRoleDto request)
    {
        var name = request.Name?.Trim();
        var description = request.Description?.Trim() ?? "";

        // -----------------------------------------------------
        // Validate Name
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new
            {
                message = "Tên role không được để trống."
            });
        }

        if (name.Length > 100)
        {
            return BadRequest(new
            {
                message = "Tên role không được vượt quá 100 ký tự."
            });
        }

        // -----------------------------------------------------
        // Validate Description
        // -----------------------------------------------------

        if (description.Length > 500)
        {
            return BadRequest(new
            {
                message = "Mô tả role không được vượt quá 500 ký tự."
            });
        }

        // -----------------------------------------------------
        // Duplicate
        // -----------------------------------------------------

        var exists = await db.Roles
            .AnyAsync(x => x.Name == name);

        if (exists)
        {
            return Conflict(new
            {
                message = "Role này đã tồn tại."
            });
        }

        // -----------------------------------------------------
        // Create
        // -----------------------------------------------------

        var role = new Role
        {
            Name = name,
            Description = description,
            IsSystemRole = false,
            CreatedAt = DateTime.UtcNow
        };

        db.Roles.Add(role);

        await db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetRole),
            new { id = role.Id },
            new
            {
                role.Id,
                role.Name,
                role.Description,
                role.IsSystemRole,
                role.CreatedAt
            });
    }

    // =========================================================
    // PUT: api/admin/roles/{id}
    //
    // Permission: Role.Update
    // =========================================================

    [HttpPut("{id:int}")]
    [Authorize(Policy = "Permission:Role.Update")]
    public async Task<IActionResult> UpdateRole(
        int id,
        [FromBody] UpdateRoleDto request)
    {
        var role = await db.Roles
            .FirstOrDefaultAsync(x => x.Id == id);

        if (role == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy role."
            });
        }

        var newName = request.Name?.Trim();
        var description = request.Description?.Trim() ?? "";

        // -----------------------------------------------------
        // Validate Name
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(newName))
        {
            return BadRequest(new
            {
                message = "Tên role không được để trống."
            });
        }

        if (newName.Length > 100)
        {
            return BadRequest(new
            {
                message = "Tên role không được vượt quá 100 ký tự."
            });
        }

        // -----------------------------------------------------
        // Validate Description
        // -----------------------------------------------------

        if (description.Length > 500)
        {
            return BadRequest(new
            {
                message = "Mô tả role không được vượt quá 500 ký tự."
            });
        }

        // -----------------------------------------------------
        // System Role
        //
        // Không cho đổi tên System Role.
        // -----------------------------------------------------

        if (role.IsSystemRole &&
            !string.Equals(
                role.Name,
                newName,
                StringComparison.Ordinal))
        {
            return BadRequest(new
            {
                message = "Không thể đổi tên System Role."
            });
        }

        // -----------------------------------------------------
        // Duplicate Name
        // -----------------------------------------------------

        var duplicate = await db.Roles
            .AnyAsync(x =>
                x.Id != id &&
                x.Name == newName);

        if (duplicate)
        {
            return Conflict(new
            {
                message = "Tên role này đã tồn tại."
            });
        }

        var oldName = role.Name;

        role.Name = newName;
        role.Description = description;

        // -----------------------------------------------------
        // Custom Role Rename
        //
        // User.Role đang lưu string.
        // Vì vậy phải đồng bộ User.Role.
        // -----------------------------------------------------

        if (!role.IsSystemRole &&
            !string.Equals(
                oldName,
                newName,
                StringComparison.Ordinal))
        {
            var users = await db.Users
                .Where(x =>
                    x.Role == oldName &&
                    !x.IsDeleted)
                .ToListAsync();

            foreach (var user in users)
            {
                user.Role = newName;
            }
        }

        await db.SaveChangesAsync();

        return Ok(new
        {
            message = "Cập nhật role thành công.",

            role = new
            {
                role.Id,
                role.Name,
                role.Description,
                role.IsSystemRole,
                role.CreatedAt
            }
        });
    }

    // =========================================================
    // DELETE: api/admin/roles/{id}
    //
    // Permission: Role.Delete
    // =========================================================

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "Permission:Role.Delete")]
    public async Task<IActionResult> DeleteRole(int id)
    {
        var role = await db.Roles
            .FirstOrDefaultAsync(x => x.Id == id);

        if (role == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy role."
            });
        }

        // -----------------------------------------------------
        // System Role
        // -----------------------------------------------------

        if (role.IsSystemRole)
        {
            return BadRequest(new
            {
                message = "Không thể xóa System Role."
            });
        }

        // -----------------------------------------------------
        // Role đang được sử dụng
        // -----------------------------------------------------

        var usersUsingRole = await db.Users
            .AnyAsync(x =>
                x.Role == role.Name &&
                !x.IsDeleted);

        if (usersUsingRole)
        {
            return Conflict(new
            {
                message =
                    "Không thể xóa role vì vẫn còn nhân viên đang sử dụng role này."
            });
        }

        // -----------------------------------------------------
        // Delete
        // -----------------------------------------------------

        db.Roles.Remove(role);

        await db.SaveChangesAsync();

        return Ok(new
        {
            message = "Xóa role thành công."
        });
    }

    // =========================================================
    // GET: api/admin/roles/{id}/permissions
    //
    // Permission: Role.View
    // =========================================================

    [HttpGet("{id:int}/permissions")]
    [Authorize(Policy = "Permission:Role.View")]
    public async Task<IActionResult> GetRolePermissions(int id)
    {
        var roleExists = await db.Roles
            .AnyAsync(x => x.Id == id);

        if (!roleExists)
        {
            return NotFound(new
            {
                message = "Không tìm thấy role."
            });
        }

        var permissions = await db.RolePermissions
            .AsNoTracking()
            .Where(x => x.RoleId == id)
            .OrderBy(x => x.Permission.Module)
            .ThenBy(x => x.Permission.Code)
            .Select(x => new RolePermissionDto(
                x.Permission.Id,
                x.Permission.Code,
                x.Permission.Name,
                x.Permission.Description,
                x.Permission.Module
            ))
            .ToListAsync();

        return Ok(permissions);
    }

    // =========================================================
    // PUT: api/admin/roles/{id}/permissions
    //
    // Permission: Role.Assign
    // =========================================================

    [HttpPut("{id:int}/permissions")]
    [Authorize(Policy = "Permission:Role.Assign")]
    public async Task<IActionResult> UpdateRolePermissions(
        int id,
        [FromBody] UpdateRolePermissionsDto request)
    {
        var role = await db.Roles
            .FirstOrDefaultAsync(x => x.Id == id);

        if (role == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy role."
            });
        }

        var permissionIds = request.PermissionIds?
            .Distinct()
            .ToList()
            ?? [];

        // -----------------------------------------------------
        // Validate Permission IDs
        // -----------------------------------------------------

        var existingPermissionIds = await db.Permissions
            .Where(x => permissionIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync();

        var invalidPermissionIds = permissionIds
            .Except(existingPermissionIds)
            .ToList();

        if (invalidPermissionIds.Count > 0)
        {
            return BadRequest(new
            {
                message = "Một hoặc nhiều Permission không tồn tại.",
                invalidPermissionIds
            });
        }

        // -----------------------------------------------------
        // Existing mappings
        // -----------------------------------------------------

        var currentMappings = await db.RolePermissions
            .Where(x => x.RoleId == id)
            .ToListAsync();

        db.RolePermissions.RemoveRange(currentMappings);

        // -----------------------------------------------------
        // New mappings
        // -----------------------------------------------------

        var newMappings = existingPermissionIds
            .Select(permissionId => new RolePermission
            {
                RoleId = id,
                PermissionId = permissionId
            })
            .ToList();

        if (newMappings.Count > 0)
        {
            await db.RolePermissions.AddRangeAsync(newMappings);
        }

        await db.SaveChangesAsync();

        return Ok(new
        {
            message = "Cập nhật Permission cho Role thành công.",
            roleId = id,
            permissionIds = existingPermissionIds
        });
    }

    // =========================================================
    // POST:
    // api/admin/roles/{id}/permissions/{permissionId}
    //
    // Permission: Role.Assign
    // =========================================================

    [HttpPost("{id:int}/permissions/{permissionId:int}")]
    [Authorize(Policy = "Permission:Role.Assign")]
    public async Task<IActionResult> AddPermissionToRole(
        int id,
        int permissionId)
    {
        // -----------------------------------------------------
        // Role
        // -----------------------------------------------------

        var roleExists = await db.Roles
            .AnyAsync(x => x.Id == id);

        if (!roleExists)
        {
            return NotFound(new
            {
                message = "Không tìm thấy role."
            });
        }

        // -----------------------------------------------------
        // Permission
        // -----------------------------------------------------

        var permissionExists = await db.Permissions
            .AnyAsync(x => x.Id == permissionId);

        if (!permissionExists)
        {
            return NotFound(new
            {
                message = "Không tìm thấy permission."
            });
        }

        // -----------------------------------------------------
        // Duplicate Mapping
        // -----------------------------------------------------

        var mappingExists = await db.RolePermissions
            .AnyAsync(x =>
                x.RoleId == id &&
                x.PermissionId == permissionId);

        if (mappingExists)
        {
            return Conflict(new
            {
                message =
                    "Permission này đã được gán cho role."
            });
        }

        db.RolePermissions.Add(new RolePermission
        {
            RoleId = id,
            PermissionId = permissionId
        });

        await db.SaveChangesAsync();

        return Ok(new
        {
            message = "Gán Permission cho Role thành công.",
            roleId = id,
            permissionId
        });
    }

    // =========================================================
    // DELETE:
    // api/admin/roles/{id}/permissions/{permissionId}
    //
    // Permission: Role.Assign
    // =========================================================

    [HttpDelete("{id:int}/permissions/{permissionId:int}")]
    [Authorize(Policy = "Permission:Role.Assign")]
    public async Task<IActionResult> RemovePermissionFromRole(
        int id,
        int permissionId)
    {
        var mapping = await db.RolePermissions
            .FirstOrDefaultAsync(x =>
                x.RoleId == id &&
                x.PermissionId == permissionId);

        if (mapping == null)
        {
            var roleExists = await db.Roles
                .AnyAsync(x => x.Id == id);

            if (!roleExists)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy role."
                });
            }

            var permissionExists = await db.Permissions
                .AnyAsync(x => x.Id == permissionId);

            if (!permissionExists)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy permission."
                });
            }

            return NotFound(new
            {
                message =
                    "Permission chưa được gán cho role."
            });
        }

        db.RolePermissions.Remove(mapping);

        await db.SaveChangesAsync();

        return Ok(new
        {
            message = "Gỡ Permission khỏi Role thành công.",
            roleId = id,
            permissionId
        });
    }

    // =========================================================
    // GET:
    // api/admin/roles/{id}/available-permissions
    //
    // Permission: Role.Assign
    //
    // Dùng cho Permission Matrix.
    // =========================================================

    [HttpGet("{id:int}/available-permissions")]
    [Authorize(Policy = "Permission:Role.Assign")]
    public async Task<IActionResult> GetAvailablePermissions(int id)
    {
        var roleExists = await db.Roles
            .AnyAsync(x => x.Id == id);

        if (!roleExists)
        {
            return NotFound(new
            {
                message = "Không tìm thấy role."
            });
        }

        var permissions = await db.Permissions
            .AsNoTracking()
            .OrderBy(x => x.Module)
            .ThenBy(x => x.Code)
            .Select(permission => new
            {
                permission.Id,
                permission.Code,
                permission.Name,
                permission.Description,
                permission.Module,

                Assigned = db.RolePermissions.Any(rp =>
                    rp.RoleId == id &&
                    rp.PermissionId == permission.Id)
            })
            .ToListAsync();

        return Ok(permissions);
    }

    // =========================================================
    // GET:
    // api/admin/roles/{id}/users
    //
    // Permission: Role.View
    // =========================================================

    [HttpGet("{id:int}/users")]
    [Authorize(Policy = "Permission:Role.View")]
    public async Task<IActionResult> GetRoleUsers(
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
        // Role
        // -----------------------------------------------------

        var role = await db.Roles
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (role == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy role."
            });
        }

        search = search?.Trim();

        // -----------------------------------------------------
        // Users
        // -----------------------------------------------------

        var query = db.Users
            .AsNoTracking()
            .Where(x =>
                x.Role == role.Name &&
                !x.IsDeleted);

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
            items = users,
            page,
            pageSize,
            total,
            totalPages
        });
    }
}