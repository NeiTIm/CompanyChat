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
    /* =========================================================
       GET DEPARTMENTS
    ========================================================= */

    [HttpGet]
    public async Task<IActionResult> GetDepartments(
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
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

                x.Users.Count(u =>
                    !u.IsDeleted)

                +

                x.UserDepartments.Count(ud =>
                    !ud.User.IsDeleted &&
                    ud.User.DepartmentId != x.Id)
            ))
            .ToListAsync();

        var totalPages =
            Math.Max(
                (int)Math.Ceiling(
                    total / (double)pageSize),
                1);

        return Ok(new
        {
            items,
            total,
            page,
            pageSize,
            totalPages
        });
    }


    /* =========================================================
       GET DEPARTMENT DETAIL
    ========================================================= */

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetDepartment(
        int id)
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

                x.Users.Count(u =>
                    !u.IsDeleted)

                +

                x.UserDepartments.Count(ud =>
                    !ud.User.IsDeleted &&
                    ud.User.DepartmentId != x.Id)
            ))
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


    /* =========================================================
       CREATE DEPARTMENT
    ========================================================= */

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
                x.Name.ToLower() ==
                name.ToLower());

        if (exists)
        {
            return Conflict(new
            {
                message =
                    "A department with this name already exists."
            });
        }

        var department = new Department
        {
            Name = name,
            Description =
                dto.Description?.Trim() ?? "",
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
            new
            {
                id = department.Id
            },
            result);
    }


    /* =========================================================
       UPDATE DEPARTMENT
    ========================================================= */

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateDepartment(
        int id,
        [FromBody] UpdateDepartmentDto dto)
    {
        var department = await db.Departments
            .FirstOrDefaultAsync(x =>
                x.Id == id);

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

        var exists = await db.Departments
            .AnyAsync(x =>
                x.Id != id &&
                x.Name.ToLower() ==
                name.ToLower());

        if (exists)
        {
            return Conflict(new
            {
                message =
                    "A department with this name already exists."
            });
        }

        department.Name = name;

        department.Description =
            dto.Description?.Trim() ?? "";

        await db.SaveChangesAsync();

        var userCount =
            await GetMemberCountAsync(id);

        return Ok(new DepartmentDto(
            department.Id,
            department.Name,
            department.Description,
            department.IsActive,
            department.CreatedAt,
            userCount));
    }


    /* =========================================================
       UPDATE STATUS
    ========================================================= */

    [HttpPatch("{id:int}/active")]
    public async Task<IActionResult> UpdateDepartmentStatus(
        int id,
        [FromBody] UpdateDepartmentStatusDto dto)
    {
        var department = await db.Departments
            .FirstOrDefaultAsync(x =>
                x.Id == id);

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
            message = dto.IsActive
                ? "Department activated."
                : "Department deactivated.",

            id = department.Id,
            isActive = department.IsActive
        });
    }


    /* =========================================================
       GET MEMBERS
    ========================================================= */

    [HttpGet("{id:int}/members")]
    public async Task<IActionResult> GetMembers(
        int id,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var departmentExists =
            await db.Departments
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

        var total =
            await query.CountAsync();

        var items = await query
            .OrderBy(u => u.FullName)
            .ThenBy(u => u.Username)
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
                u.DepartmentId == id
            ))
            .ToListAsync();

        var totalPages =
            Math.Max(
                (int)Math.Ceiling(
                    total / (double)pageSize),
                1);

        return Ok(new
        {
            items,
            total,
            page,
            pageSize,
            totalPages
        });
    }


    /* =========================================================
       GET AVAILABLE MEMBERS
    ========================================================= */

    [HttpGet("{id:int}/available-members")]
    public async Task<IActionResult> GetAvailableMembers(
        int id,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var departmentExists =
            await db.Departments
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

        var total =
            await query.CountAsync();

        var items = await query
            .OrderBy(u => u.FullName)
            .ThenBy(u => u.Username)
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
                false
            ))
            .ToListAsync();

        var totalPages =
            Math.Max(
                (int)Math.Ceiling(
                    total / (double)pageSize),
                1);

        return Ok(new
        {
            items,
            total,
            page,
            pageSize,
            totalPages
        });
    }


    /* =========================================================
       ADD MEMBER
    ========================================================= */

    [HttpPost("{id:int}/members")]
    public async Task<IActionResult> AddMember(
        int id,
        [FromBody] DepartmentMemberRequestDto dto)
    {
        var userId = dto.UserId;

        var department = await db.Departments
            .FirstOrDefaultAsync(x =>
                x.Id == id);

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

        db.UserDepartments.Add(
            new UserDepartment
            {
                UserId = userId,
                DepartmentId = id
            });

        await db.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Employee added to department.",

            userId,
            departmentId = id,
            isPrimary = false
        });
    }


    /* =========================================================
       REMOVE MEMBER

       PRIMARY:
       DepartmentId = null

       ADDITIONAL:
       Remove UserDepartment

       Nếu dữ liệu cũ vô tình có cả Primary + UserDepartment
       cùng department thì xóa luôn UserDepartment dư.
    ========================================================= */

    [HttpDelete("{id:int}/members/{userId:int}")]
    public async Task<IActionResult> RemoveMember(
        int id,
        int userId)
    {
        var departmentExists =
            await db.Departments
                .AnyAsync(x => x.Id == id);

        if (!departmentExists)
        {
            return NotFound(new
            {
                message = "Department not found."
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

        var membership =
            await db.UserDepartments
                .FirstOrDefaultAsync(x =>
                    x.UserId == userId &&
                    x.DepartmentId == id);

        var isPrimary =
            user.DepartmentId == id;

        if (!isPrimary &&
            membership == null)
        {
            return NotFound(new
            {
                message =
                    "Employee is not a member of this department."
            });
        }


        /* =====================================================
           PRIMARY DEPARTMENT
        ===================================================== */

        if (isPrimary)
        {
            user.DepartmentId = null;
        }


        /* =====================================================
           ADDITIONAL DEPARTMENT
           hoặc duplicate dữ liệu cũ
        ===================================================== */

        if (membership != null)
        {
            db.UserDepartments.Remove(
                membership);
        }

        await db.SaveChangesAsync();

        return Ok(new
        {
            message = isPrimary
                ? "Primary department removed."
                : "Employee removed from department.",

            userId,
            departmentId = id,
            isPrimary
        });
    }


    /* =========================================================
       BULK ADD MEMBERS
    ========================================================= */

    [HttpPost("{id:int}/members/bulk")]
    public async Task<IActionResult> BulkAddMembers(
        int id,
        [FromBody] DepartmentMembersRequestDto dto)
    {
        if (dto.UserIds == null ||
            dto.UserIds.Length == 0)
        {
            return BadRequest(new
            {
                message =
                    "At least one employee is required."
            });
        }

        var department =
            await db.Departments
                .FirstOrDefaultAsync(x =>
                    x.Id == id);

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

        var userIds =
            dto.UserIds
                .Distinct()
                .ToArray();

        var users =
            await db.Users
                .Where(x =>
                    userIds.Contains(x.Id) &&
                    !x.IsDeleted &&
                    x.IsActive)
                .ToListAsync();

        if (users.Count == 0)
        {
            return NotFound(new
            {
                message =
                    "No valid employees were found."
            });
        }

        var existing =
            await db.UserDepartments
                .Where(x =>
                    x.DepartmentId == id &&
                    userIds.Contains(x.UserId))
                .Select(x => x.UserId)
                .ToListAsync();

        var existingSet =
            existing.ToHashSet();

        var addedUserIds =
            new List<int>();

        foreach (var user in users)
        {
            if (user.DepartmentId == id)
            {
                continue;
            }

            if (existingSet.Contains(user.Id))
            {
                continue;
            }

            db.UserDepartments.Add(
                new UserDepartment
                {
                    UserId = user.Id,
                    DepartmentId = id
                });

            addedUserIds.Add(user.Id);
        }

        await db.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Employees added to department.",

            departmentId = id,

            addedCount =
                addedUserIds.Count,

            addedUserIds
        });
    }


    /* =========================================================
       BULK REMOVE MEMBERS

       PRIMARY:
       DepartmentId = null

       ADDITIONAL:
       Remove UserDepartment
    ========================================================= */

    [HttpDelete("{id:int}/members/bulk")]
    public async Task<IActionResult> BulkRemoveMembers(
        int id,
        [FromBody] DepartmentMembersRequestDto dto)
    {
        if (dto.UserIds == null ||
            dto.UserIds.Length == 0)
        {
            return BadRequest(new
            {
                message =
                    "At least one employee is required."
            });
        }

        var departmentExists =
            await db.Departments
                .AnyAsync(x => x.Id == id);

        if (!departmentExists)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        var userIds =
            dto.UserIds
                .Distinct()
                .ToArray();

        var users =
            await db.Users
                .Where(x =>
                    userIds.Contains(x.Id) &&
                    !x.IsDeleted)
                .ToListAsync();

        if (users.Count == 0)
        {
            return NotFound(new
            {
                message =
                    "No valid employees were found."
            });
        }

        var additionalMemberships =
            await db.UserDepartments
                .Where(x =>
                    x.DepartmentId == id &&
                    userIds.Contains(x.UserId))
                .ToListAsync();

        var primaryRemovedUserIds =
            new List<int>();

        var additionalRemovedUserIds =
            new List<int>();


        /* =====================================================
           REMOVE PRIMARY
        ===================================================== */

        foreach (var user in users)
        {
            if (user.DepartmentId == id)
            {
                user.DepartmentId = null;

                primaryRemovedUserIds.Add(
                    user.Id);
            }
        }


        /* =====================================================
           REMOVE ADDITIONAL
        ===================================================== */

        foreach (var membership
            in additionalMemberships)
        {
            db.UserDepartments.Remove(
                membership);

            additionalRemovedUserIds.Add(
                membership.UserId);
        }

        await db.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Employees removed from department.",

            departmentId = id,

            primaryRemovedCount =
                primaryRemovedUserIds.Count,

            additionalRemovedCount =
                additionalRemovedUserIds.Count,

            primaryRemovedUserIds,

            additionalRemovedUserIds
        });
    }


    /* =========================================================
       STATISTICS
    ========================================================= */

    [HttpGet("{id:int}/statistics")]
    public async Task<IActionResult> GetStatistics(
        int id)
    {
        var department =
            await db.Departments
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.Id == id);

        if (department == null)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        var members =
            db.Users
                .AsNoTracking()
                .Where(u =>
                    !u.IsDeleted &&
                    (
                        u.DepartmentId == id ||

                        u.UserDepartments.Any(ud =>
                            ud.DepartmentId == id)
                    ));

        var memberCount =
            await members.CountAsync();

        var activeMemberCount =
            await members.CountAsync(x =>
                x.IsActive);

        var inactiveMemberCount =
            await members.CountAsync(x =>
                !x.IsActive);

        var primaryMemberCount =
            await members.CountAsync(x =>
                x.DepartmentId == id);

        var additionalMemberCount =
            await members.CountAsync(x =>
                x.DepartmentId != id &&
                x.UserDepartments.Any(ud =>
                    ud.DepartmentId == id));

        var onlineMemberCount =
            await members.CountAsync(x =>
                x.IsOnline);

        var messageCount =
            await db.Messages
                .CountAsync(m =>
                    m.Conversation != null &&
                    m.Conversation.DepartmentId == id);

        var result =
            new DepartmentStatisticsDto(
                id,
                department.Name,
                memberCount,
                activeMemberCount,
                inactiveMemberCount,
                primaryMemberCount,
                additionalMemberCount,
                onlineMemberCount,
                messageCount);

        return Ok(result);
    }


    /* =========================================================
       ACTIVITY
    ========================================================= */

    [HttpGet("{id:int}/activity")]
    public async Task<IActionResult> GetActivity(
        int id,
        [FromQuery] int days = 30)
    {
        days = Math.Clamp(days, 1, 365);

        var department =
            await db.Departments
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.Id == id);

        if (department == null)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        var fromDate =
            DateTime.UtcNow.Date
                .AddDays(-(days - 1));

        var rows =
            await db.Messages
                .AsNoTracking()
                .Where(m =>
                    m.Conversation != null &&
                    m.Conversation.DepartmentId == id &&
                    !m.IsDeleted &&
                    m.SentAt >= fromDate)
                .GroupBy(m =>
                    m.SentAt.Date)
                .Select(g =>
                    new DepartmentActivityDto(
                        g.Key,
                        g.Count(),
                        g.Select(x =>
                            x.SenderId)
                         .Distinct()
                         .Count()))
                .OrderBy(x =>
                    x.Date)
                .ToListAsync();

        return Ok(rows);
    }


    /* =========================================================
       MEMBER COUNT
    ========================================================= */

    private async Task<int> GetMemberCountAsync(
        int departmentId)
    {
        return await db.Users
            .CountAsync(u =>
                !u.IsDeleted &&
                (
                    u.DepartmentId ==
                        departmentId ||

                    u.UserDepartments.Any(ud =>
                        ud.DepartmentId ==
                            departmentId)
                ));
    }
}