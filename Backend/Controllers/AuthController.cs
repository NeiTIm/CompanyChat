using CompanyChat.Api.Data;
using CompanyChat.Api.DTOs;
using CompanyChat.Api.Models;
using CompanyChat.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    AppDbContext db,
    JwtService jwt) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(
        LoginRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(
            x => x.Username == request.Username);

        if (user is null ||
            !user.IsActive ||
            !BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash))
        {
            return Unauthorized(new
            {
                message = "Username or password is incorrect."
            });
        }

        return Ok(new LoginResponse(
            jwt.CreateToken(user),
            ToDto(user)));
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register(
        RegisterRequest request)
    {
        if (await db.Users.AnyAsync(
            x => x.Username == request.Username))
        {
            return Conflict(new
            {
                message = "Username already exists."
            });
        }

        if (await db.Users.AnyAsync(
            x => x.Email == request.Email))
        {
            return Conflict(new
            {
                message = "Email already exists."
            });
        }

        var user = new User
        {
            Username = request.Username.Trim(),
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim(),
            PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "Employee"
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return Ok(ToDto(user));
    }

    private static UserDto ToDto(User user)
    {
        return new UserDto(
            user.Id,
            user.Username,
            user.FullName,
            user.Email,
            user.Role,
            user.IsOnline,
            user.LastSeen);
    }
}
