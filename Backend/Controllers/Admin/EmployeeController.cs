using System.Security.Claims;

using CompanyChat.Api.Authorization;
using CompanyChat.Api.Data;
using CompanyChat.Api.DTOs.User;
using CompanyChat.Api.Models;
using CompanyChat.Api.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/employees")]
public class EmployeeController(
    AppDbContext db,
    ConnectionManager connections) : ControllerBase
{
    // =========================================================
    // GET: /api/admin/employees
    //
    // Employee list
    //
    // Permission:
    // - Employee.View
    //
    // Supports:
    // - Search FullName / Username / Email
    // - Filter Department
    // - Filter Role
    // - Filter Active
    // - Filter Deleted
    // - Server-side pagination
    // =========================================================

    [Authorize(Policy = "Permission:Employee.View")]
    [HttpGet]
    public async Task<IActionResult> GetEmployees(
        [FromQuery] string? search,
        [FromQuery] int? departmentId,
        [FromQuery] string? role,
        [FromQuery] bool? isActive,
        [FromQuery] bool? isDeleted,
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
        // Filter Deleted
        //
        // Default:
        // isDeleted = false
        //
        // isDeleted=true:
        // chỉ lấy employee đã soft delete.
        // =====================================================

        if (isDeleted == true)
        {
            query = query.Where(x => x.IsDeleted);
        }
        else
        {
            query = query.Where(x => !x.IsDeleted);
        }

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
        // Filter Primary Department
        // =====================================================

        if (departmentId.HasValue)
        {
            query = query.Where(x =>
                x.DepartmentId == departmentId.Value);
        }

        // =====================================================
        // Filter Role
        // =====================================================

        if (!string.IsNullOrWhiteSpace(role))
        {
            role = role.Trim();

            query = query.Where(x =>
                x.Role == role);
        }

        // =====================================================
        // Filter Active
        // =====================================================

        if (isActive.HasValue)
        {
            query = query.Where(x =>
                x.IsActive == isActive.Value);
        }

        // =====================================================
        // Total
        // =====================================================

        var total = await query.CountAsync();

        var totalPages = (int)Math.Ceiling(
            total / (double)pageSize);

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
                x.Department != null
                    ? x.Department.Name
                    : null))
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
    //
    // Permission:
    // - Employee.View
    // =========================================================

    [Authorize(Policy = "Permission:Employee.View")]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserDto>> GetEmployee(
        int id)
    {
        var employee = await db.Users
            .AsNoTracking()
            .Where(x =>
                x.Id == id)
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
                x.Department != null
                    ? x.Department.Name
                    : null))
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
    //
    // Permission:
    // - Employee.Create
    // =========================================================

    [Authorize(Policy = "Permission:Employee.Create")]
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

        var username =
            request.Username.Trim();

        var fullName =
            request.FullName.Trim();

        var email =
            request.Email.Trim();

        var role =
            string.IsNullOrWhiteSpace(request.Role)
                ? "Employee"
                : request.Role.Trim();

        // =====================================================
        // Validate Role
        //
        // Không còn hard-code:
        // Admin / Employee
        //
        // Role phải tồn tại trong bảng Roles.
        // =====================================================

        var roleExists = await db.Roles
            .AsNoTracking()
            .AnyAsync(x =>
                x.Name == role);

        if (!roleExists)
        {
            return BadRequest(new
            {
                message =
                    $"Role '{role}' không tồn tại."
            });
        }

        // =====================================================
        // Check username
        // =====================================================

        var usernameExists = await db.Users
            .AnyAsync(x =>
                x.Username == username);

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
            .AnyAsync(x =>
                x.Email == email);

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
            var departmentExists =
                await db.Departments
                    .AnyAsync(x =>
                        x.Id ==
                            request.DepartmentId.Value &&
                        x.IsActive);

            if (!departmentExists)
            {
                return BadRequest(new
                {
                    message =
                        "Department không tồn tại hoặc đang bị vô hiệu hóa."
                });
            }
        }

        // =====================================================
        // Create User
        // =====================================================

        var user = new User
        {
            Username = username,

            FullName = fullName,

            Email = email,

            PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    request.Password),

            Role = role,

            DepartmentId =
                request.DepartmentId,

            IsActive = true,

            IsDeleted = false,

            DeletedAt = null,

            IsOnline = false,

            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);

        await db.SaveChangesAsync();

        // =====================================================
        // Load Department
        // =====================================================

        var departmentName =
            await db.Departments
                .Where(x =>
                    x.Id == user.DepartmentId)
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
            new
            {
                id = user.Id
            },
            response);
    }


    // =========================================================
    // PUT: /api/admin/employees/{id}
    //
    // Update basic employee information
    //
    // Permission:
    // - Employee.Update
    // =========================================================

    [Authorize(Policy = "Permission:Employee.Update")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateEmployee(
        int id,
        [FromBody] UpdateEmployeeDto request)
    {
        // =====================================================
        // Validate
        // =====================================================

        if (string.IsNullOrWhiteSpace(
                request.FullName))
        {
            return BadRequest(new
            {
                message =
                    "Họ tên không được để trống."
            });
        }

        if (string.IsNullOrWhiteSpace(
                request.Email))
        {
            return BadRequest(new
            {
                message =
                    "Email không được để trống."
            });
        }

        // =====================================================
        // Find non-deleted employee
        // =====================================================

        var employee = await db.Users
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                !x.IsDeleted);

        if (employee is null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy nhân viên."
            });
        }

        var email =
            request.Email.Trim();

        // =====================================================
        // Email duplicate
        // =====================================================

        var emailExists =
            await db.Users.AnyAsync(x =>
                x.Id != id &&
                x.Email == email);

        if (emailExists)
        {
            return Conflict(new
            {
                message =
                    "Email đã được sử dụng."
            });
        }

        // =====================================================
        // Update
        // =====================================================

        employee.FullName =
            request.FullName.Trim();

        employee.Email =
            email;

        await db.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Cập nhật thông tin nhân viên thành công.",

            userId = employee.Id
        });
    }


    // =========================================================
    // PATCH: /api/admin/employees/{id}/active
    //
    // Enable / Disable
    //
    // Permission:
    // - Employee.Lock
    // =========================================================

    [Authorize(Policy = "Permission:Employee.Lock")]
    [HttpPatch("{id:int}/active")]
    public async Task<IActionResult> SetActive(
        int id,
        [FromBody] UpdateEmployeeActiveDto request)
    {
        // =====================================================
        // Current user
        // =====================================================

        var currentUserId =
            GetCurrentUserId();

        if (currentUserId is null)
        {
            return Unauthorized();
        }

        // =====================================================
        // Active state
        // =====================================================

        var active =
            request.Active;

        // =====================================================
        // Không cho tự disable chính mình
        // =====================================================

        if (id == currentUserId.Value &&
            !active)
        {
            return BadRequest(new
            {
                message =
                    "Bạn không thể vô hiệu hóa chính tài khoản của mình."
            });
        }

        // =====================================================
        // Find non-deleted employee
        // =====================================================

        var employee = await db.Users
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                !x.IsDeleted);

        if (employee is null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy nhân viên."
            });
        }

        // =====================================================
        // Update active state
        // =====================================================

        employee.IsActive =
            active;

        await db.SaveChangesAsync();

        // =====================================================
        // Nếu khóa tài khoản
        //
        // Disconnect toàn bộ WebSocket.
        // =====================================================

        if (!active)
        {
            await connections
                .DisconnectUserAsync(
                    employee.Id,
                    "Tài khoản của bạn đã bị khóa.",
                    "locked");
        }

        // =====================================================
        // Response
        // =====================================================

        return Ok(new
        {
            message = active
                ? "Đã mở khóa nhân viên."
                : "Đã khóa nhân viên.",

            userId =
                employee.Id,

            isActive =
                employee.IsActive,

            isDeleted =
                employee.IsDeleted
        });
    }


    // =========================================================
    // PATCH: /api/admin/employees/{id}/role
    //
    // Change Role
    //
    // Permission:
    // - Role.Assign
    // =========================================================

    [Authorize(Policy = "Permission:Role.Assign")]
    [HttpPatch("{id:int}/role")]
    public async Task<IActionResult> SetRole(
        int id,
        [FromBody] UpdateUserRoleDto request)
    {
        // =====================================================
        // Validate role input
        // =====================================================

        if (string.IsNullOrWhiteSpace(
                request.Role))
        {
            return BadRequest(new
            {
                message =
                    "Role không được để trống."
            });
        }

        // =====================================================
        // Current user
        // =====================================================

        var currentUserId =
            GetCurrentUserId();

        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var role =
            request.Role.Trim();

        // =====================================================
        // Validate Role bằng database
        // =====================================================

        var roleExists =
            await db.Roles
                .AsNoTracking()
                .AnyAsync(x =>
                    x.Name == role);

        if (!roleExists)
        {
            return BadRequest(new
            {
                message =
                    $"Role '{role}' không tồn tại."
            });
        }

        // =====================================================
        // Không cho user tự thay đổi role
        // =====================================================

        if (id == currentUserId.Value)
        {
            return BadRequest(new
            {
                message =
                    "Bạn không thể thay đổi role của chính mình."
            });
        }

        // =====================================================
        // Find non-deleted employee
        // =====================================================

        var employee = await db.Users
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                !x.IsDeleted);

        if (employee is null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy nhân viên."
            });
        }

        // =====================================================
        // Update Role
        // =====================================================

        employee.Role =
            role;

        await db.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Cập nhật role thành công.",

            userId =
                employee.Id,

            role =
                employee.Role
        });
    }


    // =========================================================
    // PATCH: /api/admin/employees/{id}/department
    //
    // Assign / Remove PRIMARY Department
    //
    // Permission:
    // - Employee.AssignDepartment
    //
    // DepartmentId trong User
    // = Primary Department.
    // =========================================================

    [Authorize(
        Policy = "Permission:Employee.AssignDepartment")]
    [HttpPatch("{id:int}/department")]
    public async Task<IActionResult> SetDepartment(
        int id,
        [FromBody] int? departmentId)
    {
        // =====================================================
        // Find non-deleted employee
        // =====================================================

        var employee = await db.Users
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                !x.IsDeleted);

        if (employee is null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy nhân viên."
            });
        }

        // =====================================================
        // Remove Primary Department
        //
        // Nếu có stale additional membership
        // cùng DepartmentId hiện tại thì remove luôn.
        // =====================================================

        if (departmentId is null)
        {
            if (employee.DepartmentId.HasValue)
            {
                var oldPrimaryId =
                    employee.DepartmentId.Value;

                var staleAdditional =
                    await db.UserDepartments
                        .FirstOrDefaultAsync(x =>
                            x.UserId ==
                                employee.Id &&
                            x.DepartmentId ==
                                oldPrimaryId);

                if (staleAdditional is not null)
                {
                    db.UserDepartments.Remove(
                        staleAdditional);
                }
            }

            employee.DepartmentId =
                null;

            await db.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Đã bỏ nhân viên khỏi phòng ban chính.",

                userId =
                    employee.Id,

                departmentId =
                    (int?)null
            });
        }

        // =====================================================
        // Department phải tồn tại + active
        // =====================================================

        var department =
            await db.Departments
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.Id ==
                        departmentId.Value &&
                    x.IsActive);

        if (department is null)
        {
            return BadRequest(new
            {
                message =
                    "Department không tồn tại hoặc đang bị vô hiệu hóa."
            });
        }

        // =====================================================
        // Nếu Department mới đang nằm trong Additional
        // thì remove khỏi Additional trước.
        // =====================================================

        var existingAdditionalDepartment =
            await db.UserDepartments
                .FirstOrDefaultAsync(x =>
                    x.UserId ==
                        employee.Id &&
                    x.DepartmentId ==
                        department.Id);

        if (existingAdditionalDepartment
            is not null)
        {
            db.UserDepartments.Remove(
                existingAdditionalDepartment);
        }

        // =====================================================
        // Assign Primary Department
        // =====================================================

        employee.DepartmentId =
            department.Id;

        await db.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Cập nhật phòng ban chính thành công.",

            userId =
                employee.Id,

            departmentId =
                employee.DepartmentId,

            departmentName =
                department.Name
        });
    }


    // =========================================================
    // GET:
    // /api/admin/employees/{id}/departments
    //
    // Get Additional Departments
    //
    // Permission:
    // - Employee.View
    // =========================================================

    [Authorize(Policy = "Permission:Employee.View")]
    [HttpGet("{id:int}/departments")]
    public async Task<IActionResult>
        GetEmployeeDepartments(int id)
    {
        // =====================================================
        // Find employee
        // =====================================================

        var employee = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                !x.IsDeleted);

        if (employee is null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy nhân viên."
            });
        }

        // =====================================================
        // Get Additional Departments
        //
        // Primary Department không nằm trong danh sách.
        // =====================================================

        var departments =
            await db.UserDepartments
                .AsNoTracking()
                .Where(x =>
                    x.UserId == id &&
                    x.DepartmentId !=
                        employee.DepartmentId)
                .OrderBy(x =>
                    x.Department.Name)
                .Select(x =>
                    new UserDepartmentDto(
                        x.DepartmentId,
                        x.Department.Name,
                        x.Department.Description,
                        x.Department.IsActive))
                .ToListAsync();

        return Ok(departments);
    }


    // =========================================================
    // POST:
    // /api/admin/employees/{id}/departments
    //
    // Add Additional Department
    //
    // Permission:
    // - Employee.AssignDepartment
    // =========================================================

    [Authorize(
        Policy = "Permission:Employee.AssignDepartment")]
    [HttpPost("{id:int}/departments")]
    public async Task<IActionResult>
        AddEmployeeDepartment(
            int id,
            [FromBody] AssignDepartmentDto request)
    {
        // =====================================================
        // Validate DepartmentId
        // =====================================================

        var departmentId =
            request.DepartmentId;

        if (departmentId <= 0)
        {
            return BadRequest(new
            {
                message =
                    "DepartmentId không hợp lệ."
            });
        }

        // =====================================================
        // Find employee
        // =====================================================

        var employee = await db.Users
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                !x.IsDeleted);

        if (employee is null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy nhân viên."
            });
        }

        // =====================================================
        // Không cho thêm Primary Department
        // =====================================================

        if (employee.DepartmentId ==
            departmentId)
        {
            return BadRequest(new
            {
                message =
                    "Department này đang là phòng ban chính của nhân viên."
            });
        }

        // =====================================================
        // Department phải tồn tại + active
        // =====================================================

        var department =
            await db.Departments
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.Id == departmentId &&
                    x.IsActive);

        if (department is null)
        {
            return BadRequest(new
            {
                message =
                    "Department không tồn tại hoặc đang bị vô hiệu hóa."
            });
        }

        // =====================================================
        // Check duplicate
        // =====================================================

        var alreadyExists =
            await db.UserDepartments
                .AnyAsync(x =>
                    x.UserId == id &&
                    x.DepartmentId ==
                        departmentId);

        if (alreadyExists)
        {
            return Conflict(new
            {
                message =
                    "Nhân viên đã thuộc department này."
            });
        }

        // =====================================================
        // Add Additional Department
        // =====================================================

        var userDepartment =
            new UserDepartment
            {
                UserId = id,
                DepartmentId =
                    departmentId
            };

        db.UserDepartments.Add(
            userDepartment);

        await db.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Đã thêm department phụ cho nhân viên.",

            userId =
                id,

            departmentId =
                department.Id,

            departmentName =
                department.Name
        });
    }


    // =========================================================
    // DELETE:
    // /api/admin/employees/{id}/departments/{departmentId}
    //
    // Remove Additional Department
    //
    // Permission:
    // - Employee.AssignDepartment
    // =========================================================

    [Authorize(
        Policy = "Permission:Employee.AssignDepartment")]
    [HttpDelete(
        "{id:int}/departments/{departmentId:int}")]
    public async Task<IActionResult>
        RemoveEmployeeDepartment(
            int id,
            int departmentId)
    {
        // =====================================================
        // Find employee
        // =====================================================

        var employee = await db.Users
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                !x.IsDeleted);

        if (employee is null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy nhân viên."
            });
        }

        // =====================================================
        // Không cho remove Primary Department
        // bằng Additional Department endpoint.
        // =====================================================

        if (employee.DepartmentId ==
            departmentId)
        {
            return BadRequest(new
            {
                message =
                    "Không thể xóa Primary Department bằng chức năng này."
            });
        }

        // =====================================================
        // Find Additional Department
        // =====================================================

        var userDepartment =
            await db.UserDepartments
                .FirstOrDefaultAsync(x =>
                    x.UserId == id &&
                    x.DepartmentId ==
                        departmentId);

        if (userDepartment is null)
        {
            return NotFound(new
            {
                message =
                    "Nhân viên không thuộc department này."
            });
        }

        // =====================================================
        // Remove
        // =====================================================

        db.UserDepartments.Remove(
            userDepartment);

        await db.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Đã xóa department phụ của nhân viên.",

            userId =
                id,

            departmentId
        });
    }


    // =========================================================
    // PATCH:
    // /api/admin/employees/{id}/reset-password
    //
    // Admin reset password
    //
    // Permission:
    // - Employee.ResetPassword
    // =========================================================

    [Authorize(
        Policy = "Permission:Employee.ResetPassword")]
    [HttpPatch("{id:int}/reset-password")]
    public async Task<IActionResult> ResetPassword(
        int id,
        [FromBody] ResetEmployeePasswordDto request)
    {
        // =====================================================
        // Validate password
        // =====================================================

        if (string.IsNullOrWhiteSpace(
                request.NewPassword))
        {
            return BadRequest(new
            {
                message =
                    "Mật khẩu mới không được để trống."
            });
        }

        // =====================================================
        // Password policy cơ bản
        // =====================================================

        if (request.NewPassword.Length < 6)
        {
            return BadRequest(new
            {
                message =
                    "Mật khẩu phải có ít nhất 6 ký tự."
            });
        }

        // =====================================================
        // Find non-deleted employee
        // =====================================================

        var employee = await db.Users
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                !x.IsDeleted);

        if (employee is null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy nhân viên."
            });
        }

        // =====================================================
        // BCrypt
        // =====================================================

        employee.PasswordHash =
            BCrypt.Net.BCrypt.HashPassword(
                request.NewPassword);

        await db.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Đặt lại mật khẩu thành công.",

            userId =
                employee.Id
        });
    }


    // =========================================================
    // DELETE:
    // /api/admin/employees/{id}
    //
    // Soft Delete
    //
    // Permission:
    // - Employee.Delete
    // =========================================================

    [Authorize(
        Policy = "Permission:Employee.Delete")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult>
        DeleteEmployee(int id)
    {
        // =====================================================
        // Current user
        // =====================================================

        var currentUserId =
            GetCurrentUserId();

        if (currentUserId is null)
        {
            return Unauthorized();
        }

        // =====================================================
        // Không cho user tự xóa chính mình
        // =====================================================

        if (id == currentUserId.Value)
        {
            return BadRequest(new
            {
                message =
                    "Admin không thể tự xóa tài khoản của chính mình."
            });
        }

        // =====================================================
        // Find employee
        // =====================================================

        var employee =
            await db.Users
                .FirstOrDefaultAsync(x =>
                    x.Id == id);

        if (employee is null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy nhân viên."
            });
        }

        // =====================================================
        // Already deleted
        // =====================================================

        if (employee.IsDeleted)
        {
            return NotFound(new
            {
                message =
                    "Nhân viên này đã được xóa trước đó."
            });
        }

        // =====================================================
        // Soft delete
        // =====================================================

        employee.IsDeleted =
            true;

        employee.DeletedAt =
            DateTime.UtcNow;

        employee.IsActive =
            false;

        // =====================================================
        // Save
        // =====================================================

        await db.SaveChangesAsync();

        // =====================================================
        // Disconnect toàn bộ WebSocket
        // =====================================================

        await connections
            .DisconnectUserAsync(
                employee.Id,
                "Tài khoản của bạn đã bị xóa.",
                "deleted");

        // =====================================================
        // Response
        // =====================================================

        return Ok(new
        {
            message =
                "Đã xóa nhân viên.",

            userId =
                employee.Id,

            isDeleted =
                employee.IsDeleted,

            deletedAt =
                employee.DeletedAt,

            isActive =
                employee.IsActive
        });
    }


    // =========================================================
    // PATCH:
    // /api/admin/employees/{id}/restore
    //
    // Restore employee
    //
    // Permission:
    // - Employee.Restore
    // =========================================================

    [Authorize(
        Policy = "Permission:Employee.Restore")]
    [HttpPatch("{id:int}/restore")]
    public async Task<IActionResult>
        RestoreEmployee(int id)
    {
        var employee =
            await db.Users
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.IsDeleted);

        if (employee is null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy nhân viên đã bị xóa."
            });
        }

        employee.IsDeleted =
            false;

        employee.IsActive =
            true;

        employee.DeletedAt =
            null;

        await db.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Đã khôi phục nhân viên.",

            userId =
                employee.Id,

            isActive =
                employee.IsActive,

            isDeleted =
                employee.IsDeleted,

            deletedAt =
                employee.DeletedAt
        });
    }


    // =========================================================
    // PATCH:
    // /api/admin/employees/{userId}/primary-department
    //
    // Assign / Remove Primary Department
    //
    // Permission:
    // - Employee.AssignDepartment
    // =========================================================

    [Authorize(
        Policy = "Permission:Employee.AssignDepartment")]
    [HttpPatch("{userId:int}/primary-department")]
    public async Task<IActionResult>
        SetPrimaryDepartment(
            int userId,
            [FromBody] UpdatePrimaryDepartmentDto dto)
    {
        var user =
            await db.Users
                .FirstOrDefaultAsync(x =>
                    x.Id == userId &&
                    !x.IsDeleted);

        if (user == null)
        {
            return NotFound(new
            {
                message =
                    "Employee not found."
            });
        }

        // =====================================================
        // Remove Primary Department
        // =====================================================

        if (!dto.DepartmentId.HasValue)
        {
            if (user.DepartmentId.HasValue)
            {
                var oldPrimaryId =
                    user.DepartmentId.Value;

                var staleAdditional =
                    await db.UserDepartments
                        .FirstOrDefaultAsync(x =>
                            x.UserId ==
                                userId &&
                            x.DepartmentId ==
                                oldPrimaryId);

                if (staleAdditional is not null)
                {
                    db.UserDepartments.Remove(
                        staleAdditional);
                }
            }

            user.DepartmentId =
                null;

            await db.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Primary department removed.",

                userId,

                departmentId =
                    (int?)null
            });
        }

        // =====================================================
        // Find Department
        // =====================================================

        var department =
            await db.Departments
                .FirstOrDefaultAsync(x =>
                    x.Id ==
                        dto.DepartmentId.Value);

        if (department == null)
        {
            return NotFound(new
            {
                message =
                    "Department not found."
            });
        }

        // =====================================================
        // Department must be active
        // =====================================================

        if (!department.IsActive)
        {
            return BadRequest(new
            {
                message =
                    "Cannot assign an inactive department."
            });
        }

        // =====================================================
        // Remove duplicate Additional Department
        // =====================================================

        var oldAdditionalMembership =
            await db.UserDepartments
                .FirstOrDefaultAsync(x =>
                    x.UserId ==
                        userId &&
                    x.DepartmentId ==
                        department.Id);

        if (oldAdditionalMembership != null)
        {
            db.UserDepartments.Remove(
                oldAdditionalMembership);
        }

        // =====================================================
        // Assign Primary Department
        // =====================================================

        user.DepartmentId =
            department.Id;

        await db.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Primary department updated.",

            userId,

            departmentId =
                department.Id
        });
    }


    // =========================================================
    // POST:
    // /api/admin/employees/{userId}/additional-departments
    //
    // Assign Additional Department
    //
    // Permission:
    // - Employee.AssignDepartment
    // =========================================================

    [Authorize(
        Policy = "Permission:Employee.AssignDepartment")]
    [HttpPost("{userId:int}/additional-departments")]
    public async Task<IActionResult>
        AssignAdditionalDepartment(
            int userId,
            [FromBody] int departmentId)
    {
        var user =
            await db.Users
                .FirstOrDefaultAsync(x =>
                    x.Id == userId &&
                    !x.IsDeleted);

        if (user == null)
        {
            return NotFound(new
            {
                message =
                    "Employee not found."
            });
        }

        // =====================================================
        // Find Department
        // =====================================================

        var department =
            await db.Departments
                .FirstOrDefaultAsync(x =>
                    x.Id == departmentId);

        if (department == null)
        {
            return NotFound(new
            {
                message =
                    "Department not found."
            });
        }

        // =====================================================
        // Department must be active
        // =====================================================

        if (!department.IsActive)
        {
            return BadRequest(new
            {
                message =
                    "Cannot assign an inactive department."
            });
        }

        // =====================================================
        // Cannot duplicate Primary Department
        // =====================================================

        if (user.DepartmentId ==
            departmentId)
        {
            return Conflict(new
            {
                message =
                    "This department is already the primary department."
            });
        }

        // =====================================================
        // Check duplicate
        // =====================================================

        var exists =
            await db.UserDepartments
                .AnyAsync(x =>
                    x.UserId ==
                        userId &&
                    x.DepartmentId ==
                        departmentId);

        if (exists)
        {
            return Conflict(new
            {
                message =
                    "Employee is already in this department."
            });
        }

        // =====================================================
        // Add Additional Department
        // =====================================================

        db.UserDepartments.Add(
            new UserDepartment
            {
                UserId =
                    userId,

                DepartmentId =
                    departmentId
            });

        await db.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Additional department assigned.",

            userId,

            departmentId
        });
    }


    // =========================================================
    // DELETE:
    // /api/admin/employees/{userId}/additional-departments/{departmentId}
    //
    // Unassign Additional Department
    //
    // Permission:
    // - Employee.AssignDepartment
    // =========================================================

    [Authorize(
        Policy = "Permission:Employee.AssignDepartment")]
    [HttpDelete(
        "{userId:int}/additional-departments/{departmentId:int}")]
    public async Task<IActionResult>
        UnassignAdditionalDepartment(
            int userId,
            int departmentId)
    {
        var user =
            await db.Users
                .FirstOrDefaultAsync(x =>
                    x.Id == userId &&
                    !x.IsDeleted);

        if (user == null)
        {
            return NotFound(new
            {
                message =
                    "Employee not found."
            });
        }

        // =====================================================
        // Cannot remove Primary Department
        // through Additional Department API.
        // =====================================================

        if (user.DepartmentId ==
            departmentId)
        {
            return BadRequest(new
            {
                message =
                    "Cannot remove the primary department. Transfer the employee first."
            });
        }

        // =====================================================
        // Find membership
        // =====================================================

        var membership =
            await db.UserDepartments
                .FirstOrDefaultAsync(x =>
                    x.UserId ==
                        userId &&
                    x.DepartmentId ==
                        departmentId);

        if (membership == null)
        {
            return NotFound(new
            {
                message =
                    "Employee is not a member of this department."
            });
        }

        // =====================================================
        // Remove
        // =====================================================

        db.UserDepartments.Remove(
            membership);

        await db.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Additional department removed.",

            userId,

            departmentId
        });
    }


    // =========================================================
    // Helper:
    // Get current authenticated user ID
    // =========================================================

    private int? GetCurrentUserId()
    {
        var userId =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!int.TryParse(
                userId,
                out var id))
        {
            return null;
        }

        return id;
    }
}