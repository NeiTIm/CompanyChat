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
    // UserManagedDepartments.
    // =========================================================

    public async Task<bool> IsAdminAsync(
        ClaimsPrincipal user)
    {
        var currentUser =
            await GetValidCurrentUserAsync(user);

        return currentUser?.Role == "Admin";
    }


    // =========================================================
    // GET MANAGED DEPARTMENT IDS
    //
    // Scope được xác định bởi:
    //
    // User
    //   ↓
    // UserManagedDepartments
    //   ↓
    // Department
    //
    // Không kiểm tra Role.
    //
    // Vì vậy sau này:
    //
    // Department Manager
    // HR Manager
    // Sales Manager
    // Regional Manager
    //
    // đều có thể sử dụng cùng cơ chế Scope.
    //
    // Chỉ trả Department đang active.
    //
    // Lưu ý:
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

        return await db.UserManagedDepartments
            .AsNoTracking()
            .Where(x =>
                x.UserId == currentUser.Id &&
                x.Department.IsActive)
            .Select(x =>
                x.DepartmentId)
            .Distinct()
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
        //
        // Việc Department có được phép nhận member mới
        // hay không sẽ do nghiệp vụ của Controller kiểm tra.
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
        // USER MANAGED DEPARTMENT
        //
        // Không kiểm tra Role.
        //
        // Bất kỳ user nào được cấp:
        //
        // UserManagedDepartment
        //
        // đều có Scope tới Department tương ứng.
        //
        // Role chỉ quyết định Permission.
        // -----------------------------------------------------

        return await db.UserManagedDepartments
            .AsNoTracking()
            .AnyAsync(x =>
                x.UserId == currentUser.Id &&
                x.DepartmentId == departmentId);
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
    // Hoặc:
    //
    // Transfer:
    //     A → B
    //
    // → phải có Scope A + B.
    //
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
        // Một query duy nhất thay vì:
        //
        // foreach
        //     CanManageDepartmentAsync()
        //
        // giúp giảm số lần query database.
        // -----------------------------------------------------

        var managedCount =
            await db.UserManagedDepartments
                .AsNoTracking()
                .Where(x =>
                    x.UserId == currentUser.Id &&
                    ids.Contains(x.DepartmentId))
                .Select(x =>
                    x.DepartmentId)
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
    // Ví dụ:
    // Employee list / employee visibility.
    //
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
        // -----------------------------------------------------

        return await db.UserManagedDepartments
            .AsNoTracking()
            .AnyAsync(x =>
                x.UserId == currentUser.Id &&
                ids.Contains(x.DepartmentId));
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