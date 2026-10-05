using CompanyChat.Api.Authorization;
using CompanyChat.Api.Data;
using CompanyChat.Api.DTOs.Department;
using CompanyChat.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/departments")]
[Authorize(Policy = Policies.ManageUsers)]
public class DepartmentController(
    AppDbContext db) : ControllerBase
{
    // =========================================================
    // 1. GET /api/admin/departments
    // List + Search + Filter + Pagination
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetDepartments(
        [FromQuery] string? search,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Departments
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            query = query.Where(x =>
                x.Name.Contains(search) ||
                x.Description.Contains(search));
        }

        if (isActive.HasValue)
        {
            query = query.Where(x =>
                x.IsActive == isActive.Value);
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(x => x.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new DepartmentDto(
                x.Id,
                x.Name,
                x.Description,
                x.IsActive,
                x.CreatedAt,
                x.Users.Count(u => !u.IsDeleted) +
                x.UserDepartments.Count(ud =>
                    !ud.User.IsDeleted &&
                    ud.User.DepartmentId != x.Id)))
            .ToListAsync();

        return Ok(new
        {
            items,
            page,
            pageSize,
            total,
            totalPages = (int)Math.Ceiling(
                total / (double)pageSize)
        });
    }

    // =========================================================
    // 2. GET /api/admin/departments/{id}
    // Detail
    // =========================================================

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetDepartment(int id)
    {
        var department = await db.Departments
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new DepartmentDto(
                x.Id,
                x.Name,
                x.Description,
                x.IsActive,
                x.CreatedAt,
                x.Users.Count(u => !u.IsDeleted) +
                x.UserDepartments.Count(ud =>
                    !ud.User.IsDeleted &&
                    ud.User.DepartmentId != x.Id)))
            .FirstOrDefaultAsync();

        if (department == null)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        return Ok(department);
    }

    // =========================================================
    // 3. POST /api/admin/departments
    // Create
    // =========================================================

    [HttpPost]
    public async Task<IActionResult> CreateDepartment(
        [FromBody] CreateDepartmentDto dto)
    {
        var name = dto.Name.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new
            {
                message = "Department name is required."
            });
        }

        var exists = await db.Departments
            .AnyAsync(x =>
                x.Name.ToLower() == name.ToLower());

        if (exists)
        {
            return Conflict(new
            {
                message = "Department name already exists."
            });
        }

        var department = new Department
        {
            Name = name,
            Description = dto.Description?.Trim() ?? "",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        db.Departments.Add(department);

        await db.SaveChangesAsync();

        var result = new DepartmentDto(
            department.Id,
            department.Name,
            department.Description,
            department.IsActive,
            department.CreatedAt,
            0);

        return CreatedAtAction(
            nameof(GetDepartment),
            new { id = department.Id },
            result);
    }

    // =========================================================
    // 4. PUT /api/admin/departments/{id}
    // Update
    // =========================================================

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateDepartment(
        int id,
        [FromBody] UpdateDepartmentDto dto)
    {
        var department = await db.Departments
            .FirstOrDefaultAsync(x => x.Id == id);

        if (department == null)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        var name = dto.Name.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new
            {
                message = "Department name is required."
            });
        }

        var duplicate = await db.Departments
            .AnyAsync(x =>
                x.Id != id &&
                x.Name.ToLower() == name.ToLower());

        if (duplicate)
        {
            return Conflict(new
            {
                message = "Department name already exists."
            });
        }

        department.Name = name;
        department.Description =
            dto.Description?.Trim() ?? "";

        await db.SaveChangesAsync();

        return Ok(new DepartmentDto(
            department.Id,
            department.Name,
            department.Description,
            department.IsActive,
            department.CreatedAt,
            await GetMemberCountAsync(id)));
    }

    // =========================================================
    // 5. PATCH /api/admin/departments/{id}/active
    // Enable / Disable
    // =========================================================

    [HttpPatch("{id:int}/active")]
    public async Task<IActionResult> UpdateDepartmentStatus(
    int id,
    [FromBody] UpdateDepartmentStatusDto dto)
    {
        var department = await db.Departments
            .FirstOrDefaultAsync(x => x.Id == id);

        if (department == null)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        department.IsActive = dto.IsActive;

        await db.SaveChangesAsync();

        return Ok(new
        {
            department.Id,
            department.Name,
            department.IsActive
        });
    }

    // =========================================================
    // 6. GET /api/admin/departments/{id}/members
    // Members
    // =========================================================

    [HttpGet("{id:int}/members")]
    public async Task<IActionResult> GetMembers(
        int id,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var departmentExists = await db.Departments
            .AnyAsync(x => x.Id == id);

        if (!departmentExists)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        var query = db.Users
            .AsNoTracking()
            .Where(u =>
                !u.IsDeleted &&
                (
                    u.DepartmentId == id ||
                    u.UserDepartments.Any(ud =>
                        ud.DepartmentId == id)
                ));

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            query = query.Where(u =>
                u.Username.Contains(search) ||
                u.FullName.Contains(search) ||
                u.Email.Contains(search));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(u => u.FullName)
            .ThenBy(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new DepartmentMemberDto(
                u.Id,
                u.Username,
                u.FullName,
                u.Email,
                u.Role,
                u.IsActive,
                u.IsOnline,
                u.LastSeen,
                u.DepartmentId == id))
            .ToListAsync();

        return Ok(new
        {
            items,
            page,
            pageSize,
            total,
            totalPages = (int)Math.Ceiling(
                total / (double)pageSize)
        });
    }

    // =========================================================
    // 7. GET /api/admin/departments/{id}/available-members
    // Employees not currently in department
    // =========================================================

    [HttpGet("{id:int}/available-members")]
    public async Task<IActionResult> GetAvailableMembers(
        int id,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var department = await db.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (department == null)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        var query = db.Users
            .AsNoTracking()
            .Where(u =>
                !u.IsDeleted &&
                u.IsActive &&
                u.DepartmentId != id &&
                !u.UserDepartments.Any(ud =>
                    ud.DepartmentId == id));

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            query = query.Where(u =>
                u.Username.Contains(search) ||
                u.FullName.Contains(search) ||
                u.Email.Contains(search));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(u => u.FullName)
            .ThenBy(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new DepartmentMemberDto(
                u.Id,
                u.Username,
                u.FullName,
                u.Email,
                u.Role,
                u.IsActive,
                u.IsOnline,
                u.LastSeen,
                false))
            .ToListAsync();

        return Ok(new
        {
            items,
            page,
            pageSize,
            total,
            totalPages = (int)Math.Ceiling(
                total / (double)pageSize)
        });
    }

    // =========================================================
    // 8. POST /api/admin/departments/{id}/members
    // Add Additional Department
    // =========================================================

    [HttpPost("{id:int}/members")]
    public async Task<IActionResult> AddMember(
    int id,
    [FromBody] DepartmentMemberRequestDto dto)
    {
        var userId = dto.UserId;
        var department = await db.Departments
            .FirstOrDefaultAsync(x => x.Id == id);

        if (department == null)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        if (!department.IsActive)
        {
            return BadRequest(new
            {
                message =
                    "Cannot add members to an inactive department."
            });
        }

        var user = await db.Users
            .FirstOrDefaultAsync(x =>
                x.Id == userId &&
                !x.IsDeleted);

        if (user == null)
        {
            return NotFound(new
            {
                message = "Employee not found."
            });
        }

        if (!user.IsActive)
        {
            return BadRequest(new
            {
                message =
                    "Cannot add an inactive employee."
            });
        }

        if (user.DepartmentId == id)
        {
            return Conflict(new
            {
                message =
                    "Employee is already the primary member of this department."
            });
        }

        var exists = await db.UserDepartments
            .AnyAsync(x =>
                x.UserId == userId &&
                x.DepartmentId == id);

        if (exists)
        {
            return Conflict(new
            {
                message =
                    "Employee is already a member of this department."
            });
        }

        db.UserDepartments.Add(new UserDepartment
        {
            UserId = userId,
            DepartmentId = id
        });

        await db.SaveChangesAsync();

        return Ok(new
        {
            message = "Employee added to department.",
            userId,
            departmentId = id,
            isPrimary = false
        });
    }

    // =========================================================
    // 9. DELETE /api/admin/departments/{id}/members/{userId}
    // Remove Additional Department
    // =========================================================

    [HttpDelete("{id:int}/members/{userId:int}")]
    public async Task<IActionResult> RemoveMember(
        int id,
        int userId)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(x =>
                x.Id == userId &&
                !x.IsDeleted);

        if (user == null)
        {
            return NotFound(new
            {
                message = "Employee not found."
            });
        }

        if (user.DepartmentId == id)
        {
            return BadRequest(new
            {
                message =
                    "Cannot remove the primary department directly. Transfer the employee to another primary department first."
            });
        }

        var membership = await db.UserDepartments
            .FirstOrDefaultAsync(x =>
                x.UserId == userId &&
                x.DepartmentId == id);

        if (membership == null)
        {
            return NotFound(new
            {
                message =
                    "Employee is not a member of this department."
            });
        }

        db.UserDepartments.Remove(membership);

        await db.SaveChangesAsync();

        return Ok(new
        {
            message = "Employee removed from department.",
            userId,
            departmentId = id
        });
    }

    // =========================================================
    // 10. POST /api/admin/departments/{id}/members/bulk
    // Bulk Add Additional Members
    // =========================================================

    [HttpPost("{id:int}/members/bulk")]
    public async Task<IActionResult> BulkAddMembers(
    int id,
    [FromBody] DepartmentMembersRequestDto dto)
    {
        var userIds = dto.UserIds;
        if (userIds == null || userIds.Length == 0)
        {
            return BadRequest(new
            {
                message = "UserIds cannot be empty."
            });
        }

        var department = await db.Departments
            .FirstOrDefaultAsync(x => x.Id == id);

        if (department == null)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        if (!department.IsActive)
        {
            return BadRequest(new
            {
                message =
                    "Cannot add members to an inactive department."
            });
        }

        var distinctUserIds = userIds
            .Distinct()
            .ToList();

        var users = await db.Users
            .Where(u =>
                distinctUserIds.Contains(u.Id) &&
                !u.IsDeleted &&
                u.IsActive)
            .ToListAsync();

        var existingIds = await db.UserDepartments
            .Where(x =>
                x.DepartmentId == id &&
                distinctUserIds.Contains(x.UserId))
            .Select(x => x.UserId)
            .ToListAsync();

        var addedIds = new List<int>();

        foreach (var user in users)
        {
            if (user.DepartmentId == id)
            {
                continue;
            }

            if (existingIds.Contains(user.Id))
            {
                continue;
            }

            db.UserDepartments.Add(new UserDepartment
            {
                UserId = user.Id,
                DepartmentId = id
            });

            addedIds.Add(user.Id);
        }

        await db.SaveChangesAsync();

        return Ok(new
        {
            message = "Employees added to department.",
            departmentId = id,
            addedUserIds = addedIds,
            addedCount = addedIds.Count
        });
    }

    // =========================================================
    // 11. DELETE /api/admin/departments/{id}/members/bulk
    // Bulk Remove Additional Members
    // =========================================================

    [HttpDelete("{id:int}/members/bulk")]
    public async Task<IActionResult> BulkRemoveMembers(
    int id,
    [FromBody] DepartmentMembersRequestDto dto)
    {
        var userIds = dto.UserIds;
        if (userIds == null || userIds.Length == 0)
        {
            return BadRequest(new
            {
                message = "UserIds cannot be empty."
            });
        }

        var distinctUserIds = userIds
            .Distinct()
            .ToList();

        var memberships = await db.UserDepartments
            .Where(x =>
                x.DepartmentId == id &&
                distinctUserIds.Contains(x.UserId))
            .ToListAsync();

        if (memberships.Count == 0)
        {
            return NotFound(new
            {
                message =
                    "No additional department memberships were found."
            });
        }

        db.UserDepartments.RemoveRange(memberships);

        await db.SaveChangesAsync();

        return Ok(new
        {
            message = "Employees removed from department.",
            departmentId = id,
            removedUserIds =
                memberships.Select(x => x.UserId).ToList(),
            removedCount = memberships.Count
        });
    }

    // =========================================================
    // 12. GET /api/admin/departments/{id}/statistics
    // Statistics
    // =========================================================

    [HttpGet("{id:int}/statistics")]
    public async Task<IActionResult> GetStatistics(int id)
    {
        var department = await db.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (department == null)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        var users = db.Users
            .AsNoTracking()
            .Where(u =>
                !u.IsDeleted &&
                (
                    u.DepartmentId == id ||
                    u.UserDepartments.Any(ud =>
                        ud.DepartmentId == id)
                ));

        var memberCount = await users.CountAsync();

        var activeMemberCount = await users
            .CountAsync(x => x.IsActive);

        var inactiveMemberCount =
            memberCount - activeMemberCount;

        var primaryMemberCount = await db.Users
            .AsNoTracking()
            .CountAsync(x =>
                !x.IsDeleted &&
                x.DepartmentId == id);

        var additionalMemberCount =
            await db.UserDepartments
                .AsNoTracking()
                .CountAsync(x =>
                    x.DepartmentId == id &&
                    !x.User.IsDeleted &&
                    x.User.DepartmentId != id);

        var onlineMemberCount = await users
            .CountAsync(x => x.IsOnline);

        var messageCount = await db.Messages
            .AsNoTracking()
            .CountAsync(message =>
                message.Conversation != null &&
                message.Conversation.Type == "Department" &&
                message.Conversation.DepartmentId == id);

        return Ok(new DepartmentStatisticsDto(
            department.Id,
            department.Name,
            memberCount,
            activeMemberCount,
            inactiveMemberCount,
            primaryMemberCount,
            additionalMemberCount,
            onlineMemberCount,
            messageCount));
    }

    // =========================================================
    // 13. GET /api/admin/departments/{id}/activity
    // Activity by day
    // =========================================================

    [HttpGet("{id:int}/activity")]
    public async Task<IActionResult> GetActivity(
        int id,
        [FromQuery] int days = 7)
    {
        days = Math.Clamp(days, 1, 90);

        var departmentExists = await db.Departments
            .AnyAsync(x => x.Id == id);

        if (!departmentExists)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        var startDate = DateTime.UtcNow.Date
            .AddDays(-(days - 1));

        var messages = await db.Messages
            .AsNoTracking()
            .Where(message =>
                message.Conversation != null &&
                message.Conversation.Type == "Department" &&
                message.Conversation.DepartmentId == id &&
                message.SentAt >= startDate &&
                !message.IsDeleted)
            .Select(message => new
            {
                message.SentAt,
                message.SenderId
            })
            .ToListAsync();

        var activity = Enumerable
            .Range(0, days)
            .Select(offset =>
            {
                var date = startDate.AddDays(offset);

                var dayMessages = messages
                    .Where(x => x.SentAt.Date == date)
                    .ToList();

                return new DepartmentActivityDto(
                    date,
                    dayMessages.Count,
                    dayMessages
                        .Select(x => x.SenderId)
                        .Distinct()
                        .Count());
            })
            .ToList();

        return Ok(activity);
    }

    // =========================================================
    // HELPER
    // =========================================================

    private async Task<int> GetMemberCountAsync(
        int departmentId)
    {
        return await db.Users
            .AsNoTracking()
            .CountAsync(u =>
                !u.IsDeleted &&
                (
                    u.DepartmentId == departmentId ||
                    u.UserDepartments.Any(ud =>
                        ud.DepartmentId == departmentId)
                ));
    }
}