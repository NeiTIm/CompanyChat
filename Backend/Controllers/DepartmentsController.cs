using CompanyChat.Api.Authorization;
using CompanyChat.Api.Data;
using CompanyChat.Api.DTOs.Department;
using CompanyChat.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Controllers;

[ApiController]
[Route("api/departments")]
[Authorize]
public class DepartmentsController(AppDbContext db) : ControllerBase
{
    /*
     * =========================================================
     * GET ALL DEPARTMENTS
     * =========================================================
     */

    [HttpGet]
    [Authorize(Policy = Policies.ManageDepartments)]
    public async Task<ActionResult<IEnumerable<DepartmentDto>>>
        GetDepartments()
    {
        var departments =
            await db.Departments
                .AsNoTracking()
                .OrderBy(x => x.Name)
                .Select(x =>
                    new DepartmentDto(
                        x.Id,
                        x.Name,
                        x.Description,
                        x.IsActive,
                        x.CreatedAt,
                        x.Users.Count))
                .ToListAsync();

        return Ok(departments);
    }


    /*
     * =========================================================
     * GET DEPARTMENT BY ID
     * =========================================================
     */

    [HttpGet("{id:int}")]
    [Authorize(Policy = Policies.ManageDepartments)]
    public async Task<ActionResult<DepartmentDto>>
        GetDepartment(int id)
    {
        var department =
            await db.Departments
                .AsNoTracking()
                .Where(x => x.Id == id)
                .Select(x =>
                    new DepartmentDto(
                        x.Id,
                        x.Name,
                        x.Description,
                        x.IsActive,
                        x.CreatedAt,
                        x.Users.Count))
                .FirstOrDefaultAsync();

        if (department is null)
        {
            return NotFound(
                new
                {
                    message = "Department not found."
                });
        }

        return Ok(department);
    }


    /*
     * =========================================================
     * CREATE DEPARTMENT
     * =========================================================
     */

    [HttpPost]
    [Authorize(Policy = Policies.ManageDepartments)]
    public async Task<ActionResult<DepartmentDto>>
        CreateDepartment(
            [FromBody] CreateDepartmentRequest request)
    {
        var name =
            request.Name.Trim();

        var description =
            request.Description?.Trim() ?? "";


        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(
                new
                {
                    message =
                        "Department name is required."
                });
        }


        /*
         * Không cho phép trùng tên Department.
         */

        var exists =
            await db.Departments
                .AnyAsync(x =>
                    x.Name.ToLower() ==
                    name.ToLower());

        if (exists)
        {
            return Conflict(
                new
                {
                    message =
                        "Department name already exists."
                });
        }


        var department =
            new Department
            {
                Name = name,
                Description = description,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

        db.Departments.Add(department);

        await db.SaveChangesAsync();


        var result =
            new DepartmentDto(
                department.Id,
                department.Name,
                department.Description,
                department.IsActive,
                department.CreatedAt,
                0);

        return CreatedAtAction(
            nameof(GetDepartment),
            new
            {
                id = department.Id
            },
            result);
    }


    /*
     * =========================================================
     * UPDATE DEPARTMENT
     * =========================================================
     */

    [HttpPut("{id:int}")]
    [Authorize(Policy = Policies.ManageDepartments)]
    public async Task<IActionResult>
        UpdateDepartment(
            int id,
            [FromBody] UpdateDepartmentRequest request)
    {
        var department =
            await db.Departments
                .FirstOrDefaultAsync(
                    x => x.Id == id);

        if (department is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Department not found."
                });
        }


        var name =
            request.Name.Trim();

        var description =
            request.Description?.Trim() ?? "";


        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(
                new
                {
                    message =
                        "Department name is required."
                });
        }


        /*
         * Kiểm tra trùng tên với Department khác.
         */

        var exists =
            await db.Departments
                .AnyAsync(x =>
                    x.Id != id &&
                    x.Name.ToLower() ==
                    name.ToLower());

        if (exists)
        {
            return Conflict(
                new
                {
                    message =
                        "Department name already exists."
                });
        }


        department.Name = name;
        department.Description = description;

        await db.SaveChangesAsync();

        return NoContent();
    }


    /*
     * =========================================================
     * ACTIVE / INACTIVE
     * =========================================================
     */

    [HttpPatch("{id:int}/active")]
    [Authorize(Policy = Policies.ManageDepartments)]
    public async Task<IActionResult>
        SetActive(
            int id,
            [FromBody] bool active)
    {
        var department =
            await db.Departments
                .FirstOrDefaultAsync(
                    x => x.Id == id);

        if (department is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Department not found."
                });
        }


        department.IsActive = active;

        await db.SaveChangesAsync();

        return NoContent();
    }
}


/*
 * =========================================================
 * REQUEST MODELS
 * =========================================================
 */

public record CreateDepartmentRequest(
    string Name,
    string? Description);


public record UpdateDepartmentRequest(
    string Name,
    string? Description);