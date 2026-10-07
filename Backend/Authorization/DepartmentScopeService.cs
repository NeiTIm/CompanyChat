using System.Security.Claims;

using CompanyChat.Api.Data;
using CompanyChat.Api.Models;

using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Services.Authorization;

public class DepartmentScopeService
{
    private readonly AppDbContext db;

    public DepartmentScopeService(AppDbContext db)
    {
        this.db = db;
    }

    // =========================================================
    // CURRENT USER ID
    // =========================================================

    public int? GetUserId(ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (int.TryParse(value, out var userId))
        {
            return userId;
        }

        return null;
    }


    // =========================================================
    // CURRENT USER
    // =========================================================

    private async Task<User?> GetCurrentUserAsync(
        ClaimsPrincipal user)
    {
        var userId = GetUserId(user);

        if (!userId.HasValue)
        {
            return null;
        }

        return await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.Id == userId.Value);
    }


    // =========================================================
    // CHECK AUTHENTICATED + ACTIVE USER
    // =========================================================

    private async Task<User?> GetValidCurrentUserAsync(
        ClaimsPrincipal user)
    {
        if (user.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        var currentUser =
            await GetCurrentUserAsync(user);

        if (currentUser == null)
        {
            return null;
        }

        if (!currentUser.IsActive ||
            currentUser.IsDeleted)
        {
            return null;
        }

        return currentUser;
    }


    // =========================================================
    // ADMIN
    //
    // Admin là GLOBAL scope.
    //
    // Admin không cần tồn tại trong
    // UserManagedDepartments hoặc ScopeGroup.
    // =========================================================

    public async Task<bool> IsAdminAsync(
        ClaimsPrincipal user)
    {
        var currentUser =
            await GetValidCurrentUserAsync(user);

        return currentUser?.Role == "Admin";
    }


    // =========================================================
    // EFFECTIVE MANAGED DEPARTMENT IDS QUERY
    //
    // Effective Scope =
    //
    // Direct Scope
    // +
    // Group Scope
    //
    // Direct Scope:
    //
    // User
    //   ↓
    // UserManagedDepartments
    //   ↓
    // Department
    //
    // Group Scope:
    //
    // User
    //   ↓
    // ScopeGroupMember
    //   ↓
    // ScopeGroup
    //   ↓
    // ScopeGroupDepartment
    //   ↓
    // Department
    //
    // QUAN TRỌNG:
    //
    // Chỉ ScopeGroupMember trực tiếp mới được
    // hưởng Department Scope của ScopeGroup.
    //
    // Không dùng HasEffectiveScopeAsync()
    // ở GroupScopeService tại đây.
    //
    // Lý do:
    //
    // HasEffectiveScopeAsync() còn có logic:
    //
    // User thuộc Department
    //   ↓
    // Department nằm trong ScopeGroup
    //   ↓
    // User được xem là effective member
    //
    // Logic đó phù hợp cho việc tính
    // "effective users" của Group Scope,
    // nhưng KHÔNG nên dùng để cấp quyền
    // quản lý Department.
    //
    // Nếu dùng sẽ có nguy cơ:
    //
    // User chỉ thuộc IT
    //   ↓
    // Group có IT
    //   ↓
    // User tự động có quyền quản lý IT
    //
    // Đây không phải explicit management scope.
    // =========================================================

    private IQueryable<int>
        GetEffectiveManagedDepartmentIdsQuery(
            int userId)
    {
        // -----------------------------------------------------
        // DIRECT SCOPE
        // -----------------------------------------------------

        var directDepartmentIds =
            db.UserManagedDepartments
                .AsNoTracking()
                .Where(x =>
                    x.UserId == userId)
                .Select(x =>
                    x.DepartmentId);


        // -----------------------------------------------------
        // GROUP SCOPE
        //
        // User phải là thành viên trực tiếp
        // của ScopeGroup.
        //
        // Sau đó lấy toàn bộ Department
        // được assign cho ScopeGroup đó.
        // -----------------------------------------------------

        var groupDepartmentIds =
            db.ScopeGroupMembers
                .AsNoTracking()
                .Where(x =>
                    x.UserId == userId)
                .Join(
                    db.ScopeGroupDepartments
                        .AsNoTracking(),
                    member =>
                        member.ScopeGroupId,
                    departmentScope =>
                        departmentScope.ScopeGroupId,
                    (member, departmentScope) =>
                        departmentScope.DepartmentId);


        // -----------------------------------------------------
        // EFFECTIVE SCOPE
        //
        // Direct Scope
        // +
        // Group Scope
        //
        // Union tự loại bỏ Department bị trùng.
        // -----------------------------------------------------

        return directDepartmentIds
            .Union(groupDepartmentIds);
    }


    // =========================================================
    // GET MANAGED DEPARTMENT IDS
    //
    // Scope được xác định bởi:
    //
    // Direct Scope
    // +
    // Group Scope
    //
    // Chỉ trả Department đang ACTIVE.
    //
    // Lưu ý:
    //
    // CanManageDepartmentAsync KHÔNG phụ thuộc
    // vào IsActive để Manager vẫn có thể
    // re-enable Department nếu có permission phù hợp.
    // =========================================================

    public async Task<List<int>>
        GetManagedDepartmentIdsAsync(
            ClaimsPrincipal user)
    {
        var currentUser =
            await GetValidCurrentUserAsync(user);

        if (currentUser == null)
        {
            return [];
        }

        var effectiveDepartmentIds =
            GetEffectiveManagedDepartmentIdsQuery(
                currentUser.Id);

        return await effectiveDepartmentIds
            .Join(
                db.Departments
                    .AsNoTracking()
                    .Where(x =>
                        x.IsActive),
                departmentId =>
                    departmentId,
                department =>
                    department.Id,
                (departmentId, department) =>
                    departmentId)
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync();
    }


    // =========================================================
    // CHECK MANAGE DEPARTMENT
    //
    // Permission = WHAT
    // Scope      = WHERE
    //
    // Method này chỉ kiểm tra:
    //
    // "User có quyền Scope tới Department này không?"
    //
    // Không kiểm tra Permission.
    //
    // Permission phải được kiểm tra ở:
    //
    // [Authorize(Policy = "Permission:...")]
    //
    // hoặc PermissionService.
    //
    // Effective Scope gồm:
    //
    // Direct Scope
    // +
    // Group Scope
    // =========================================================

    public async Task<bool> CanManageDepartmentAsync(
        ClaimsPrincipal user,
        int departmentId)
    {
        var currentUser =
            await GetValidCurrentUserAsync(user);

        if (currentUser == null)
        {
            return false;
        }

        // -----------------------------------------------------
        // Validate Department
        //
        // Department phải tồn tại.
        //
        // Không yêu cầu IsActive ở đây.
        //
        // Lý do:
        //
        // Manager có thể cần quyền quản lý Department
        // đang disabled để thực hiện:
        //
        // disabled → enabled
        // -----------------------------------------------------

        var departmentExists =
            await db.Departments
                .AsNoTracking()
                .AnyAsync(x =>
                    x.Id == departmentId);

        if (!departmentExists)
        {
            return false;
        }


        // -----------------------------------------------------
        // ADMIN
        //
        // Admin có GLOBAL scope.
        // -----------------------------------------------------

        if (currentUser.Role == "Admin")
        {
            return true;
        }


        // -----------------------------------------------------
        // EFFECTIVE SCOPE
        //
        // Bao gồm:
        //
        // 1. Direct Scope
        // 2. Group Scope
        //
        // Group Scope:
        //
        // User phải là ScopeGroupMember
        // trực tiếp.
        // -----------------------------------------------------

        return await GetEffectiveManagedDepartmentIdsQuery(
                currentUser.Id)
            .AnyAsync(x =>
                x == departmentId);
    }


    // =========================================================
    // CHECK MULTIPLE DEPARTMENTS
    //
    // Dùng khi một thao tác ảnh hưởng tới nhiều Department.
    //
    // Ví dụ:
    //
    // Employee:
    //     Primary = A
    //     Additional = B
    //
    // Manager muốn Delete employee.
    //
    // → phải có Scope A + B.
    //
    // Effective Scope:
    //
    // Direct Scope
    // +
    // Group Scope
    // =========================================================

    public async Task<bool>
        CanManageAllDepartmentsAsync(
            ClaimsPrincipal user,
            IEnumerable<int> departmentIds)
    {
        var ids = departmentIds
            .Where(x => x > 0)
            .Distinct()
            .ToList();

        // Không có Department để kiểm tra.
        //
        // Trường hợp này được xem là không bị
        // giới hạn bởi Department Scope.
        if (ids.Count == 0)
        {
            return true;
        }

        var currentUser =
            await GetValidCurrentUserAsync(user);

        if (currentUser == null)
        {
            return false;
        }


        // -----------------------------------------------------
        // ADMIN
        // -----------------------------------------------------

        if (currentUser.Role == "Admin")
        {
            // Vẫn kiểm tra các Department có tồn tại.
            var existingCount =
                await db.Departments
                    .AsNoTracking()
                    .CountAsync(x =>
                        ids.Contains(x.Id));

            return existingCount == ids.Count;
        }


        // -----------------------------------------------------
        // NON-ADMIN
        //
        // Trước đây chỉ kiểm tra:
        //
        // UserManagedDepartments
        //
        // Bây giờ kiểm tra:
        //
        // Direct Scope
        // +
        // Group Scope
        //
        // Một query duy nhất.
        // -----------------------------------------------------

        var managedCount =
            await GetEffectiveManagedDepartmentIdsQuery(
                    currentUser.Id)
                .Where(x =>
                    ids.Contains(x))
                .Distinct()
                .CountAsync();

        return managedCount == ids.Count;
    }


    // =========================================================
    // CHECK ANY DEPARTMENT
    //
    // Dùng cho các trường hợp:
    //
    // Employee có:
    //     Primary = A
    //     Additional = B
    //
    // User có Scope:
    //     A
    //
    // Nếu nghiệp vụ chỉ yêu cầu employee phải nằm
    // trong ít nhất một Department mà user quản lý,
    // dùng method này.
    //
    // Effective Scope:
    //
    // Direct Scope
    // +
    // Group Scope
    // =========================================================

    public async Task<bool>
        CanManageAnyDepartmentAsync(
            ClaimsPrincipal user,
            IEnumerable<int> departmentIds)
    {
        var ids = departmentIds
            .Where(x => x > 0)
            .Distinct()
            .ToList();

        if (ids.Count == 0)
        {
            return true;
        }

        var currentUser =
            await GetValidCurrentUserAsync(user);

        if (currentUser == null)
        {
            return false;
        }


        // -----------------------------------------------------
        // ADMIN
        // -----------------------------------------------------

        if (currentUser.Role == "Admin")
        {
            return await db.Departments
                .AsNoTracking()
                .AnyAsync(x =>
                    ids.Contains(x.Id));
        }


        // -----------------------------------------------------
        // NON-ADMIN
        //
        // Direct Scope
        // +
        // Group Scope
        // -----------------------------------------------------

        return await GetEffectiveManagedDepartmentIdsQuery(
                currentUser.Id)
            .AnyAsync(x =>
                ids.Contains(x));
    }


    // =========================================================
    // CHECK ACTIVE DEPARTMENT
    //
    // Chỉ dùng cho nghiệp vụ yêu cầu Department ACTIVE.
    //
    // Ví dụ:
    //
    // - Add employee vào Department
    // - Transfer employee vào Department
    // - Add member
    // - Create department conversation
    //
    // KHÔNG dùng method này để quyết định Scope.
    // =========================================================

    public async Task<bool>
        IsActiveDepartmentAsync(
            int departmentId)
    {
        return await db.Departments
            .AsNoTracking()
            .AnyAsync(x =>
                x.Id == departmentId &&
                x.IsActive);
    }
}