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
    // GET ALL SCOPE GROUPS
    // =====================================================

    /// <summary>
    /// Lấy danh sách tất cả Scope Group.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> GetAll()
    {
        var scopeGroups =
            await _groupScopeService.GetAllAsync();

        return Ok(scopeGroups);
    }

    // =====================================================
    // GET SCOPE GROUP BY ID
    // =====================================================

    /// <summary>
    /// Lấy chi tiết một Scope Group.
    /// </summary>
    [HttpGet("{scopeGroupId:int}")]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> GetById(
        int scopeGroupId)
    {
        var scopeGroup =
            await _groupScopeService.GetByIdAsync(
                scopeGroupId);

        if (scopeGroup == null)
        {
            return NotFound(new
            {
                message = "Scope Group không tồn tại."
            });
        }

        return Ok(scopeGroup);
    }

    // =====================================================
    // CREATE SCOPE GROUP
    // =====================================================

    /// <summary>
    /// Tạo Scope Group mới.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "Permission:Scope.Assign")]
    public async Task<IActionResult> Create(
        [FromBody] CreateScopeGroupRequest request)
    {
        if (request == null)
        {
            return BadRequest(new
            {
                message = "Dữ liệu không hợp lệ."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new
            {
                message = "Tên Scope Group không được để trống."
            });
        }

        var scopeGroup =
            await _groupScopeService.CreateAsync(
                request.Name,
                request.Description);

        if (scopeGroup == null)
        {
            return Conflict(new
            {
                message =
                    "Không thể tạo Scope Group. Tên có thể đã tồn tại."
            });
        }

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                scopeGroupId = scopeGroup.Id
            },
            scopeGroup);
    }

    // =====================================================
    // UPDATE SCOPE GROUP
    // =====================================================

    /// <summary>
    /// Cập nhật thông tin Scope Group.
    /// </summary>
    [HttpPut("{scopeGroupId:int}")]
    [Authorize(Policy = "Permission:Scope.Assign")]
    public async Task<IActionResult> Update(
        int scopeGroupId,
        [FromBody] UpdateScopeGroupRequest request)
    {
        if (request == null)
        {
            return BadRequest(new
            {
                message = "Dữ liệu không hợp lệ."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new
            {
                message = "Tên Scope Group không được để trống."
            });
        }

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

        var success =
            await _groupScopeService.UpdateAsync(
                scopeGroupId,
                request.Name,
                request.Description);

        if (!success)
        {
            return Conflict(new
            {
                message =
                    "Không thể cập nhật Scope Group. Tên có thể đã tồn tại."
            });
        }

        var updated =
            await _groupScopeService.GetByIdAsync(
                scopeGroupId);

        return Ok(updated);
    }

    // =====================================================
    // DELETE SCOPE GROUP
    // =====================================================

    /// <summary>
    /// Xóa Scope Group.
    /// </summary>
    [HttpDelete("{scopeGroupId:int}")]
    [Authorize(Policy = "Permission:Scope.Assign")]
    public async Task<IActionResult> Delete(
        int scopeGroupId)
    {
        var success =
            await _groupScopeService.DeleteAsync(
                scopeGroupId);

        if (!success)
        {
            return NotFound(new
            {
                message = "Scope Group không tồn tại."
            });
        }

        return Ok(new
        {
            message = "Xóa Scope Group thành công."
        });
    }

    // =====================================================
    // DIRECT USER SCOPE
    // =====================================================

    /// <summary>
    /// Kiểm tra User đã có Direct Scope hay chưa.
    /// </summary>
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

    /// <summary>
    /// Cấp Direct Scope cho User.
    /// </summary>
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

        var success =
            await _groupScopeService.AssignUserAsync(
                scopeGroupId,
                userId);

        if (!success)
        {
            return BadRequest(new
            {
                message =
                    "Không thể cấp Scope cho User. " +
                    "User không tồn tại, không active hoặc dữ liệu không hợp lệ."
            });
        }

        return Ok(new
        {
            message = "Cấp Direct Scope cho User thành công.",
            scopeGroupId,
            userId
        });
    }

    /// <summary>
    /// Xóa Direct Scope của User.
    /// </summary>
    [HttpDelete("{scopeGroupId:int}/users/{userId:int}")]
    [Authorize(Policy = "Permission:Scope.Assign")]
    public async Task<IActionResult> RemoveUser(
        int scopeGroupId,
        int userId)
    {
        var success =
            await _groupScopeService.RemoveUserAsync(
                scopeGroupId,
                userId);

        if (!success)
        {
            return NotFound(new
            {
                message =
                    "Direct Scope của User không tồn tại."
            });
        }

        return Ok(new
        {
            message = "Xóa Direct Scope của User thành công.",
            scopeGroupId,
            userId
        });
    }

    // =====================================================
    // DEPARTMENT SCOPE
    // =====================================================

    /// <summary>
    /// Kiểm tra Department đã có Scope hay chưa.
    /// </summary>
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

    /// <summary>
    /// Cấp Scope cho Department.
    /// </summary>
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

        var success =
            await _groupScopeService.AssignDepartmentAsync(
                scopeGroupId,
                departmentId);

        if (!success)
        {
            return BadRequest(new
            {
                message =
                    "Không thể cấp Scope cho Department. " +
                    "Department không tồn tại hoặc dữ liệu không hợp lệ."
            });
        }

        return Ok(new
        {
            message =
                "Cấp Department Scope thành công.",
            scopeGroupId,
            departmentId
        });
    }

    /// <summary>
    /// Xóa Scope của Department.
    /// </summary>
    [HttpDelete("{scopeGroupId:int}/departments/{departmentId:int}")]
    [Authorize(Policy = "Permission:Scope.Assign")]
    public async Task<IActionResult> RemoveDepartment(
        int scopeGroupId,
        int departmentId)
    {
        var success =
            await _groupScopeService.RemoveDepartmentAsync(
                scopeGroupId,
                departmentId);

        if (!success)
        {
            return NotFound(new
            {
                message =
                    "Department Scope không tồn tại."
            });
        }

        return Ok(new
        {
            message =
                "Xóa Department Scope thành công.",
            scopeGroupId,
            departmentId
        });
    }

    // =====================================================
    // EFFECTIVE SCOPE
    // =====================================================

    /// <summary>
    /// Kiểm tra User có Effective Scope trong ScopeGroup hay không.
    /// </summary>
    [HttpGet(
        "{scopeGroupId:int}/users/{userId:int}/effective")]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> HasEffectiveScope(
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
            await _groupScopeService.HasEffectiveScopeAsync(
                userId,
                scopeGroupId);

        return Ok(new
        {
            scopeGroupId,
            userId,
            hasEffectiveScope = hasScope
        });
    }

    // =====================================================
    // EFFECTIVE USERS
    // =====================================================

    /// <summary>
    /// Lấy tất cả User có Effective Scope
    /// trong ScopeGroup.
    /// </summary>
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

    // =====================================================
    // DIRECT USERS
    // =====================================================

    /// <summary>
    /// Lấy danh sách User được cấp Direct Scope.
    /// </summary>
    [HttpGet("{scopeGroupId:int}/users")]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> GetDirectUsers(
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
            await _groupScopeService.GetDirectUserIdsAsync(
                scopeGroupId);

        return Ok(new
        {
            scopeGroupId,
            userIds
        });
    }

    // =====================================================
    // SCOPED DEPARTMENTS
    // =====================================================

    /// <summary>
    /// Lấy danh sách Department được cấp Scope.
    /// </summary>
    [HttpGet("{scopeGroupId:int}/departments")]
    [Authorize(Policy = "Permission:Scope.View")]
    public async Task<IActionResult> GetDepartments(
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

        var departmentIds =
            await _groupScopeService.GetDepartmentIdsAsync(
                scopeGroupId);

        return Ok(new
        {
            scopeGroupId,
            departmentIds
        });
    }
}

// =========================================================
// REQUEST MODELS
// =========================================================

public record CreateScopeGroupRequest(
    string Name,
    string? Description);

public record UpdateScopeGroupRequest(
    string Name,
    string? Description);