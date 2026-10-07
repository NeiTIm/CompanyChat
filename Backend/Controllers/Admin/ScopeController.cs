using CompanyChat.Api.Authorization;
using CompanyChat.Api.Data;
using CompanyChat.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Controllers;

[ApiController]
[Route("api/admin/scopes")]
[Authorize]
public class ScopeController : ControllerBase
{
    private readonly AppDbContext db;
    private readonly ScopeService scopeService;

    public ScopeController(
        AppDbContext db,
        ScopeService scopeService)
    {
        this.db = db;
        this.scopeService = scopeService;
    }

    // =========================================================
    // GET USERS FOR SCOPE MANAGEMENT
    // GET /api/admin/scopes/users
    // =========================================================

    [HttpGet("users")]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> GetUsersWithScope(
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        [FromQuery] int? departmentId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        // =====================================================
        // USER QUERY
        // =====================================================

        var userQuery = db.Users
            .AsNoTracking()
            .Where(x => !x.IsDeleted);

        // =====================================================
        // SEARCH
        // =====================================================

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();

            userQuery = userQuery.Where(x =>
                x.FullName.Contains(keyword) ||
                x.Email.Contains(keyword));
        }

        // =====================================================
        // ROLE FILTER
        // =====================================================

        if (!string.IsNullOrWhiteSpace(role))
        {
            var roleValue = role.Trim();

            userQuery = userQuery.Where(x =>
                x.Role == roleValue);
        }

        // =====================================================
        // DEPARTMENT FILTER
        // =====================================================

        if (departmentId.HasValue)
        {
            var targetDepartmentId = departmentId.Value;

            userQuery = userQuery.Where(x =>
                db.UserManagedDepartments.Any(scope =>
                    scope.UserId == x.Id &&
                    scope.DepartmentId == targetDepartmentId));
        }

        // =====================================================
        // TOTAL
        // =====================================================

        var totalItems = await userQuery.CountAsync();

        // =====================================================
        // PAGED USERS
        // =====================================================

        var users = await userQuery
            .OrderBy(x => x.FullName)
            .ThenBy(x => x.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                userId = x.Id,
                fullName = x.FullName,
                email = x.Email,
                role = x.Role,
                isActive = x.IsActive
            })
            .ToListAsync();

        // =====================================================
        // GET CURRENT PAGE USER IDS
        // =====================================================

        var userIds = users
            .Select(x => x.userId)
            .ToList();

        // =====================================================
        // GET SCOPES FOR CURRENT PAGE
        // =====================================================

        var scopes = await db.UserManagedDepartments
            .AsNoTracking()
            .Where(x => userIds.Contains(x.UserId))
            .Select(x => new
            {
                userId = x.UserId,
                departmentId = x.DepartmentId,
                departmentName = x.Department.Name,
                isActive = x.Department.IsActive
            })
            .OrderBy(x => x.departmentName)
            .ToListAsync();

        // =====================================================
        // GROUP SCOPES BY USER
        // =====================================================

        var scopeLookup = scopes
            .GroupBy(x => x.userId)
            .ToDictionary(
                g => g.Key,
                g => g
                    .Select(x => new
                    {
                        x.departmentId,
                        x.departmentName,
                        x.isActive
                    })
                    .ToList());

        // =====================================================
        // MERGE USER + SCOPE
        // =====================================================

        var items = users
            .Select(user =>
            {
                scopeLookup.TryGetValue(
                    user.userId,
                    out var managedDepartments);

                managedDepartments ??= [];

                return new
                {
                    user.userId,
                    user.fullName,
                    user.email,
                    user.role,
                    user.isActive,

                    managedDepartmentCount =
                        managedDepartments.Count,

                    managedDepartments
                };
            })
            .ToList();

        // =====================================================
        // RESPONSE
        // =====================================================

        return Ok(new
        {
            items,
            page,
            pageSize,
            totalItems,

            totalPages =
                (int)Math.Ceiling(
                    totalItems / (double)pageSize)
        });
    }

    // =========================================================
    // GET USER SCOPE
    // GET /api/admin/scopes/users/{userId}
    // =========================================================

    [HttpGet("users/{userId:int}")]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> GetUserScope(
        int userId)
    {
        var user = await db.Users
            .AsNoTracking()
            .Where(x =>
                x.Id == userId &&
                !x.IsDeleted)
            .Select(x => new
            {
                x.Id,
                x.FullName,
                x.Email,
                x.Role,
                x.IsActive
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        var scopes = await db.UserManagedDepartments
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => new
            {
                departmentId = x.DepartmentId,
                departmentName = x.Department.Name,
                isActive = x.Department.IsActive
            })
            .OrderBy(x => x.departmentName)
            .ToListAsync();

        return Ok(new
        {
            userId = user.Id,
            fullName = user.FullName,
            email = user.Email,
            role = user.Role,
            isActive = user.IsActive,
            managedDepartments = scopes
        });
    }

    // =========================================================
    // AVAILABLE DEPARTMENTS
    // GET /api/admin/scopes/users/{userId}/available-departments
    // =========================================================

    [HttpGet("users/{userId:int}/available-departments")]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> GetAvailableDepartments(
        int userId,
        [FromQuery] string? search = null)
    {
        var userExists =
            await scopeService.UserExistsAsync(userId);

        if (!userExists)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        var departments =
            await scopeService.GetAvailableDepartmentsAsync(
                userId,
                search);

        var result = departments
            .Select(x => new
            {
                departmentId = x.Id,
                departmentName = x.Name,
                isActive = x.IsActive,
                isManaged = false
            })
            .ToList();

        return Ok(result);
    }

    // =========================================================
    // ASSIGN ONE DEPARTMENT
    // POST /api/admin/scopes/users/{userId}/departments/{departmentId}
    // =========================================================

    [HttpPost("users/{userId:int}/departments/{departmentId:int}")]
    [Authorize(Policy = "Permission:Scope.Assign")]
    public async Task<IActionResult> AssignDepartment(
        int userId,
        int departmentId)
    {
        var userExists =
            await scopeService.UserExistsAsync(userId);

        if (!userExists)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        var departmentExists =
            await scopeService.DepartmentExistsAsync(
                departmentId);

        if (!departmentExists)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        var alreadyExists =
            await scopeService.HasScopeAsync(
                userId,
                departmentId);

        if (alreadyExists)
        {
            return Conflict(new
            {
                message =
                    "User already has this department scope."
            });
        }

        var success =
            await scopeService.AssignDepartmentAsync(
                userId,
                departmentId);

        if (!success)
        {
            return BadRequest(new
            {
                message =
                    "Unable to assign department scope."
            });
        }

        return Ok(new
        {
            message =
                "Department scope assigned successfully.",

            userId,
            departmentId
        });
    }

    // =========================================================
    // REMOVE ONE DEPARTMENT
    // DELETE /api/admin/scopes/users/{userId}/departments/{departmentId}
    // =========================================================

    [HttpDelete("users/{userId:int}/departments/{departmentId:int}")]
    [Authorize(Policy = "Permission:Scope.Assign")]
    public async Task<IActionResult> RemoveDepartment(
        int userId,
        int departmentId)
    {
        var userExists =
            await scopeService.UserExistsAsync(userId);

        if (!userExists)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        var removed =
            await scopeService.RemoveDepartmentAsync(
                userId,
                departmentId);

        if (!removed)
        {
            return NotFound(new
            {
                message =
                    "Department scope not found."
            });
        }

        return Ok(new
        {
            message =
                "Department scope removed successfully.",

            userId,
            departmentId
        });
    }

    // =========================================================
    // BULK ASSIGN
    // POST /api/admin/scopes/users/{userId}/departments/bulk
    // =========================================================

    [HttpPost("users/{userId:int}/departments/bulk")]
    [Authorize(Policy = "Permission:Scope.Assign")]
    public async Task<IActionResult> AssignDepartments(
        int userId,
        [FromBody] BulkScopeRequest request)
    {
        if (request.DepartmentIds == null)
        {
            return BadRequest(new
            {
                message =
                    "DepartmentIds is required."
            });
        }

        var userExists =
            await scopeService.UserExistsAsync(userId);

        if (!userExists)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        var departmentIds = request.DepartmentIds
            .Where(x => x > 0)
            .Distinct()
            .ToList();

        if (departmentIds.Count == 0)
        {
            return BadRequest(new
            {
                message =
                    "At least one valid departmentId is required."
            });
        }

        // =====================================================
        // VALIDATE DEPARTMENTS
        // =====================================================

        var existingDepartmentIds =
            await db.Departments
                .AsNoTracking()
                .Where(x =>
                    departmentIds.Contains(x.Id))
                .Select(x => x.Id)
                .ToListAsync();

        var missingDepartmentIds =
            departmentIds
                .Except(existingDepartmentIds)
                .ToList();

        if (missingDepartmentIds.Count > 0)
        {
            return BadRequest(new
            {
                message =
                    "One or more departments do not exist.",

                invalidDepartmentIds =
                    missingDepartmentIds
            });
        }

        // =====================================================
        // ASSIGN
        // =====================================================

        var addedCount =
            await scopeService.AssignDepartmentsAsync(
                userId,
                departmentIds);

        return Ok(new
        {
            message =
                "Department scopes assigned successfully.",

            userId,
            addedCount
        });
    }

    // =========================================================
    // REPLACE ALL USER SCOPES
    // PUT /api/admin/scopes/users/{userId}
    // =========================================================

    [HttpPut("users/{userId:int}")]
    [Authorize(Policy = "Permission:Scope.Assign")]
    public async Task<IActionResult> ReplaceUserScope(
        int userId,
        [FromBody] ReplaceScopeRequest request)
    {
        if (request.DepartmentIds == null)
        {
            return BadRequest(new
            {
                message =
                    "DepartmentIds is required."
            });
        }

        var userExists =
            await scopeService.UserExistsAsync(userId);

        if (!userExists)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        var departmentIds = request.DepartmentIds
            .Where(x => x > 0)
            .Distinct()
            .ToList();

        var existingDepartmentIds =
            await db.Departments
                .AsNoTracking()
                .Where(x =>
                    departmentIds.Contains(x.Id))
                .Select(x => x.Id)
                .ToListAsync();

        var invalidDepartmentIds =
            departmentIds
                .Except(existingDepartmentIds)
                .ToList();

        if (invalidDepartmentIds.Count > 0)
        {
            return BadRequest(new
            {
                message =
                    "One or more departments do not exist.",

                invalidDepartmentIds
            });
        }

        var success =
            await scopeService.ReplaceDepartmentsAsync(
                userId,
                departmentIds);

        if (!success)
        {
            return BadRequest(new
            {
                message =
                    "Unable to replace user department scopes."
            });
        }

        return Ok(new
        {
            message =
                "User department scopes updated successfully.",

            userId,
            departmentIds
        });
    }

    // =========================================================
    // GET DEPARTMENTS WITH SCOPE USERS
    // GET /api/admin/scopes/departments
    // =========================================================

    [HttpGet("departments")]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> GetDepartmentsWithScope(
        [FromQuery] string? search = null,
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
            var keyword = search.Trim();

            query = query.Where(x =>
                x.Name.Contains(keyword));
        }

        var totalItems =
            await query.CountAsync();

        var items = await query
            .OrderBy(x => x.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                departmentId = x.Id,
                departmentName = x.Name,
                isActive = x.IsActive,

                managerCount =
                    db.UserManagedDepartments
                        .Where(s =>
                            s.DepartmentId == x.Id)
                        .Select(s => s.UserId)
                        .Distinct()
                        .Count()
            })
            .ToListAsync();

        return Ok(new
        {
            items,
            page,
            pageSize,
            totalItems,

            totalPages =
                (int)Math.Ceiling(
                    totalItems / (double)pageSize)
        });
    }

    // =========================================================
    // GET USERS BY DEPARTMENT
    // GET /api/admin/scopes/departments/{departmentId}/users
    // =========================================================

    [HttpGet("departments/{departmentId:int}/users")]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> GetUsersByDepartment(
        int departmentId)
    {
        var department =
            await db.Departments
                .AsNoTracking()
                .Where(x => x.Id == departmentId)
                .Select(x => new
                {
                    x.Id,
                    x.Name,
                    x.IsActive
                })
                .FirstOrDefaultAsync();

        if (department == null)
        {
            return NotFound(new
            {
                message =
                    "Department not found."
            });
        }

        var users =
            await db.UserManagedDepartments
                .AsNoTracking()
                .Where(x =>
                    x.DepartmentId == departmentId &&
                    !x.User.IsDeleted)
                .OrderBy(x => x.User.FullName)
                .Select(x => new
                {
                    userId = x.UserId,
                    fullName = x.User.FullName,
                    email = x.User.Email,
                    role = x.User.Role,
                    isActive = x.User.IsActive
                })
                .ToListAsync();

        return Ok(new
        {
            departmentId = department.Id,
            departmentName = department.Name,
            isActive = department.IsActive,
            users
        });
    }

    // =========================================================
    // STATISTICS
    // GET /api/admin/scopes/statistics
    // =========================================================

    [HttpGet("statistics")]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> GetStatistics()
    {
        var totalUsersWithScope =
            await scopeService
                .GetUsersWithScopeCountAsync();

        var totalScopeCount =
            await scopeService
                .GetTotalScopeCountAsync();

        var totalDepartmentsWithScope =
            await scopeService
                .GetDepartmentsWithScopeCountAsync();

        var totalDepartments =
            await db.Departments
                .AsNoTracking()
                .CountAsync();

        var totalDepartmentsWithoutScope =
            Math.Max(
                0,
                totalDepartments -
                totalDepartmentsWithScope);

        var averageDepartmentsPerUser =
            totalUsersWithScope == 0
                ? 0
                : Math.Round(
                    (double)totalScopeCount /
                    totalUsersWithScope,
                    2);

        // =====================================================
        // RESPONSE
        // =====================================================

        return Ok(new
        {
            totalUsersWithScope,
            totalScopeCount,
            totalDepartmentsWithScope,
            totalDepartmentsWithoutScope,
            averageDepartmentsPerUser
        });
    }
}

// =============================================================
// REQUEST MODELS
// =============================================================

public class BulkScopeRequest
{
    public List<int> DepartmentIds { get; set; } = [];
}

public class ReplaceScopeRequest
{
    public List<int> DepartmentIds { get; set; } = [];
}