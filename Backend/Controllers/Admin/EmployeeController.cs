using System.Security.Claims;

using CompanyChat.Api.Authorization;
using CompanyChat.Api.Data;
using CompanyChat.Api.DTOs.User;
using CompanyChat.Api.Models;
using CompanyChat.Api.Services;
using CompanyChat.Api.Services.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/employees")]
public class EmployeeController(
    AppDbContext db,
    ConnectionManager connections,
    DepartmentScopeService departmentScopeService) : ControllerBase
{
    // =========================================================
    // GET: /api/admin/employees
    //
    // Employee list
    //
    // Permission:
    // - Employee.View
    //
    // Scope:
    // - Admin: Global
    // - Other users: Employee must belong to at least one
    //   Department within user's managed Scope.
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
        int page = 1,
        int pageSize = 20)
    {
        // =====================================================
        // Validate pagination
        // =====================================================

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        // =====================================================
        // Check current user's Scope
        // =====================================================

        var isAdmin =
            await departmentScopeService
                .IsAdminAsync(User);

        var managedDepartmentIds =
            isAdmin
                ? []
                : await departmentScopeService
                    .GetManagedDepartmentIdsAsync(User);

        // =====================================================
        // Base query
        // =====================================================

        var query = db.Users
            .AsNoTracking()
            .AsQueryable();

        // =====================================================
        // Scope filtering
        //
        // Admin:
        //     Global visibility.
        //
        // Non-admin:
        //     Employee must belong to at least one
        //     managed Department.
        //
        // Primary Department:
        //     User.DepartmentId
        //
        // Additional Departments:
        //     UserDepartments
        // =====================================================

        if (!isAdmin)
        {
            if (managedDepartmentIds.Count == 0)
            {
                return Ok(new
                {
                    items = Array.Empty<UserDto>(),
                    page,
                    pageSize,
                    total = 0,
                    totalPages = 0
                });
            }

            query = query.Where(x =>
                (
                    x.DepartmentId.HasValue &&
                    managedDepartmentIds.Contains(
                        x.DepartmentId.Value)
                )
                ||
                x.UserDepartments.Any(ud =>
                    managedDepartmentIds.Contains(
                        ud.DepartmentId))
            );
        }

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
            query = query.Where(x =>
                x.IsDeleted);
        }
        else
        {
            query = query.Where(x =>
                !x.IsDeleted);
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
                x.DepartmentId ==
                    departmentId.Value);
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

        var total =
            await query.CountAsync();

        var totalPages =
            total == 0
                ? 0
                : (int)Math.Ceiling(
                    total / (double)pageSize);

        // =====================================================
        // Pagination
        // =====================================================

        var employees =
            await query
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
    //
    // Scope:
    // - Admin: Global
    // - Other users: Any Department
    // =========================================================

    [Authorize(Policy = "Permission:Employee.View")]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserDto>> GetEmployee(
        int id)
    {
        var employee =
            await db.Users
                .AsNoTracking()
                .Where(x =>
                    x.Id == id &&
                    !x.IsDeleted)
                .Select(x => new
                {
                    User = x,

                    DepartmentIds =
                        x.UserDepartments
                            .Select(ud =>
                                ud.DepartmentId)
                            .ToList()
                })
                .FirstOrDefaultAsync();

        if (employee is null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy nhân viên."
            });
        }

        // =====================================================
        // Build Department IDs
        // =====================================================

        var departmentIds =
            GetEmployeeDepartmentIds(
                employee.User,
                employee.DepartmentIds);

        // =====================================================
        // Scope visibility
        // =====================================================

        var canView =
            await CanViewEmployeeAsync(
                departmentIds);

        if (!canView)
        {
            return Forbid();
        }

        // =====================================================
        // DTO
        // =====================================================

        var result =
            new UserDto(
                employee.User.Id,
                employee.User.Username,
                employee.User.FullName,
                employee.User.Email,
                employee.User.Role,
                employee.User.IsOnline,
                employee.User.LastSeen,
                employee.User.IsActive,
                employee.User.DepartmentId,
                employee.User.Department != null
                    ? employee.User.Department.Name
                    : null);

        return Ok(result);
    }


    // =========================================================
    // POST: /api/admin/employees
    //
    // Create Employee
    //
    // Permission:
    // - Employee.Create
    //
    // Scope:
    // - If Department is specified:
    //   target Department must be in Scope.
    //
    // - No Department:
    //   only global user can create unassigned employee.
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
                message =
                    "Username không được để trống."
            });
        }

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new
            {
                message =
                    "Họ tên không được để trống."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new
            {
                message =
                    "Email không được để trống."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message =
                    "Mật khẩu không được để trống."
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
        // Check username
        // =====================================================

        var usernameExists =
            await db.Users
                .AnyAsync(x =>
                    x.Username == username);

        if (usernameExists)
        {
            return Conflict(new
            {
                message =
                    "Username đã tồn tại."
            });
        }

        // =====================================================
        // Check email
        // =====================================================

        var emailExists =
            await db.Users
                .AnyAsync(x =>
                    x.Email == email);

        if (emailExists)
        {
            return Conflict(new
            {
                message =
                    "Email đã tồn tại."
            });
        }

        // =====================================================
        // Validate Department + Scope
        // =====================================================

        if (request.DepartmentId.HasValue)
        {
            var targetDepartmentId =
                request.DepartmentId.Value;

            var department =
                await db.Departments
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x =>
                        x.Id ==
                            targetDepartmentId);

            if (department is null)
            {
                return BadRequest(new
                {
                    message =
                        "Department không tồn tại."
                });
            }

            if (!department.IsActive)
            {
                return BadRequest(new
                {
                    message =
                        "Không thể gán nhân viên vào Department đang bị vô hiệu hóa."
                });
            }

            var canManageDepartment =
                await departmentScopeService
                    .CanManageDepartmentAsync(
                        User,
                        targetDepartmentId);

            if (!canManageDepartment)
            {
                return Forbid();
            }
        }
        else
        {
            // =================================================
            // Không có Department:
            //
            // Scoped user không được tạo employee
            // không thuộc Scope nào.
            //
            // Admin/global user vẫn được phép.
            // =================================================

            var isAdmin =
                await departmentScopeService
                    .IsAdminAsync(User);

            if (!isAdmin)
            {
                return Forbid();
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

        var response =
            new UserDto(
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
    //
    // Scope:
    // - All Departments of employee
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

        var employee =
            await db.Users
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
        // Scope
        //
        // Update employee information is a mutation
        // affecting the employee as a whole.
        //
        // Therefore require Scope over ALL departments.
        // =====================================================

        if (!await CanManageEmployeeAsync(employee))
        {
            return Forbid();
        }

        var email =
            request.Email.Trim();

        // =====================================================
        // Email duplicate
        // =====================================================

        var emailExists =
            await db.Users
                .AnyAsync(x =>
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

            userId =
                employee.Id
        });
    }


    // =========================================================
    // PATCH: /api/admin/employees/{id}/active
    //
    // Enable / Disable
    //
    // Permission:
    // - Employee.Lock
    //
    // Scope:
    // - All Departments of employee
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
        // Không cho tự disable chính mình
        // =====================================================

        if (id == currentUserId.Value &&
            !request.Active)
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

        var employee =
            await db.Users
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
        // Scope
        // =====================================================

        if (!await CanManageEmployeeAsync(employee))
        {
            return Forbid();
        }

        // =====================================================
        // Update active state
        // =====================================================

        employee.IsActive =
            request.Active;

        await db.SaveChangesAsync();

        // =====================================================
        // Nếu khóa tài khoản
        //
        // Disconnect toàn bộ WebSocket.
        // =====================================================

        if (!request.Active)
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
            message = request.Active
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
    //
    // Scope:
    // - All Departments of employee
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

        var employee =
            await db.Users
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
        // Scope
        // =====================================================

        if (!await CanManageEmployeeAsync(employee))
        {
            return Forbid();
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
    // Scope:
    //
    // Remove:
    //     old Department
    //
    // Transfer:
    //     old Department + new Department
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

        var employee =
            await db.Users
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
        // =====================================================

        if (departmentId is null)
        {
            // -----------------------------------------------
            // Employee must currently have a Department
            // to require Scope.
            // -----------------------------------------------

            if (employee.DepartmentId.HasValue)
            {
                var oldPrimaryId =
                    employee.DepartmentId.Value;

                var canManageOld =
                    await departmentScopeService
                        .CanManageDepartmentAsync(
                            User,
                            oldPrimaryId);

                if (!canManageOld)
                {
                    return Forbid();
                }

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
            else
            {
                // -------------------------------------------
                // Employee has no Department.
                //
                // Only global/Admin scope can mutate it.
                // -------------------------------------------

                var isAdmin =
                    await departmentScopeService
                        .IsAdminAsync(User);

                if (!isAdmin)
                {
                    return Forbid();
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
        // Department phải tồn tại
        // =====================================================

        var department =
            await db.Departments
                .FirstOrDefaultAsync(x =>
                    x.Id ==
                        departmentId.Value);

        if (department is null)
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
        // Scope:
        //
        // Transfer:
        //     old → new
        //
        // Must manage BOTH.
        // =====================================================

        var departmentIds =
            new List<int>
            {
                department.Id
            };

        if (employee.DepartmentId.HasValue)
        {
            departmentIds.Add(
                employee.DepartmentId.Value);
        }

        if (!await departmentScopeService
                .CanManageAllDepartmentsAsync(
                    User,
                    departmentIds))
        {
            return Forbid();
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
    //
    // Scope:
    // - Any Department
    // =========================================================

    [Authorize(Policy = "Permission:Employee.View")]
    [HttpGet("{id:int}/departments")]
    public async Task<IActionResult>
        GetEmployeeDepartments(int id)
    {
        // =====================================================
        // Find employee
        // =====================================================

        var employee =
            await db.Users
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
        // Get Department IDs
        // =====================================================

        var departmentIds =
            await GetEmployeeDepartmentIdsAsync(
                employee);

        // =====================================================
        // Scope visibility
        // =====================================================

        if (!await CanViewEmployeeAsync(
                departmentIds))
        {
            return Forbid();
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
    //
    // Scope:
    // - Target Department required
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

        var employee =
            await db.Users
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
        // Scope target Department
        // =====================================================

        var canManageDepartment =
            await departmentScopeService
                .CanManageDepartmentAsync(
                    User,
                    departmentId);

        if (!canManageDepartment)
        {
            return Forbid();
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
    //
    // Scope:
    // - Target Department required
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

        var employee =
            await db.Users
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
        // Cannot remove Primary Department
        // through Additional Department endpoint.
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
        // Scope target Department
        // =====================================================

        var canManageDepartment =
            await departmentScopeService
                .CanManageDepartmentAsync(
                    User,
                    departmentId);

        if (!canManageDepartment)
        {
            return Forbid();
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
    //
    // Scope:
    // - All Departments of employee
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

        var employee =
            await db.Users
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
        // Scope
        // =====================================================

        if (!await CanManageEmployeeAsync(employee))
        {
            return Forbid();
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
    //
    // Scope:
    // - All Departments of employee
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
        // Scope
        // =====================================================

        if (!await CanManageEmployeeAsync(employee))
        {
            return Forbid();
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
    //
    // Scope:
    // - All Departments of employee
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

        // =====================================================
        // Scope
        //
        // Restore employee vẫn giữ Department cũ.
        // Vì vậy phải kiểm tra toàn bộ Scope cũ.
        // =====================================================

        if (!await CanManageEmployeeAsync(employee))
        {
            return Forbid();
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
    //
    // Scope:
    // - Remove: old Department
    // - Transfer: old + new Department
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

                var canManageOld =
                    await departmentScopeService
                        .CanManageDepartmentAsync(
                            User,
                            oldPrimaryId);

                if (!canManageOld)
                {
                    return Forbid();
                }

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
            else
            {
                var isAdmin =
                    await departmentScopeService
                        .IsAdminAsync(User);

                if (!isAdmin)
                {
                    return Forbid();
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
        // Scope:
        //
        // Primary transfer:
        //
        //     A → B
        //
        // User must manage:
        //
        //     A + B
        // =====================================================

        var departmentIds =
            new List<int>
            {
                department.Id
            };

        if (user.DepartmentId.HasValue)
        {
            departmentIds.Add(
                user.DepartmentId.Value);
        }

        var canManageAll =
            await departmentScopeService
                .CanManageAllDepartmentsAsync(
                    User,
                    departmentIds);

        if (!canManageAll)
        {
            return Forbid();
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
    //
    // Scope:
    // - Target Department
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
        // Scope target Department
        // =====================================================

        var canManageDepartment =
            await departmentScopeService
                .CanManageDepartmentAsync(
                    User,
                    departmentId);

        if (!canManageDepartment)
        {
            return Forbid();
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
    //
    // Scope:
    // - Target Department
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
        // Scope target Department
        // =====================================================

        var canManageDepartment =
            await departmentScopeService
                .CanManageDepartmentAsync(
                    User,
                    departmentId);

        if (!canManageDepartment)
        {
            return Forbid();
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
    // PATCH:
    // /api/admin/employees/{id}/reset-password
    //
    // Admin reset password
    //
    // Permission:
    // - Employee.ResetPassword
    //
    // Scope:
    // - All Departments of employee
    // =========================================================




    // =========================================================
    // DELETE:
    // /api/admin/employees/{id}
    //
    // Soft Delete
    //
    // Permission:
    // - Employee.Delete
    //
    // Scope:
    // - All Departments of employee
    // =========================================================




    // =========================================================
    // PATCH:
    // /api/admin/employees/{id}/restore
    //
    // Restore employee
    //
    // Permission:
    // - Employee.Restore
    //
    // Scope:
    // - All Departments of employee
    // =========================================================

    


    // =========================================================
    // GET:
    // /api/admin/employees/roles
    //
    // Permission:
    // - Employee.View
    //
    // Scope:
    // Not required
    // =========================================================

    [Authorize(Policy = "Permission:Employee.View")]
    [HttpGet("roles")]
    public async Task<IActionResult> GetEmployeeRoles()
    {
        var roles =
            await db.Roles
                .AsNoTracking()
                .OrderBy(x => x.Name)
                .Select(x => new
                {
                    x.Id,
                    x.Name
                })
                .ToListAsync();

        return Ok(roles);
    }


    // =========================================================
    // HELPER:
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


    // =========================================================
    // HELPER:
    // Get employee Department IDs
    //
    // Result includes:
    // - Primary Department
    // - Additional Departments
    //
    // Duplicate IDs are removed.
    // =========================================================

    private async Task<List<int>>
        GetEmployeeDepartmentIdsAsync(
            User employee)
    {
        var additionalDepartmentIds =
            await db.UserDepartments
                .AsNoTracking()
                .Where(x =>
                    x.UserId ==
                        employee.Id)
                .Select(x =>
                    x.DepartmentId)
                .ToListAsync();

        return GetEmployeeDepartmentIds(
            employee,
            additionalDepartmentIds);
    }


    // =========================================================
    // HELPER:
    // Build employee Department IDs
    // =========================================================

    private static List<int>
        GetEmployeeDepartmentIds(
            User employee,
            IEnumerable<int> additionalDepartmentIds)
    {
        var departmentIds =
            additionalDepartmentIds
                .Where(x => x > 0)
                .ToHashSet();

        if (employee.DepartmentId.HasValue &&
            employee.DepartmentId.Value > 0)
        {
            departmentIds.Add(
                employee.DepartmentId.Value);
        }

        return departmentIds.ToList();
    }


    // =========================================================
    // HELPER:
    // CHECK EMPLOYEE VISIBILITY
    //
    // Visibility rule:
    //
    // Employee:
    //     Primary = A
    //     Additional = B
    //
    // User Scope:
    //     A
    //
    // Result:
    //     Can VIEW employee.
    //
    // Therefore:
    //
    // Visibility = ANY Department
    // =========================================================

    private async Task<bool>
        CanViewEmployeeAsync(
            IEnumerable<int> departmentIds)
    {
        var isAdmin =
            await departmentScopeService
                .IsAdminAsync(User);

        if (isAdmin)
        {
            return true;
        }

        var ids =
            departmentIds
                .Where(x => x > 0)
                .Distinct()
                .ToList();

        // -----------------------------------------------------
        // Employee không thuộc Department nào.
        //
        // Scoped user không được xem.
        // -----------------------------------------------------

        if (ids.Count == 0)
        {
            return false;
        }

        return await departmentScopeService
            .CanManageAnyDepartmentAsync(
                User,
                ids);
    }


    // =========================================================
    // HELPER:
    // CHECK EMPLOYEE MANAGEMENT SCOPE
    //
    // Mutation rule:
    //
    // Employee:
    //     Primary = A
    //     Additional = B
    //
    // User Scope:
    //     A
    //
    // Result:
    //     FALSE
    //
    // User must manage:
    //     A + B
    //
    // Therefore:
    //
    // Mutation = ALL Departments
    //
    // Employee không có Department:
    //     chỉ Admin/global scope được mutation.
    // =========================================================

    private async Task<bool>
        CanManageEmployeeAsync(
            User employee)
    {
        var isAdmin =
            await departmentScopeService
                .IsAdminAsync(User);

        if (isAdmin)
        {
            return true;
        }

        var departmentIds =
            await GetEmployeeDepartmentIdsAsync(
                employee);

        // -----------------------------------------------------
        // Không có Department.
        //
        // Scoped user không được mutation.
        // -----------------------------------------------------

        if (departmentIds.Count == 0)
        {
            return false;
        }

        return await departmentScopeService
            .CanManageAllDepartmentsAsync(
                User,
                departmentIds);
    }
}