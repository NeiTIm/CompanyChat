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
    // GROUP SCOPE
    // =====================================================

    public async Task<List<ScopeGroup>> GetAllAsync()
    {
        return await _db.ScopeGroups
            .AsNoTracking()
            .Include(x => x.Members)
                .ThenInclude(x => x.User)
            .Include(x => x.Departments)
                .ThenInclude(x => x.Department)
            .OrderBy(x => x.Id)
            .ToListAsync();
    }

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

    public async Task<bool> ExistsAsync(
        int scopeGroupId)
    {
        return await _db.ScopeGroups
            .AnyAsync(x =>
                x.Id == scopeGroupId);
    }

    public async Task<ScopeGroup> CreateAsync(
        string name,
        string? description)
    {
        var scopeGroup = new ScopeGroup
        {
            Name = name.Trim(),
            Description = description?.Trim() ?? ""
        };

        _db.ScopeGroups.Add(scopeGroup);

        await _db.SaveChangesAsync();

        return scopeGroup;
    }

    public async Task<bool> UpdateAsync(
        int scopeGroupId,
        string name,
        string? description)
    {
        var scopeGroup =
            await _db.ScopeGroups
                .FirstOrDefaultAsync(x =>
                    x.Id == scopeGroupId);

        if (scopeGroup == null)
        {
            return false;
        }

        scopeGroup.Name = name.Trim();
        scopeGroup.Description =
            description?.Trim() ?? "";

        await _db.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAsync(
        int scopeGroupId)
    {
        var scopeGroup =
            await _db.ScopeGroups
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

    public async Task<List<int>> GetDirectUserIdsAsync(
        int scopeGroupId)
    {
        return await _db.ScopeGroupMembers
            .AsNoTracking()
            .Where(x =>
                x.ScopeGroupId == scopeGroupId)
            .Select(x => x.UserId)
            .OrderBy(x => x)
            .ToListAsync();
    }

    public async Task<bool> HasUserScopeAsync(
        int scopeGroupId,
        int userId)
    {
        return await _db.ScopeGroupMembers
            .AnyAsync(x =>
                x.ScopeGroupId == scopeGroupId &&
                x.UserId == userId);
    }

    public async Task<bool> AssignUserAsync(
        int scopeGroupId,
        int userId)
    {
        var scopeGroupExists =
            await _db.ScopeGroups
                .AnyAsync(x =>
                    x.Id == scopeGroupId);

        if (!scopeGroupExists)
        {
            return false;
        }

        var userExists =
            await _db.Users
                .AnyAsync(x =>
                    x.Id == userId &&
                    !x.IsDeleted &&
                    x.IsActive);

        if (!userExists)
        {
            return false;
        }

        var exists =
            await _db.ScopeGroupMembers
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

    public async Task<bool> RemoveUserAsync(
        int scopeGroupId,
        int userId)
    {
        var member =
            await _db.ScopeGroupMembers
                .FirstOrDefaultAsync(x =>
                    x.ScopeGroupId == scopeGroupId &&
                    x.UserId == userId);

        if (member == null)
        {
            return false;
        }

        _db.ScopeGroupMembers.Remove(member);

        await _db.SaveChangesAsync();

        return true;
    }

    // =====================================================
    // DIRECT USERS - DETAIL
    // =====================================================

    public async Task<List<ScopeGroupUserDto>> GetDirectUsersAsync(
        int scopeGroupId)
    {
        return await _db.ScopeGroupMembers
            .AsNoTracking()
            .Where(x =>
                x.ScopeGroupId == scopeGroupId)
            .Select(x => new ScopeGroupUserDto
            {
                Id = x.UserId,
                FullName = x.User.FullName,
                Email = x.User.Email
            })
            .OrderBy(x => x.FullName)
            .ToListAsync();
    }

    // =====================================================
    // DEPARTMENT SCOPE
    // =====================================================

    public async Task<List<int>> GetDepartmentIdsAsync(
        int scopeGroupId)
    {
        return await _db.ScopeGroupDepartments
            .AsNoTracking()
            .Where(x =>
                x.ScopeGroupId == scopeGroupId)
            .Select(x => x.DepartmentId)
            .OrderBy(x => x)
            .ToListAsync();
    }

    public async Task<bool> HasDepartmentScopeAsync(
        int scopeGroupId,
        int departmentId)
    {
        return await _db.ScopeGroupDepartments
            .AnyAsync(x =>
                x.ScopeGroupId == scopeGroupId &&
                x.DepartmentId == departmentId);
    }

    public async Task<bool> AssignDepartmentAsync(
        int scopeGroupId,
        int departmentId)
    {
        var scopeGroupExists =
            await _db.ScopeGroups
                .AnyAsync(x =>
                    x.Id == scopeGroupId);

        if (!scopeGroupExists)
        {
            return false;
        }

        var departmentExists =
            await _db.Departments
                .AnyAsync(x =>
                    x.Id == departmentId);

        if (!departmentExists)
        {
            return false;
        }

        var exists =
            await _db.ScopeGroupDepartments
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

    public async Task<bool> RemoveDepartmentAsync(
        int scopeGroupId,
        int departmentId)
    {
        var scope =
            await _db.ScopeGroupDepartments
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
    // DEPARTMENTS - DETAIL
    // =====================================================

    public async Task<List<ScopeGroupDepartmentDto>> GetDepartmentsAsync(
        int scopeGroupId)
    {
        return await _db.ScopeGroupDepartments
            .AsNoTracking()
            .Where(x =>
                x.ScopeGroupId == scopeGroupId)
            .Select(x => new ScopeGroupDepartmentDto
            {
                Id = x.DepartmentId,
                Name = x.Department.Name
            })
            .OrderBy(x => x.Name)
            .ToListAsync();
    }

    // =====================================================
    // EFFECTIVE SCOPE
    // =====================================================

    public async Task<bool> HasEffectiveScopeAsync(
        int scopeGroupId,
        int userId)
    {
        var user =
            await _db.Users
                .FirstOrDefaultAsync(x =>
                    x.Id == userId &&
                    !x.IsDeleted &&
                    x.IsActive);

        if (user == null)
        {
            return false;
        }

        // -------------------------------------------------
        // ADMIN BYPASS
        // -------------------------------------------------

        if (user.Role == "Admin")
        {
            return await ExistsAsync(scopeGroupId);
        }

        // -------------------------------------------------
        // DIRECT USER SCOPE
        // -------------------------------------------------

        var hasDirectScope =
            await _db.ScopeGroupMembers
                .AnyAsync(x =>
                    x.ScopeGroupId == scopeGroupId &&
                    x.UserId == userId);

        if (hasDirectScope)
        {
            return true;
        }

        // -------------------------------------------------
        // USER DEPARTMENTS
        // -------------------------------------------------

        var userDepartmentIds =
            await _db.UserDepartments
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

        userDepartmentIds =
            userDepartmentIds
                .Distinct()
                .ToList();

        if (userDepartmentIds.Count == 0)
        {
            return false;
        }

        // -------------------------------------------------
        // INHERITED DEPARTMENT SCOPE
        // -------------------------------------------------

        return await _db.ScopeGroupDepartments
            .AnyAsync(x =>
                x.ScopeGroupId == scopeGroupId &&
                userDepartmentIds.Contains(
                    x.DepartmentId));
    }

    // =====================================================
    // EFFECTIVE USERS
    // =====================================================

    public async Task<List<int>> GetEffectiveUserIdsAsync(
        int scopeGroupId)
    {
        var scopeGroupExists =
            await _db.ScopeGroups
                .AnyAsync(x =>
                    x.Id == scopeGroupId);

        if (!scopeGroupExists)
        {
            return [];
        }

        // -------------------------------------------------
        // DIRECT USERS
        // -------------------------------------------------

        var directUserIds =
            await _db.ScopeGroupMembers
                .AsNoTracking()
                .Where(x =>
                    x.ScopeGroupId == scopeGroupId)
                .Select(x =>
                    x.UserId)
                .ToListAsync();

        // -------------------------------------------------
        // SCOPED DEPARTMENTS
        // -------------------------------------------------

        var departmentIds =
            await _db.ScopeGroupDepartments
                .AsNoTracking()
                .Where(x =>
                    x.ScopeGroupId == scopeGroupId)
                .Select(x =>
                    x.DepartmentId)
                .ToListAsync();

        if (departmentIds.Count == 0)
        {
            return directUserIds
                .Distinct()
                .OrderBy(x => x)
                .ToList();
        }

        // -------------------------------------------------
        // USERS IN SCOPED DEPARTMENTS
        // -------------------------------------------------

        var departmentUserIds =
            await _db.Users
                .AsNoTracking()
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
            .OrderBy(x => x)
            .ToList();
    }
}

// =========================================================
// DTOs
// =========================================================

public class ScopeGroupUserDto
{
    public int Id { get; set; }

    public string? FullName { get; set; }

    public string? Email { get; set; }
}

public class ScopeGroupDepartmentDto
{
    public int Id { get; set; }

    public string? Name { get; set; }
}