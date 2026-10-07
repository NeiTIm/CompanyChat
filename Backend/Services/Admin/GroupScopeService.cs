using CompanyChat.Api.Data;
using CompanyChat.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Services.Admin;

public class GroupScopeService
{
    private readonly AppDbContext _db;

    public GroupScopeService(AppDbContext db)
    {
        _db = db;
    }

    // =====================================================
    // SCOPE GROUP
    // =====================================================

    /// <summary>
    /// Lấy tất cả Scope Group.
    /// </summary>
    public async Task<List<ScopeGroup>> GetAllAsync()
    {
        return await _db.ScopeGroups
            .AsNoTracking()
            .Include(x => x.Members)
                .ThenInclude(x => x.User)
            .Include(x => x.Departments)
                .ThenInclude(x => x.Department)
            .OrderBy(x => x.Name)
            .ToListAsync();
    }

    /// <summary>
    /// Lấy ScopeGroup theo Id.
    /// </summary>
    public async Task<ScopeGroup?> GetByIdAsync(
        int scopeGroupId)
    {
        return await _db.ScopeGroups
            .AsNoTracking()
            .Include(x => x.Members)
                .ThenInclude(x => x.User)
            .Include(x => x.Departments)
                .ThenInclude(x => x.Department)
            .FirstOrDefaultAsync(x =>
                x.Id == scopeGroupId);
    }

    /// <summary>
    /// Kiểm tra ScopeGroup có tồn tại hay không.
    /// </summary>
    public async Task<bool> ExistsAsync(
        int scopeGroupId)
    {
        return await _db.ScopeGroups
            .AnyAsync(x =>
                x.Id == scopeGroupId);
    }

    /// <summary>
    /// Tạo ScopeGroup mới.
    /// </summary>
    public async Task<ScopeGroup?> CreateAsync(
        string name,
        string? description)
    {
        name = name.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            return null;
        }

        var exists = await _db.ScopeGroups
            .AnyAsync(x =>
                x.Name == name);

        if (exists)
        {
            return null;
        }

        var scopeGroup = new ScopeGroup
        {
            Name = name,
            Description = description?.Trim() ?? ""
        };

        _db.ScopeGroups.Add(scopeGroup);

        await _db.SaveChangesAsync();

        return scopeGroup;
    }

    /// <summary>
    /// Cập nhật thông tin ScopeGroup.
    /// </summary>
    public async Task<bool> UpdateAsync(
        int scopeGroupId,
        string name,
        string? description)
    {
        name = name.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            return false;
        }

        var scopeGroup = await _db.ScopeGroups
            .FirstOrDefaultAsync(x =>
                x.Id == scopeGroupId);

        if (scopeGroup == null)
        {
            return false;
        }

        var duplicateName = await _db.ScopeGroups
            .AnyAsync(x =>
                x.Id != scopeGroupId &&
                x.Name == name);

        if (duplicateName)
        {
            return false;
        }

        scopeGroup.Name = name;
        scopeGroup.Description = description?.Trim() ?? "";

        await _db.SaveChangesAsync();

        return true;
    }

    /// <summary>
    /// Xóa ScopeGroup.
    /// Các ScopeGroupMember và ScopeGroupDepartment
    /// sẽ được xóa theo Cascade.
    /// </summary>
    public async Task<bool> DeleteAsync(
        int scopeGroupId)
    {
        var scopeGroup = await _db.ScopeGroups
            .FirstOrDefaultAsync(x =>
                x.Id == scopeGroupId);

        if (scopeGroup == null)
        {
            return false;
        }

        _db.ScopeGroups.Remove(scopeGroup);

        await _db.SaveChangesAsync();

        return true;
    }

    // =====================================================
    // DIRECT USER SCOPE
    // =====================================================

    /// <summary>
    /// Kiểm tra User đã được cấp Direct Scope
    /// trong ScopeGroup hay chưa.
    /// </summary>
    public async Task<bool> HasUserScopeAsync(
        int scopeGroupId,
        int userId)
    {
        return await _db.ScopeGroupMembers
            .AnyAsync(x =>
                x.ScopeGroupId == scopeGroupId &&
                x.UserId == userId);
    }

    /// <summary>
    /// Cấp Direct Scope cho User.
    /// </summary>
    public async Task<bool> AssignUserAsync(
        int scopeGroupId,
        int userId)
    {
        var scopeGroupExists = await _db.ScopeGroups
            .AnyAsync(x =>
                x.Id == scopeGroupId);

        if (!scopeGroupExists)
        {
            return false;
        }

        var userExists = await _db.Users
            .AnyAsync(x =>
                x.Id == userId &&
                !x.IsDeleted &&
                x.IsActive);

        if (!userExists)
        {
            return false;
        }

        var exists = await _db.ScopeGroupMembers
            .AnyAsync(x =>
                x.ScopeGroupId == scopeGroupId &&
                x.UserId == userId);

        if (exists)
        {
            return true;
        }

        _db.ScopeGroupMembers.Add(
            new ScopeGroupMember
            {
                ScopeGroupId = scopeGroupId,
                UserId = userId
            });

        await _db.SaveChangesAsync();

        return true;
    }

    /// <summary>
    /// Xóa Direct Scope của User.
    /// </summary>
    public async Task<bool> RemoveUserAsync(
        int scopeGroupId,
        int userId)
    {
        var scope = await _db.ScopeGroupMembers
            .FirstOrDefaultAsync(x =>
                x.ScopeGroupId == scopeGroupId &&
                x.UserId == userId);

        if (scope == null)
        {
            return false;
        }

        _db.ScopeGroupMembers.Remove(scope);

        await _db.SaveChangesAsync();

        return true;
    }

    // =====================================================
    // DEPARTMENT SCOPE
    // =====================================================

    /// <summary>
    /// Kiểm tra Department đã được cấp Scope
    /// trong ScopeGroup hay chưa.
    /// </summary>
    public async Task<bool> HasDepartmentScopeAsync(
        int scopeGroupId,
        int departmentId)
    {
        return await _db.ScopeGroupDepartments
            .AnyAsync(x =>
                x.ScopeGroupId == scopeGroupId &&
                x.DepartmentId == departmentId);
    }

    /// <summary>
    /// Cấp Scope cho Department.
    /// </summary>
    public async Task<bool> AssignDepartmentAsync(
        int scopeGroupId,
        int departmentId)
    {
        var scopeGroupExists = await _db.ScopeGroups
            .AnyAsync(x =>
                x.Id == scopeGroupId);

        if (!scopeGroupExists)
        {
            return false;
        }

        var departmentExists = await _db.Departments
            .AnyAsync(x =>
                x.Id == departmentId);

        if (!departmentExists)
        {
            return false;
        }

        var exists = await _db.ScopeGroupDepartments
            .AnyAsync(x =>
                x.ScopeGroupId == scopeGroupId &&
                x.DepartmentId == departmentId);

        if (exists)
        {
            return true;
        }

        _db.ScopeGroupDepartments.Add(
            new ScopeGroupDepartment
            {
                ScopeGroupId = scopeGroupId,
                DepartmentId = departmentId
            });

        await _db.SaveChangesAsync();

        return true;
    }

    /// <summary>
    /// Xóa Scope của Department.
    /// </summary>
    public async Task<bool> RemoveDepartmentAsync(
        int scopeGroupId,
        int departmentId)
    {
        var scope = await _db.ScopeGroupDepartments
            .FirstOrDefaultAsync(x =>
                x.ScopeGroupId == scopeGroupId &&
                x.DepartmentId == departmentId);

        if (scope == null)
        {
            return false;
        }

        _db.ScopeGroupDepartments.Remove(scope);

        await _db.SaveChangesAsync();

        return true;
    }

    // =====================================================
    // EFFECTIVE GROUP SCOPE
    // =====================================================

    /// <summary>
    /// Kiểm tra User có Effective Scope
    /// trong ScopeGroup hay không.
    ///
    /// Effective Scope gồm:
    /// 1. Direct User Scope
    /// 2. Inherited Department Scope
    ///
    /// Admin được bypass toàn bộ Scope.
    /// </summary>
    public async Task<bool> HasEffectiveScopeAsync(
        int userId,
        int scopeGroupId)
    {
        // -------------------------------------------------
        // USER
        // -------------------------------------------------

        var user = await _db.Users
            .FirstOrDefaultAsync(x =>
                x.Id == userId &&
                !x.IsDeleted &&
                x.IsActive);

        if (user == null)
        {
            return false;
        }

        // -------------------------------------------------
        // ADMIN
        // -------------------------------------------------

        if (user.Role == "Admin")
        {
            return await ExistsAsync(scopeGroupId);
        }

        // -------------------------------------------------
        // SCOPE GROUP
        // -------------------------------------------------

        var scopeGroupExists = await _db.ScopeGroups
            .AnyAsync(x =>
                x.Id == scopeGroupId);

        if (!scopeGroupExists)
        {
            return false;
        }

        // -------------------------------------------------
        // 1. DIRECT USER SCOPE
        // -------------------------------------------------

        var hasDirectScope = await _db.ScopeGroupMembers
            .AnyAsync(x =>
                x.ScopeGroupId == scopeGroupId &&
                x.UserId == userId);

        if (hasDirectScope)
        {
            return true;
        }

        // -------------------------------------------------
        // 2. INHERITED DEPARTMENT SCOPE
        // -------------------------------------------------

        var userDepartmentIds = await _db.UserDepartments
            .Where(x =>
                x.UserId == userId)
            .Select(x =>
                x.DepartmentId)
            .ToListAsync();

        // Primary Department
        if (user.DepartmentId.HasValue)
        {
            userDepartmentIds.Add(
                user.DepartmentId.Value);
        }

        userDepartmentIds = userDepartmentIds
            .Distinct()
            .ToList();

        if (userDepartmentIds.Count == 0)
        {
            return false;
        }

        return await _db.ScopeGroupDepartments
            .AnyAsync(x =>
                x.ScopeGroupId == scopeGroupId &&
                userDepartmentIds.Contains(x.DepartmentId));
    }

    // =====================================================
    // EFFECTIVE SCOPE USERS
    // =====================================================

    /// <summary>
    /// Lấy danh sách User có Effective Scope
    /// trong ScopeGroup.
    ///
    /// Bao gồm:
    /// - User được cấp trực tiếp.
    /// - User thuộc Department được cấp Scope.
    /// </summary>
    public async Task<List<int>> GetEffectiveUserIdsAsync(
        int scopeGroupId)
    {
        var scopeGroupExists = await _db.ScopeGroups
            .AnyAsync(x =>
                x.Id == scopeGroupId);

        if (!scopeGroupExists)
        {
            return [];
        }

        // -------------------------------------------------
        // DIRECT USERS
        // -------------------------------------------------

        var directUserIds = await _db.ScopeGroupMembers
            .Where(x =>
                x.ScopeGroupId == scopeGroupId)
            .Select(x =>
                x.UserId)
            .ToListAsync();

        // -------------------------------------------------
        // SCOPED DEPARTMENTS
        // -------------------------------------------------

        var departmentIds = await _db.ScopeGroupDepartments
            .Where(x =>
                x.ScopeGroupId == scopeGroupId)
            .Select(x =>
                x.DepartmentId)
            .ToListAsync();

        // Không có Department Scope.
        if (departmentIds.Count == 0)
        {
            return directUserIds
                .Distinct()
                .ToList();
        }

        // -------------------------------------------------
        // USERS IN SCOPED DEPARTMENTS
        // -------------------------------------------------

        var departmentUserIds = await _db.Users
            .Where(x =>
                !x.IsDeleted &&
                x.IsActive &&
                (
                    (
                        x.DepartmentId.HasValue &&
                        departmentIds.Contains(
                            x.DepartmentId.Value)
                    )
                    ||
                    x.UserDepartments.Any(ud =>
                        departmentIds.Contains(
                            ud.DepartmentId))
                ))
            .Select(x =>
                x.Id)
            .ToListAsync();

        return directUserIds
            .Concat(departmentUserIds)
            .Distinct()
            .ToList();
    }

    // =====================================================
    // GET DIRECT USERS
    // =====================================================

    /// <summary>
    /// Lấy danh sách User được cấp Direct Scope.
    /// </summary>
    public async Task<List<int>> GetDirectUserIdsAsync(
        int scopeGroupId)
    {
        return await _db.ScopeGroupMembers
            .Where(x =>
                x.ScopeGroupId == scopeGroupId)
            .Select(x =>
                x.UserId)
            .ToListAsync();
    }

    // =====================================================
    // GET SCOPED DEPARTMENTS
    // =====================================================

    /// <summary>
    /// Lấy danh sách Department được cấp Scope.
    /// </summary>
    public async Task<List<int>> GetDepartmentIdsAsync(
        int scopeGroupId)
    {
        return await _db.ScopeGroupDepartments
            .Where(x =>
                x.ScopeGroupId == scopeGroupId)
            .Select(x =>
                x.DepartmentId)
            .ToListAsync();
    }
}