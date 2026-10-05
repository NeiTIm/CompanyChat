using CompanyChat.Api.Authorization;
using CompanyChat.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/departments")]
[Authorize(Policy = Policies.ManageUsers)]
public class DepartmentController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetDepartments()
    {
        var departments =
            await db.Departments
                .AsNoTracking()
                .Where(x => x.IsActive)
                .OrderBy(x => x.Name)
                .Select(x => new
                {
                    id = x.Id,
                    name = x.Name
                })
                .ToListAsync();

        return Ok(departments);
    }
}