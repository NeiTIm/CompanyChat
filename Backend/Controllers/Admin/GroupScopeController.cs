using CompanyChat.Api.Services.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CompanyChat.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/group-scopes")]
[Authorize]
public class GroupScopeController : ControllerBase
{
    private readonly GroupScopeService _groupScopeService;

    public GroupScopeController(
        GroupScopeService groupScopeService)
    {
        _groupScopeService = groupScopeService;
    }

    // =====================================================
    // GROUP SCOPE
    // =====================================================

    [HttpGet]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> GetAll()
    {
        var groupScopes =
            await _groupScopeService.GetAllAsync();

        return Ok(groupScopes);
    }

    [HttpPost]
    [Authorize(Policy = "Permission:Scope.Assign")]
    public async Task<IActionResult> Create(
        [FromBody] CreateGroupScopeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new
            {
                message = "Tên Group Scope không được để trống."
            });
        }

        if (request.Name.Trim().Length > 100)
        {
            return BadRequest(new
            {
                message = "Tên Group Scope không được vượt quá 100 ký tự."
            });
        }

        if (request.Description?.Length > 500)
        {
            return BadRequest(new
            {
                message = "Mô tả không được vượt quá 500 ký tự."
            });
        }

        var groupScope =
            await _groupScopeService.CreateAsync(
                request.Name,
                request.Description);

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                scopeGroupId = groupScope.Id
            },
            groupScope);
    }

    [HttpGet("{scopeGroupId:int}")]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> GetById(
        int scopeGroupId)
    {
        var groupScope =
            await _groupScopeService.GetByIdAsync(
                scopeGroupId);

        if (groupScope == null)
        {
            return NotFound(new
            {
                message = "Scope Group không tồn tại."
            });
        }

        return Ok(groupScope);
    }

    [HttpPut("{scopeGroupId:int}")]
    [Authorize(Policy = "Permission:Scope.Assign")]
    public async Task<IActionResult> Update(
        int scopeGroupId,
        [FromBody] UpdateGroupScopeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new
            {
                message = "Tên Group Scope không được để trống."
            });
        }

        if (request.Name.Trim().Length > 100)
        {
            return BadRequest(new
            {
                message = "Tên Group Scope không được vượt quá 100 ký tự."
            });
        }

        if (request.Description?.Length > 500)
        {
            return BadRequest(new
            {
                message = "Mô tả không được vượt quá 500 ký tự."
            });
        }

        var updated =
            await _groupScopeService.UpdateAsync(
                scopeGroupId,
                request.Name,
                request.Description);

        if (!updated)
        {
            return NotFound(new
            {
                message = "Scope Group không tồn tại."
            });
        }

        var groupScope =
            await _groupScopeService.GetByIdAsync(
                scopeGroupId);

        return Ok(groupScope);
    }

    [HttpDelete("{scopeGroupId:int}")]
    [Authorize(Policy = "Permission:Scope.Assign")]
    public async Task<IActionResult> Delete(
        int scopeGroupId)
    {
        var deleted =
            await _groupScopeService.DeleteAsync(
                scopeGroupId);

        if (!deleted)
        {
            return NotFound(new
            {
                message = "Scope Group không tồn tại."
            });
        }

        return NoContent();
    }

    // =====================================================
    // DIRECT USERS
    // =====================================================

    [HttpGet("{scopeGroupId:int}/users")]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> GetDirectUsers(
        int scopeGroupId)
    {
        var exists =
            await _groupScopeService.ExistsAsync(
                scopeGroupId);

        if (!exists)
        {
            return NotFound(new
            {
                message = "Scope Group không tồn tại."
            });
        }

        var users =
            await _groupScopeService.GetDirectUsersAsync(
                scopeGroupId);

        return Ok(users);
    }

    [HttpGet("{scopeGroupId:int}/users/{userId:int}")]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> HasUserScope(
        int scopeGroupId,
        int userId)
    {
        var scopeGroupExists =
            await _groupScopeService.ExistsAsync(
                scopeGroupId);

        if (!scopeGroupExists)
        {
            return NotFound(new
            {
                message = "Scope Group không tồn tại."
            });
        }

        var hasScope =
            await _groupScopeService.HasUserScopeAsync(
                scopeGroupId,
                userId);

        return Ok(new
        {
            scopeGroupId,
            userId,
            hasScope
        });
    }

    [HttpPost("{scopeGroupId:int}/users/{userId:int}")]
    [Authorize(Policy = "Permission:Scope.Assign")]
    public async Task<IActionResult> AssignUser(
        int scopeGroupId,
        int userId)
    {
        var scopeGroupExists =
            await _groupScopeService.ExistsAsync(
                scopeGroupId);

        if (!scopeGroupExists)
        {
            return NotFound(new
            {
                message = "Scope Group không tồn tại."
            });
        }

        var assigned =
            await _groupScopeService.AssignUserAsync(
                scopeGroupId,
                userId);

        if (!assigned)
        {
            return BadRequest(new
            {
                message =
                    "Không thể gán User. User không tồn tại, không hoạt động hoặc đã bị xóa."
            });
        }

        return Ok(new
        {
            message = "Gán User vào Group Scope thành công.",
            scopeGroupId,
            userId
        });
    }

    [HttpDelete("{scopeGroupId:int}/users/{userId:int}")]
    [Authorize(Policy = "Permission:Scope.Assign")]
    public async Task<IActionResult> RemoveUser(
        int scopeGroupId,
        int userId)
    {
        var scopeGroupExists =
            await _groupScopeService.ExistsAsync(
                scopeGroupId);

        if (!scopeGroupExists)
        {
            return NotFound(new
            {
                message = "Scope Group không tồn tại."
            });
        }

        var removed =
            await _groupScopeService.RemoveUserAsync(
                scopeGroupId,
                userId);

        if (!removed)
        {
            return NotFound(new
            {
                message =
                    "User chưa được gán vào Group Scope."
            });
        }

        return Ok(new
        {
            message = "Xóa User khỏi Group Scope thành công.",
            scopeGroupId,
            userId
        });
    }

    // =====================================================
    // DEPARTMENTS
    // =====================================================

    [HttpGet("{scopeGroupId:int}/departments")]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> GetDepartments(
        int scopeGroupId)
    {
        var exists =
            await _groupScopeService.ExistsAsync(
                scopeGroupId);

        if (!exists)
        {
            return NotFound(new
            {
                message = "Scope Group không tồn tại."
            });
        }

        var departments =
            await _groupScopeService.GetDepartmentsAsync(
                scopeGroupId);

        return Ok(departments);
    }

    [HttpGet("{scopeGroupId:int}/departments/{departmentId:int}")]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> HasDepartmentScope(
        int scopeGroupId,
        int departmentId)
    {
        var scopeGroupExists =
            await _groupScopeService.ExistsAsync(
                scopeGroupId);

        if (!scopeGroupExists)
        {
            return NotFound(new
            {
                message = "Scope Group không tồn tại."
            });
        }

        var hasScope =
            await _groupScopeService.HasDepartmentScopeAsync(
                scopeGroupId,
                departmentId);

        return Ok(new
        {
            scopeGroupId,
            departmentId,
            hasScope
        });
    }

    [HttpPost("{scopeGroupId:int}/departments/{departmentId:int}")]
    [Authorize(Policy = "Permission:Scope.Assign")]
    public async Task<IActionResult> AssignDepartment(
        int scopeGroupId,
        int departmentId)
    {
        var scopeGroupExists =
            await _groupScopeService.ExistsAsync(
                scopeGroupId);

        if (!scopeGroupExists)
        {
            return NotFound(new
            {
                message = "Scope Group không tồn tại."
            });
        }

        var assigned =
            await _groupScopeService.AssignDepartmentAsync(
                scopeGroupId,
                departmentId);

        if (!assigned)
        {
            return BadRequest(new
            {
                message =
                    "Không thể gán Department. Department không tồn tại."
            });
        }

        return Ok(new
        {
            message =
                "Gán Department vào Group Scope thành công.",
            scopeGroupId,
            departmentId
        });
    }

    [HttpDelete("{scopeGroupId:int}/departments/{departmentId:int}")]
    [Authorize(Policy = "Permission:Scope.Assign")]
    public async Task<IActionResult> RemoveDepartment(
        int scopeGroupId,
        int departmentId)
    {
        var scopeGroupExists =
            await _groupScopeService.ExistsAsync(
                scopeGroupId);

        if (!scopeGroupExists)
        {
            return NotFound(new
            {
                message = "Scope Group không tồn tại."
            });
        }

        var removed =
            await _groupScopeService.RemoveDepartmentAsync(
                scopeGroupId,
                departmentId);

        if (!removed)
        {
            return NotFound(new
            {
                message =
                    "Department chưa được gán vào Group Scope."
            });
        }

        return Ok(new
        {
            message =
                "Xóa Department khỏi Group Scope thành công.",
            scopeGroupId,
            departmentId
        });
    }

    // =====================================================
    // EFFECTIVE USER
    // =====================================================

    [HttpGet("{scopeGroupId:int}/users/{userId:int}/effective")]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> HasEffectiveUserScope(
        int scopeGroupId,
        int userId)
    {
        var scopeGroupExists =
            await _groupScopeService.ExistsAsync(
                scopeGroupId);

        if (!scopeGroupExists)
        {
            return NotFound(new
            {
                message = "Scope Group không tồn tại."
            });
        }

        var hasEffectiveScope =
            await _groupScopeService.HasEffectiveScopeAsync(
                scopeGroupId,
                userId);

        return Ok(new
        {
            scopeGroupId,
            userId,
            hasEffectiveScope
        });
    }

    [HttpGet("{scopeGroupId:int}/effective-users")]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> GetEffectiveUsers(
        int scopeGroupId)
    {
        var scopeGroupExists =
            await _groupScopeService.ExistsAsync(
                scopeGroupId);

        if (!scopeGroupExists)
        {
            return NotFound(new
            {
                message = "Scope Group không tồn tại."
            });
        }

        var userIds =
            await _groupScopeService.GetEffectiveUserIdsAsync(
                scopeGroupId);

        return Ok(new
        {
            scopeGroupId,
            userIds
        });
    }
}

// =========================================================
// REQUEST MODELS
// =========================================================

public class CreateGroupScopeRequest
{
    public string Name { get; set; } = "";

    public string? Description { get; set; }
}

public class UpdateGroupScopeRequest
{
    public string Name { get; set; } = "";

    public string? Description { get; set; }
}