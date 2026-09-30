using CompanyChat.Api.DTOs.Admin;
using CompanyChat.Api.Services.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CompanyChat.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Roles = "Admin")]
public class DashboardController(
    DashboardService dashboardService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<AdminDashboardDto>> Get()
    {
        var dashboard =
            await dashboardService.GetDashboardAsync();

        return Ok(dashboard);
    }
}