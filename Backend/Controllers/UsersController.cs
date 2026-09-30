using System.Security.Claims;
using CompanyChat.Api.Data;
using CompanyChat.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers(
        [FromQuery] string? search)
    {
        var currentUserId =
            int.Parse(
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier)!);

        var query = db.Users
            .AsNoTracking()
            .Where(x =>
                x.IsActive &&
                x.Id != currentUserId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();

            query = query.Where(x =>
                x.FullName.Contains(search) ||
                x.Username.Contains(search) ||
                x.Email.Contains(search));
        }

        var users = await query
            .OrderBy(x => x.FullName)
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
}