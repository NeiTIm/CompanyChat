using System.Security.Claims;
using CompanyChat.Api.Data;
using CompanyChat.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController(AppDbContext db) : ControllerBase
{
    // =========================
    // GET: /api/admin/users
    // =========================
    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        var users = await db.Users
            .AsNoTracking()
            .OrderBy(x => x.Id)
            .Select(x => new UserDto(
                x.Id,
                x.Username,
                x.FullName,
                x.Email,
                x.Role,
                x.IsOnline,
                x.LastSeen))
            .ToListAsync();

        return Ok(users);
    }

    // =========================
    // PATCH: /api/admin/users/{id}/active
    // =========================
    [HttpPatch("users/{id:int}/active")]
    public async Task<IActionResult> SetActive(
        int id,
        [FromBody] bool active)
    {
        var user = await db.Users.FindAsync(id);

        if (user is null)
            return NotFound();

        user.IsActive = active;

        await db.SaveChangesAsync();

        return NoContent();
    }

    // =========================
    // GET: /api/admin/users/{id}
    // =========================
    [HttpGet("users/{id:int}")]
    public async Task<ActionResult<UserDto>> GetUser(int id)
    {
        var user = await db.Users
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new UserDto(
                x.Id,
                x.Username,
                x.FullName,
                x.Email,
                x.Role,
                x.IsOnline,
                x.LastSeen))
            .FirstOrDefaultAsync();

        if (user is null)
            return NotFound(new
            {
                message = "Không tìm thấy user."
            });

        return Ok(user);
    }

    // =========================
    // PATCH: /api/admin/users/{id}/role
    // =========================
    [HttpPatch("users/{id:int}/role")]
    public async Task<IActionResult> SetRole(
        int id,
        [FromBody] UpdateUserRoleDto request)
    {
        var user = await db.Users.FindAsync(id);

        if (user is null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy user."
            });
        }

        // Chỉ cho phép 2 role hiện tại
        if (request.Role != "Admin" &&
            request.Role != "Employee")
        {
            return BadRequest(new
            {
                message = "Role chỉ được là Admin hoặc Employee."
            });
        }

        user.Role = request.Role;

        await db.SaveChangesAsync();

        return Ok(new
        {
            message = "Cập nhật role thành công.",
            userId = user.Id,
            role = user.Role
        });
    }

    // =========================
    // DELETE: /api/admin/users/{id}
    // =========================
    [HttpDelete("users/{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var currentUserIdString =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(currentUserIdString, out var currentUserId))
        {
            return Unauthorized();
        }

        // Không cho Admin tự xóa chính mình
        if (id == currentUserId)
        {
            return BadRequest(new
            {
                message = "Admin không thể tự xóa tài khoản của chính mình."
            });
        }

        var user = await db.Users.FindAsync(id);

        if (user is null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy user."
            });
        }

        db.Users.Remove(user);

        await db.SaveChangesAsync();

        return NoContent();
    }
}