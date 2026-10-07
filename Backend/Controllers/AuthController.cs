using CompanyChat.Api.Data;
using CompanyChat.Api.DTOs.Auth;
using CompanyChat.Api.DTOs.User;
using CompanyChat.Api.Models;
using CompanyChat.Api.Services;
using CompanyChat.Api.Services.Authorization;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    AppDbContext db,
    JwtService jwt,
    PermissionService permissionService) : ControllerBase
{
    // =========================================================
    // LOGIN
    // =========================================================

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(
        LoginRequest request)
    {
        var username = request.Username.Trim();

        var user = await db.Users
            .Include(x => x.Department)
            .FirstOrDefaultAsync(
                x => x.Username == username);

        // -----------------------------------------------------
        // USER KHÔNG TỒN TẠI / PASSWORD SAI
        // -----------------------------------------------------

        if (
            user is null ||
            !BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash)
        )
        {
            return Unauthorized(new
            {
                message = "Username or password is incorrect."
            });
        }

        // -----------------------------------------------------
        // USER ĐÃ BỊ SOFT DELETE
        // -----------------------------------------------------

        if (user.IsDeleted)
        {
            return Unauthorized(new
            {
                message = "Tài khoản đã bị xóa."
            });
        }

        // -----------------------------------------------------
        // USER BỊ KHÓA
        // -----------------------------------------------------

        if (!user.IsActive)
        {
            return Unauthorized(new
            {
                message = "Tài khoản đã bị khóa."
            });
        }

        // -----------------------------------------------------
        // GET USER PERMISSIONS
        // -----------------------------------------------------

        var permissions =
            await permissionService
                .GetUserPermissionsAsync(user.Id);

        // -----------------------------------------------------
        // CREATE TOKEN
        // -----------------------------------------------------

        var token = jwt.CreateToken(user);

        // -----------------------------------------------------
        // LOGIN SUCCESS
        // -----------------------------------------------------

        return Ok(new
        {
            token,

            user = ToDto(user),

            permissions
        });
    }

    // =========================================================
    // REGISTER
    // =========================================================

    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register(
        RegisterRequest request)
    {
        var username = request.Username.Trim();
        var fullName = request.FullName.Trim();
        var email = request.Email.Trim();

        // -----------------------------------------------------
        // CHECK USERNAME
        // -----------------------------------------------------

        if (await db.Users.AnyAsync(
            x => x.Username == username))
        {
            return Conflict(new
            {
                message = "Username already exists."
            });
        }

        // -----------------------------------------------------
        // CHECK EMAIL
        // -----------------------------------------------------

        if (await db.Users.AnyAsync(
            x => x.Email == email))
        {
            return Conflict(new
            {
                message = "Email already exists."
            });
        }

        // -----------------------------------------------------
        // CREATE USER
        // -----------------------------------------------------

        var user = new User
        {
            Username = username,
            FullName = fullName,
            Email = email,

            PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    request.Password),

            // Default role
            Role = "Employee",

            // Account status
            IsActive = true,
            IsDeleted = false,
            DeletedAt = null,

            // Online status
            IsOnline = false,
            LastSeen = null,

            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);

        await db.SaveChangesAsync();

        // -----------------------------------------------------
        // LOAD DEPARTMENT
        // -----------------------------------------------------

        await db.Entry(user)
            .Reference(x => x.Department)
            .LoadAsync();

        return Ok(ToDto(user));
    }

    // =========================================================
    // USER DTO
    // =========================================================

    private static UserDto ToDto(User user)
    {
        return new UserDto(
            user.Id,
            user.Username,
            user.FullName,
            user.Email,
            user.Role,
            user.IsOnline,
            user.LastSeen,
            user.IsActive,
            user.DepartmentId,
            user.Department != null
                ? user.Department.Name
                : null
        );
    }
}