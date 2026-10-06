using CompanyChat.Api.Authorization;
using CompanyChat.Api.Data;
using CompanyChat.Api.DTOs.Admin;
using CompanyChat.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/roles")]
[Authorize(Policy = Policies.ManageUsers)]
public class RoleController(AppDbContext db) : ControllerBase
{
    // =========================================================
    // GET: api/admin/roles
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetRoles(
        [FromQuery] string? search = null,
        [FromQuery] bool? systemOnly = null)
    {
        search = search?.Trim();

        var query = db.Roles
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x =>
                x.Name.Contains(search) ||
                x.Description.Contains(search));
        }

        if (systemOnly.HasValue)
        {
            query = query.Where(x =>
                x.IsSystemRole == systemOnly.Value);
        }

        var roles = await query
            .OrderByDescending(x => x.IsSystemRole)
            .ThenBy(x => x.Name)
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

        return Ok(roles);
    }

    // =========================================================
    // GET: api/admin/roles/{id}
    // =========================================================

    [HttpGet("{id:int}")]
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
    // =========================================================

    [HttpPost]
    public async Task<IActionResult> CreateRole(
        [FromBody] CreateRoleDto request)
    {
        var name = request.Name?.Trim();
        var description = request.Description?.Trim() ?? "";

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

        if (description.Length > 500)
        {
            return BadRequest(new
            {
                message = "Mô tả role không được vượt quá 500 ký tự."
            });
        }

        var exists = await db.Roles
            .AnyAsync(x => x.Name == name);

        if (exists)
        {
            return Conflict(new
            {
                message = "Role này đã tồn tại."
            });
        }

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
    // =========================================================

    [HttpPut("{id:int}")]
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

        // =====================================================
        // System Role
        // Không cho đổi tên
        // =====================================================

        var newName = request.Name?.Trim();
        var description = request.Description?.Trim() ?? "";

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

        if (description.Length > 500)
        {
            return BadRequest(new
            {
                message = "Mô tả role không được vượt quá 500 ký tự."
            });
        }

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

        // =====================================================
        // Kiểm tra tên trùng
        // =====================================================

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

        // =====================================================
        // Custom Role đổi tên
        //
        // User.Role đang lưu string nên phải đồng bộ.
        // =====================================================

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
    // =========================================================

    [HttpDelete("{id:int}")]
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

        // =====================================================
        // Không cho xóa System Role
        // =====================================================

        if (role.IsSystemRole)
        {
            return BadRequest(new
            {
                message = "Không thể xóa System Role."
            });
        }

        // =====================================================
        // Không cho xóa Role đang được sử dụng
        // =====================================================

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

        // =====================================================
        // RolePermission sẽ được Cascade Delete
        // theo AppDbContext hiện tại.
        // =====================================================

        db.Roles.Remove(role);

        await db.SaveChangesAsync();

        return Ok(new
        {
            message = "Xóa role thành công."
        });
    }

    // =========================================================
    // GET: api/admin/roles/{id}/permissions
    // =========================================================

    [HttpGet("{id:int}/permissions")]
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
    // =========================================================

    [HttpPut("{id:int}/permissions")]
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

        // =====================================================
        // Kiểm tra Permission tồn tại
        // =====================================================

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

        // =====================================================
        // Lấy mapping hiện tại
        // =====================================================

        var currentMappings = await db.RolePermissions
            .Where(x => x.RoleId == id)
            .ToListAsync();

        db.RolePermissions.RemoveRange(currentMappings);

        // =====================================================
        // Tạo mapping mới
        // =====================================================

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
    // POST: api/admin/roles/{id}/permissions/{permissionId}
    // =========================================================

    [HttpPost("{id:int}/permissions/{permissionId:int}")]
    public async Task<IActionResult> AddPermissionToRole(
        int id,
        int permissionId)
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

        var mappingExists = await db.RolePermissions
            .AnyAsync(x =>
                x.RoleId == id &&
                x.PermissionId == permissionId);

        if (mappingExists)
        {
            return Conflict(new
            {
                message = "Permission này đã được gán cho role."
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
    // DELETE: api/admin/roles/{id}/permissions/{permissionId}
    // =========================================================

    [HttpDelete("{id:int}/permissions/{permissionId:int}")]
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
                message = "Permission chưa được gán cho role."
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
    // =========================================================

    [HttpGet("{id:int}/available-permissions")]
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
    // =========================================================

    [HttpGet("{id:int}/users")]
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

        var totalPages = (int)Math.Ceiling(
            total / (double)pageSize);

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