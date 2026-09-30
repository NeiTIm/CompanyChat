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
}
