using Microsoft.AspNetCore.Authorization;

namespace CompanyChat.Api.Authorization;

/* =========================================================
   PERMISSION REQUIREMENT

   Đại diện cho một Permission mà Authorization
   đang yêu cầu User phải có.

   Ví dụ:

   PermissionRequirement(
       "Employee.View"
   )

   nghĩa là User phải có Permission:

   Employee.View

   Requirement này chỉ lưu thông tin Permission.

   Việc kiểm tra User có Permission hay không
   sẽ được thực hiện bởi:

   PermissionAuthorizationHandler
========================================================= */

public class PermissionRequirement(
    string permission)
    : IAuthorizationRequirement
{
    /* =========================================================
       REQUIRED PERMISSION

       Mã Permission cần kiểm tra.

       Ví dụ:

       Employee.View
       Employee.Create
       Department.Update
       Message.DeleteOwn
    ========================================================= */

    public string Permission { get; } = permission;
}