using System.Security.Claims;
using CompanyChat.Api.Authorization;
using CompanyChat.Api.Data;
using CompanyChat.Api.DTOs.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/employees")]
[Authorize(Policy = Policies.ManageUsers)]
public class EmployeeController(AppDbContext db) : ControllerBase
{
    // =========================================================
    // GET: /api/admin/employees
    //
    // Employee list
    //
    // Supports:
    // - Search FullName / Username / Email
    // - Filter Department
    // - Filter Role
    // - Filter Active
    // - Server-side pagination
    // =========================================================
    [HttpGet]
    public async Task<IActionResult> GetEmployees(
        [FromQuery] string? search,
        [FromQuery] int? departmentId,
        [FromQuery] string? role,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        // =====================================================
        // Validate pagination
        // =====================================================
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

        // =====================================================
        // Base query
        // =====================================================
        var query = db.Users
            .AsNoTracking()
            .AsQueryable();

        // =====================================================
        // Search
        // =====================================================
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            query = query.Where(x =>
                x.FullName.Contains(search) ||
                x.Username.Contains(search) ||
                x.Email.Contains(search));
        }

        // =====================================================
        // Filter Department
        // =====================================================
        if (departmentId.HasValue)
        {
            query = query.Where(x => x.DepartmentId == departmentId.Value);
        }

        // =====================================================
        // Filter Role
        // =====================================================
        if (!string.IsNullOrWhiteSpace(role))
        {
            role = role.Trim();
            query = query.Where(x => x.Role == role);
        }

        // =====================================================
        // Filter Active
        // =====================================================
        if (isActive.HasValue)
        {
            query = query.Where(x => x.IsActive == isActive.Value);
        }

        // =====================================================
        // Total
        // =====================================================
        var total = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);

        // =====================================================
        // Pagination
        // =====================================================
        var employees = await query
            .OrderBy(x => x.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new UserDto(
                x.Id,
                x.Username,
                x.FullName,
                x.Email,
                x.Role,
                x.IsOnline,
                x.LastSeen,
                x.IsActive,
                x.DepartmentId,
                x.Department != null ? x.Department.Name : null))
            .ToListAsync();

        // =====================================================
        // Response
        // =====================================================
        return Ok(new
        {
            items = employees,
            page,
            pageSize,
            total,
            totalPages
        });
    }

    // =========================================================
    // GET: /api/admin/employees/{id}
    //
    // Employee detail
    // =========================================================
    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserDto>> GetEmployee(int id)
    {
        var employee = await db.Users
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new UserDto(
                x.Id,
                x.Username,
                x.FullName,
                x.Email,
                x.Role,
                x.IsOnline,
                x.LastSeen,
                x.IsActive,
                x.DepartmentId,
                x.Department != null ? x.Department.Name : null))
            .FirstOrDefaultAsync();

        if (employee is null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhân viên."
            });
        }

        return Ok(employee);
    }

    // =========================================================
    // POST: /api/admin/employees
    //
    // Create Employee
    // =========================================================
    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateEmployee(
        [FromBody] CreateEmployeeDto request)
    {
        // =====================================================
        // Validate basic input
        // =====================================================
        if (string.IsNullOrWhiteSpace(request.Username))
        {
            return BadRequest(new
            {
                message = "Username không được để trống."
            });
        }

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new
            {
                message = "Họ tên không được để trống."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new
            {
                message = "Email không được để trống."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Mật khẩu không được để trống."
            });
        }

        // =====================================================
        // Normalize
        // =====================================================
        var username = request.Username.Trim();
        var fullName = request.FullName.Trim();
        var email = request.Email.Trim();
        var role = string.IsNullOrWhiteSpace(request.Role)
            ? "Employee"
            : request.Role.Trim();

        // =====================================================
        // Validate role
        // =====================================================
        if (role != "Admin" && role != "Employee")
        {
            return BadRequest(new
            {
                message = "Role chỉ được là Admin hoặc Employee."
            });
        }

        // =====================================================
        // Check username
        // =====================================================
        var usernameExists = await db.Users
            .AnyAsync(x => x.Username == username);

        if (usernameExists)
        {
            return Conflict(new
            {
                message = "Username đã tồn tại."
            });
        }

        // =====================================================
        // Check email
        // =====================================================
        var emailExists = await db.Users
            .AnyAsync(x => x.Email == email);

        if (emailExists)
        {
            return Conflict(new
            {
                message = "Email đã tồn tại."
            });
        }

        // =====================================================
        // Validate Department
        // =====================================================
        if (request.DepartmentId.HasValue)
        {
            var departmentExists = await db.Departments
                .AnyAsync(x =>
                    x.Id == request.DepartmentId.Value &&
                    x.IsActive);

            if (!departmentExists)
            {
                return BadRequest(new
                {
                    message = "Department không tồn tại hoặc đang bị vô hiệu hóa."
                });
            }
        }

        // =====================================================
        // Create user
        // =====================================================
        var user = new Models.User
        {
            Username = username,
            FullName = fullName,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = role,
            DepartmentId = request.DepartmentId,
            IsActive = true,
            IsOnline = false,
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        // =====================================================
        // Load Department
        // =====================================================
        var departmentName = await db.Departments
            .Where(x => x.Id == user.DepartmentId)
            .Select(x => x.Name)
            .FirstOrDefaultAsync();

        // =====================================================
        // Response DTO
        // =====================================================
        var response = new UserDto(
            user.Id,
            user.Username,
            user.FullName,
            user.Email,
            user.Role,
            user.IsOnline,
            user.LastSeen,
            user.IsActive,
            user.DepartmentId,
            departmentName);

        return CreatedAtAction(
            nameof(GetEmployee),
            new { id = user.Id },
            response);
    }

    // =========================================================
    // PUT: /api/admin/employees/{id}
    //
    // Update basic employee information
    //
    // Does NOT update:
    // - Password
    // - Role
    // - Department
    // - Active
    // =========================================================
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateEmployee(
        int id,
        [FromBody] UpdateEmployeeDto request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new
            {
                message = "Họ tên không được để trống."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new
            {
                message = "Email không được để trống."
            });
        }

        var employee = await db.Users.FindAsync(id);

        if (employee is null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhân viên."
            });
        }

        var email = request.Email.Trim();

        // =====================================================
        // Email duplicate
        // =====================================================
        var emailExists = await db.Users
            .AnyAsync(x => x.Id != id && x.Email == email);

        if (emailExists)
        {
            return Conflict(new
            {
                message = "Email đã được sử dụng."
            });
        }

        employee.FullName = request.FullName.Trim();
        employee.Email = email;

        await db.SaveChangesAsync();

        return Ok(new
        {
            message = "Cập nhật thông tin nhân viên thành công.",
            userId = employee.Id
        });
    }

    // =========================================================
    // PATCH: /api/admin/employees/{id}/active
    //
    // Enable / Disable
    // =========================================================
    [HttpPatch("{id:int}/active")]
    public async Task<IActionResult> SetActive(
        int id,
        [FromBody] bool active)
    {
        var currentUserId = GetCurrentUserId();

        if (currentUserId is null)
        {
            return Unauthorized();
        }

        // =====================================================
        // Không cho Admin tự disable chính mình
        // =====================================================
        if (id == currentUserId.Value && !active)
        {
            return BadRequest(new
            {
                message = "Bạn không thể vô hiệu hóa chính tài khoản của mình."
            });
        }

        var employee = await db.Users.FindAsync(id);

        if (employee is null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhân viên."
            });
        }

        employee.IsActive = active;
        await db.SaveChangesAsync();

        return Ok(new
        {
            message = active
                ? "Đã kích hoạt nhân viên."
                : "Đã vô hiệu hóa nhân viên.",
            userId = employee.Id,
            isActive = employee.IsActive
        });
    }

    // =========================================================
    // PATCH: /api/admin/employees/{id}/role
    //
    // Change Role
    // =========================================================
    [HttpPatch("{id:int}/role")]
    public async Task<IActionResult> SetRole(
        int id,
        [FromBody] UpdateUserRoleDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Role))
        {
            return BadRequest(new
            {
                message = "Role không được để trống."
            });
        }

        var currentUserId = GetCurrentUserId();

        if (currentUserId is null)
        {
            return Unauthorized();
        }

        // =====================================================
        // Role hiện tại
        // =====================================================
        var role = request.Role.Trim();

        if (role != "Admin" && role != "Employee")
        {
            return BadRequest(new
            {
                message = "Role chỉ được là Admin hoặc Employee."
            });
        }

        // =====================================================
        // Không cho Admin tự thay đổi role
        // =====================================================
        if (id == currentUserId.Value)
        {
            return BadRequest(new
            {
                message = "Bạn không thể thay đổi role của chính mình."
            });
        }

        var employee = await db.Users.FindAsync(id);

        if (employee is null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhân viên."
            });
        }

        employee.Role = role;
        await db.SaveChangesAsync();

        return Ok(new
        {
            message = "Cập nhật role thành công.",
            userId = employee.Id,
            role = employee.Role
        });
    }

    // =========================================================
    // PATCH: /api/admin/employees/{id}/department
    //
    // Assign / Remove Department
    //
    // Body:
    // 2
    //
    // hoặc:
    // null
    // =========================================================
    [HttpPatch("{id:int}/department")]
    public async Task<IActionResult> SetDepartment(
        int id,
        [FromBody] int? departmentId)
    {
        var employee = await db.Users.FindAsync(id);

        if (employee is null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhân viên."
            });
        }

        // =====================================================
        // null = remove department
        // =====================================================
        if (departmentId is null)
        {
            employee.DepartmentId = null;
            await db.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã bỏ nhân viên khỏi phòng ban.",
                userId = employee.Id,
                departmentId = (int?)null
            });
        }

        // =====================================================
        // Department phải tồn tại + active
        // =====================================================
        var department = await db.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.Id == departmentId.Value &&
                x.IsActive);

        if (department is null)
        {
            return BadRequest(new
            {
                message = "Department không tồn tại hoặc đang bị vô hiệu hóa."
            });
        }

        employee.DepartmentId = department.Id;
        await db.SaveChangesAsync();

        return Ok(new
        {
            message = "Cập nhật phòng ban thành công.",
            userId = employee.Id,
            departmentId = employee.DepartmentId,
            departmentName = department.Name
        });
    }

    // =========================================================
    // PATCH: /api/admin/employees/{id}/reset-password
    //
    // Admin reset password
    // =========================================================
    [HttpPatch("{id:int}/reset-password")]
    public async Task<IActionResult> ResetPassword(
        int id,
        [FromBody] ResetEmployeePasswordDto request)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new
            {
                message = "Mật khẩu mới không được để trống."
            });
        }

        // =====================================================
        // Password policy cơ bản
        // =====================================================
        if (request.NewPassword.Length < 6)
        {
            return BadRequest(new
            {
                message = "Mật khẩu phải có ít nhất 6 ký tự."
            });
        }

        var employee = await db.Users.FindAsync(id);

        if (employee is null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhân viên."
            });
        }

        // =====================================================
        // BCrypt
        // =====================================================
        employee.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await db.SaveChangesAsync();

        return Ok(new
        {
            message = "Đặt lại mật khẩu thành công.",
            userId = employee.Id
        });
    }

    // =========================================================
    // DELETE: /api/admin/employees/{id}
    //
    // Soft delete / disable
    // =========================================================
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteEmployee(int id)
    {
        var currentUserId = GetCurrentUserId();

        if (currentUserId is null)
        {
            return Unauthorized();
        }

        // =====================================================
        // Không cho Admin tự xóa chính mình
        // =====================================================
        if (id == currentUserId.Value)
        {
            return BadRequest(new
            {
                message = "Admin không thể tự xóa tài khoản của chính mình."
            });
        }

        var employee = await db.Users.FindAsync(id);

        if (employee is null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy nhân viên."
            });
        }

        // =====================================================
        // Soft delete
        // =====================================================
        employee.IsActive = false;
        await db.SaveChangesAsync();

        return Ok(new
        {
            message = "Đã vô hiệu hóa nhân viên.",
            userId = employee.Id,
            isActive = employee.IsActive
        });
    }

    // =========================================================
    // Helper:
    // Get current authenticated user ID
    // =========================================================
    private int? GetCurrentUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userId, out var id))
        {
            return null;
        }

        return id;
    }
}