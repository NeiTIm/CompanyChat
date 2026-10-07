// using CompanyChat.Api.Data;
// using CompanyChat.Api.Models;
// using Microsoft.EntityFrameworkCore;

// namespace CompanyChat.Api.Services;

// public class ScopeService
// {
//     private readonly AppDbContext db;

//     public ScopeService(AppDbContext db)
//     {
//         this.db = db;
//     }

//     // =========================================================
//     // GET USER SCOPE
//     // =========================================================

//     /// <summary>
//     /// Lấy toàn bộ Department mà User đang được quản lý.
//     /// </summary>
//     public async Task<List<int>> GetManagedDepartmentIdsAsync(int userId)
//     {
//         return await db.UserManagedDepartments
//             .AsNoTracking()
//             .Where(x => x.UserId == userId)
//             .Select(x => x.DepartmentId)
//             .Distinct()
//             .ToListAsync();
//     }

//     /// <summary>
//     /// Lấy toàn bộ Scope của User kèm thông tin Department.
//     /// </summary>
//     public async Task<List<UserManagedDepartment>> GetUserScopesAsync(
//         int userId)
//     {
//         return await db.UserManagedDepartments
//             .AsNoTracking()
//             .Include(x => x.Department)
//             .Where(x => x.UserId == userId)
//             .OrderBy(x => x.Department.Name)
//             .ToListAsync();
//     }


//     // =========================================================
//     // CHECK USER / DEPARTMENT
//     // =========================================================

//     /// <summary>
//     /// Kiểm tra User có tồn tại và còn sử dụng được hay không.
//     /// </summary>
//     public async Task<bool> UserExistsAsync(int userId)
//     {
//         return await db.Users
//             .AsNoTracking()
//             .AnyAsync(x =>
//                 x.Id == userId &&
//                 !x.IsDeleted);
//     }

//     /// <summary>
//     /// Kiểm tra Department có tồn tại hay không.
//     /// </summary>
//     public async Task<bool> DepartmentExistsAsync(int departmentId)
//     {
//         return await db.Departments
//             .AsNoTracking()
//             .AnyAsync(x => x.Id == departmentId);
//     }

//     /// <summary>
//     /// Kiểm tra User đã có Scope tới Department hay chưa.
//     /// </summary>
//     public async Task<bool> HasScopeAsync(
//         int userId,
//         int departmentId)
//     {
//         return await db.UserManagedDepartments
//             .AsNoTracking()
//             .AnyAsync(x =>
//                 x.UserId == userId &&
//                 x.DepartmentId == departmentId);
//     }


//     // =========================================================
//     // ASSIGN ONE SCOPE
//     // =========================================================

//     /// <summary>
//     /// Gán một Department cho User.
//     /// </summary>
//     public async Task<bool> AssignDepartmentAsync(
//         int userId,
//         int departmentId)
//     {
//         var userExists = await UserExistsAsync(userId);

//         if (!userExists)
//             return false;

//         var departmentExists = await DepartmentExistsAsync(departmentId);

//         if (!departmentExists)
//             return false;

//         var alreadyExists = await HasScopeAsync(
//             userId,
//             departmentId);

//         if (alreadyExists)
//             return false;

//         var scope = new UserManagedDepartment
//         {
//             UserId = userId,
//             DepartmentId = departmentId
//         };

//         db.UserManagedDepartments.Add(scope);

//         await db.SaveChangesAsync();

//         return true;
//     }


//     // =========================================================
//     // REMOVE ONE SCOPE
//     // =========================================================

//     /// <summary>
//     /// Thu hồi một Department khỏi User.
//     /// </summary>
//     public async Task<bool> RemoveDepartmentAsync(
//         int userId,
//         int departmentId)
//     {
//         var scope = await db.UserManagedDepartments
//             .FirstOrDefaultAsync(x =>
//                 x.UserId == userId &&
//                 x.DepartmentId == departmentId);

//         if (scope == null)
//             return false;

//         db.UserManagedDepartments.Remove(scope);

//         await db.SaveChangesAsync();

//         return true;
//     }


//     // =========================================================
//     // BULK ASSIGN
//     // =========================================================

//     /// <summary>
//     /// Gán nhiều Department cho User.
//     ///
//     /// Chỉ thêm những Scope chưa tồn tại.
//     /// Scope đã tồn tại sẽ được bỏ qua.
//     /// </summary>
//     public async Task<int> AssignDepartmentsAsync(
//         int userId,
//         IEnumerable<int> departmentIds)
//     {
//         var ids = departmentIds
//             .Where(x => x > 0)
//             .Distinct()
//             .ToList();

//         if (ids.Count == 0)
//             return 0;

//         var userExists = await UserExistsAsync(userId);

//         if (!userExists)
//             return 0;

//         var existingDepartmentIds = await db.UserManagedDepartments
//             .AsNoTracking()
//             .Where(x =>
//                 x.UserId == userId &&
//                 ids.Contains(x.DepartmentId))
//             .Select(x => x.DepartmentId)
//             .ToListAsync();

//         var departmentIdsToAdd = ids
//             .Except(existingDepartmentIds)
//             .ToList();

//         if (departmentIdsToAdd.Count == 0)
//             return 0;

//         var validDepartmentIds = await db.Departments
//             .AsNoTracking()
//             .Where(x => departmentIdsToAdd.Contains(x.Id))
//             .Select(x => x.Id)
//             .ToListAsync();

//         if (validDepartmentIds.Count == 0)
//             return 0;

//         var scopes = validDepartmentIds
//             .Select(departmentId => new UserManagedDepartment
//             {
//                 UserId = userId,
//                 DepartmentId = departmentId
//             })
//             .ToList();

//         db.UserManagedDepartments.AddRange(scopes);

//         await db.SaveChangesAsync();

//         return scopes.Count;
//     }


//     // =========================================================
//     // REPLACE ALL SCOPES
//     // =========================================================

//     /// <summary>
//     /// Đồng bộ toàn bộ Scope của User.
//     ///
//     /// Danh sách truyền vào được xem là trạng thái Scope cuối cùng.
//     ///
//     /// Ví dụ:
//     ///
//     /// Database:
//     /// 1006
//     /// 1007
//     /// 1008
//     ///
//     /// Request:
//     /// 1006
//     /// 1009
//     ///
//     /// Kết quả:
//     /// 1006 -> giữ
//     /// 1007 -> xóa
//     /// 1008 -> xóa
//     /// 1009 -> thêm
//     /// </summary>
//     public async Task<bool> ReplaceDepartmentsAsync(
//         int userId,
//         IEnumerable<int> departmentIds)
//     {
//         var userExists = await UserExistsAsync(userId);

//         if (!userExists)
//             return false;

//         var newDepartmentIds = departmentIds
//             .Where(x => x > 0)
//             .Distinct()
//             .ToList();

//         // -----------------------------------------------------
//         // Validate tất cả Department phải tồn tại
//         // -----------------------------------------------------

//         var existingDepartmentIds = await db.Departments
//             .AsNoTracking()
//             .Where(x => newDepartmentIds.Contains(x.Id))
//             .Select(x => x.Id)
//             .ToListAsync();

//         var invalidDepartmentIds = newDepartmentIds
//             .Except(existingDepartmentIds)
//             .ToList();

//         if (invalidDepartmentIds.Count > 0)
//             return false;

//         // -----------------------------------------------------
//         // Lấy Scope hiện tại
//         // -----------------------------------------------------

//         var currentScopes = await db.UserManagedDepartments
//             .Where(x => x.UserId == userId)
//             .ToListAsync();

//         var currentDepartmentIds = currentScopes
//             .Select(x => x.DepartmentId)
//             .ToHashSet();

//         var newDepartmentIdSet = newDepartmentIds
//             .ToHashSet();

//         // -----------------------------------------------------
//         // Scope cần xóa
//         // -----------------------------------------------------

//         var scopesToRemove = currentScopes
//             .Where(x =>
//                 !newDepartmentIdSet.Contains(x.DepartmentId))
//             .ToList();

//         if (scopesToRemove.Count > 0)
//         {
//             db.UserManagedDepartments.RemoveRange(
//                 scopesToRemove);
//         }

//         // -----------------------------------------------------
//         // Scope cần thêm
//         // -----------------------------------------------------

//         var scopesToAdd = newDepartmentIds
//             .Where(id =>
//                 !currentDepartmentIds.Contains(id))
//             .Select(id => new UserManagedDepartment
//             {
//                 UserId = userId,
//                 DepartmentId = id
//             })
//             .ToList();

//         if (scopesToAdd.Count > 0)
//         {
//             db.UserManagedDepartments.AddRange(
//                 scopesToAdd);
//         }

//         await db.SaveChangesAsync();

//         return true;
//     }


//     // =========================================================
//     // GET USERS BY DEPARTMENT
//     // =========================================================

//     /// <summary>
//     /// Lấy User đang được Scope tới một Department.
//     /// </summary>
//     public async Task<List<int>> GetUserIdsByDepartmentAsync(
//         int departmentId)
//     {
//         return await db.UserManagedDepartments
//             .AsNoTracking()
//             .Where(x => x.DepartmentId == departmentId)
//             .Select(x => x.UserId)
//             .Distinct()
//             .ToListAsync();
//     }


//     // =========================================================
//     // GET DEPARTMENTS WITHOUT SCOPE FOR USER
//     // =========================================================

//     /// <summary>
//     /// Lấy các Department mà User chưa được Scope.
//     /// </summary>
//     public async Task<List<Department>> GetAvailableDepartmentsAsync(
//         int userId,
//         string? search = null)
//     {
//         var managedDepartmentIds = db.UserManagedDepartments
//             .Where(x => x.UserId == userId)
//             .Select(x => x.DepartmentId);

//         var query = db.Departments
//             .AsNoTracking()
//             .Where(x =>
//                 !managedDepartmentIds.Contains(x.Id));

//         if (!string.IsNullOrWhiteSpace(search))
//         {
//             var keyword = search.Trim();

//             query = query.Where(x =>
//                 x.Name.Contains(keyword));
//         }

//         return await query
//             .OrderBy(x => x.Name)
//             .ToListAsync();
//     }


//     // =========================================================
//     // STATISTICS
//     // =========================================================

//     /// <summary>
//     /// Tổng số User đang có ít nhất một Scope.
//     /// </summary>
//     public async Task<int> GetUsersWithScopeCountAsync()
//     {
//         return await db.UserManagedDepartments
//             .AsNoTracking()
//             .Select(x => x.UserId)
//             .Distinct()
//             .CountAsync();
//     }

//     /// <summary>
//     /// Tổng số quan hệ User -> Department.
//     /// </summary>
//     public async Task<int> GetTotalScopeCountAsync()
//     {
//         return await db.UserManagedDepartments
//             .AsNoTracking()
//             .CountAsync();
//     }

//     /// <summary>
//     /// Tổng số Department đang có ít nhất một User Scope.
//     /// </summary>
//     public async Task<int> GetDepartmentsWithScopeCountAsync()
//     {
//         return await db.UserManagedDepartments
//             .AsNoTracking()
//             .Select(x => x.DepartmentId)
//             .Distinct()
//             .CountAsync();
//     }
// }




using CompanyChat.Api.Data;
using CompanyChat.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CompanyChat.Api.Services;

public class ScopeService
{
    private readonly AppDbContext db;

    public ScopeService(AppDbContext db)
    {
        this.db = db;
    }

    // =========================================================
    // GET USER SCOPE
    // =========================================================

    public async Task<List<int>> GetManagedDepartmentIdsAsync(
        int userId)
    {
        return await db.UserManagedDepartments
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => x.DepartmentId)
            .Distinct()
            .ToListAsync();
    }

    public async Task<List<UserManagedDepartment>> GetUserScopesAsync(
        int userId)
    {
        return await db.UserManagedDepartments
            .AsNoTracking()
            .Include(x => x.Department)
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.Department.Name)
            .ToListAsync();
    }

    // =========================================================
    // CHECK USER / DEPARTMENT
    // =========================================================

    public async Task<bool> UserExistsAsync(
        int userId)
    {
        return await db.Users
            .AsNoTracking()
            .AnyAsync(x =>
                x.Id == userId &&
                !x.IsDeleted);
    }

    public async Task<bool> DepartmentExistsAsync(
        int departmentId)
    {
        return await db.Departments
            .AsNoTracking()
            .AnyAsync(x =>
                x.Id == departmentId);
    }

    public async Task<bool> HasScopeAsync(
        int userId,
        int departmentId)
    {
        return await db.UserManagedDepartments
            .AsNoTracking()
            .AnyAsync(x =>
                x.UserId == userId &&
                x.DepartmentId == departmentId);
    }

    // =========================================================
    // ASSIGN ONE SCOPE
    // =========================================================

    public async Task<bool> AssignDepartmentAsync(
        int userId,
        int departmentId)
    {
        if (!await UserExistsAsync(userId))
            return false;

        if (!await DepartmentExistsAsync(
                departmentId))
            return false;

        if (await HasScopeAsync(
                userId,
                departmentId))
            return false;

        var scope =
            new UserManagedDepartment
            {
                UserId = userId,
                DepartmentId =
                    departmentId
            };

        db.UserManagedDepartments.Add(
            scope);

        await db.SaveChangesAsync();

        return true;
    }

    // =========================================================
    // REMOVE ONE SCOPE
    // =========================================================

    public async Task<bool> RemoveDepartmentAsync(
        int userId,
        int departmentId)
    {
        var scope =
            await db.UserManagedDepartments
                .FirstOrDefaultAsync(x =>
                    x.UserId == userId &&
                    x.DepartmentId ==
                        departmentId);

        if (scope == null)
            return false;

        db.UserManagedDepartments.Remove(
            scope);

        await db.SaveChangesAsync();

        return true;
    }

    // =========================================================
    // BULK ASSIGN
    // =========================================================

    public async Task<int> AssignDepartmentsAsync(
        int userId,
        IEnumerable<int> departmentIds)
    {
        var ids = departmentIds
            .Where(x => x > 0)
            .Distinct()
            .ToList();

        if (ids.Count == 0)
            return 0;

        if (!await UserExistsAsync(userId))
            return 0;

        var existingDepartmentIds =
            await db.UserManagedDepartments
                .AsNoTracking()
                .Where(x =>
                    x.UserId == userId &&
                    ids.Contains(
                        x.DepartmentId))
                .Select(x =>
                    x.DepartmentId)
                .ToListAsync();

        var departmentIdsToAdd =
            ids.Except(
                existingDepartmentIds)
            .ToList();

        if (departmentIdsToAdd.Count == 0)
            return 0;

        var validDepartmentIds =
            await db.Departments
                .AsNoTracking()
                .Where(x =>
                    departmentIdsToAdd
                        .Contains(x.Id))
                .Select(x => x.Id)
                .ToListAsync();

        if (validDepartmentIds.Count == 0)
            return 0;

        var scopes =
            validDepartmentIds
                .Select(departmentId =>
                    new UserManagedDepartment
                    {
                        UserId = userId,
                        DepartmentId =
                            departmentId
                    })
                .ToList();

        db.UserManagedDepartments.AddRange(
            scopes);

        await db.SaveChangesAsync();

        return scopes.Count;
    }

    // =========================================================
    // REPLACE ALL SCOPES
    // =========================================================

    public async Task<bool> ReplaceDepartmentsAsync(
        int userId,
        IEnumerable<int> departmentIds)
    {
        if (!await UserExistsAsync(userId))
            return false;

        var newDepartmentIds =
            departmentIds
                .Where(x => x > 0)
                .Distinct()
                .ToList();

        // =====================================================
        // VALIDATE DEPARTMENTS
        // =====================================================

        var existingDepartmentIds =
            await db.Departments
                .AsNoTracking()
                .Where(x =>
                    newDepartmentIds
                        .Contains(x.Id))
                .Select(x => x.Id)
                .ToListAsync();

        var invalidDepartmentIds =
            newDepartmentIds
                .Except(
                    existingDepartmentIds)
                .ToList();

        if (invalidDepartmentIds.Count > 0)
            return false;

        // =====================================================
        // CURRENT SCOPES
        // =====================================================

        var currentScopes =
            await db.UserManagedDepartments
                .Where(x =>
                    x.UserId == userId)
                .ToListAsync();

        var currentDepartmentIds =
            currentScopes
                .Select(x =>
                    x.DepartmentId)
                .ToHashSet();

        var newDepartmentIdSet =
            newDepartmentIds
                .ToHashSet();

        // =====================================================
        // REMOVE
        // =====================================================

        var scopesToRemove =
            currentScopes
                .Where(x =>
                    !newDepartmentIdSet
                        .Contains(
                            x.DepartmentId))
                .ToList();

        if (scopesToRemove.Count > 0)
        {
            db.UserManagedDepartments
                .RemoveRange(
                    scopesToRemove);
        }

        // =====================================================
        // ADD
        // =====================================================

        var scopesToAdd =
            newDepartmentIds
                .Where(id =>
                    !currentDepartmentIds
                        .Contains(id))
                .Select(id =>
                    new UserManagedDepartment
                    {
                        UserId = userId,
                        DepartmentId = id
                    })
                .ToList();

        if (scopesToAdd.Count > 0)
        {
            db.UserManagedDepartments
                .AddRange(
                    scopesToAdd);
        }

        await db.SaveChangesAsync();

        return true;
    }

    // =========================================================
    // GET USERS BY DEPARTMENT
    // =========================================================

    public async Task<List<int>>
        GetUserIdsByDepartmentAsync(
            int departmentId)
    {
        return await db.UserManagedDepartments
            .AsNoTracking()
            .Where(x =>
                x.DepartmentId ==
                departmentId)
            .Select(x => x.UserId)
            .Distinct()
            .ToListAsync();
    }

    // =========================================================
    // GET AVAILABLE DEPARTMENTS
    // =========================================================

    public async Task<List<Department>>
        GetAvailableDepartmentsAsync(
            int userId,
            string? search = null)
    {
        var managedDepartmentIds =
            db.UserManagedDepartments
                .Where(x =>
                    x.UserId == userId)
                .Select(x =>
                    x.DepartmentId);

        var query =
            db.Departments
                .AsNoTracking()
                .Where(x =>
                    !managedDepartmentIds
                        .Contains(x.Id));

        if (!string.IsNullOrWhiteSpace(
                search))
        {
            var keyword =
                search.Trim();

            query = query.Where(x =>
                x.Name.Contains(
                    keyword));
        }

        return await query
            .OrderBy(x => x.Name)
            .ToListAsync();
    }

    // =========================================================
    // STATISTICS
    // =========================================================

    public async Task<int>
        GetUsersWithScopeCountAsync()
    {
        return await db.UserManagedDepartments
            .AsNoTracking()
            .Select(x => x.UserId)
            .Distinct()
            .CountAsync();
    }

    public async Task<int>
        GetTotalScopeCountAsync()
    {
        return await db.UserManagedDepartments
            .AsNoTracking()
            .CountAsync();
    }

    public async Task<int>
        GetDepartmentsWithScopeCountAsync()
    {
        return await db.UserManagedDepartments
            .AsNoTracking()
            .Select(x =>
                x.DepartmentId)
            .Distinct()
            .CountAsync();
    }
}