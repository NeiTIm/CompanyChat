using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace CompanyChat.Api.Authorization;

/* =========================================================
   PERMISSION POLICY PROVIDER

   Cho phép CompanyChat sử dụng Dynamic Permission Policy.

   Ví dụ:

   [Authorize(
       Policy = "Permission:Employee.View"
   )]


   Provider nhận:

   Permission:Employee.View

   Sau đó tách thành:

   Employee.View

   và tạo:

   PermissionRequirement("Employee.View")


   Không cần khai báo 31 Permission thủ công
   trong Program.cs.
========================================================= */

public class PermissionPolicyProvider
    : DefaultAuthorizationPolicyProvider
{
    /* =========================================================
       POLICY PREFIX

       Dynamic Permission Policy của CompanyChat
       luôn bắt đầu bằng:

       Permission:
    ========================================================= */

    private const string PermissionPrefix =
        "Permission:";


    /* =========================================================
       CONSTRUCTOR
    ========================================================= */

    public PermissionPolicyProvider(
        IOptions<AuthorizationOptions> options)
        : base(options)
    {
    }


    /* =========================================================
       GET POLICY

       ASP.NET Core gọi method này khi gặp:

       [Authorize(
           Policy = "Permission:Employee.View"
       )]
    ========================================================= */

    public override async Task<AuthorizationPolicy?>
        GetPolicyAsync(
            string policyName)
    {
        /* =====================================================
           1. KIỂM TRA CÓ PHẢI DYNAMIC PERMISSION POLICY KHÔNG?

           Nếu không bắt đầu bằng:

           Permission:

           thì đây là Policy bình thường.

           Ví dụ:

           ManageUsers
           ManageDepartments
           AccessConversation
           SendMessage

           Những Policy này vẫn giao cho
           DefaultAuthorizationPolicyProvider xử lý.

           → Không phá hệ thống Policy cũ.
        ===================================================== */

        if (!policyName.StartsWith(
                PermissionPrefix,
                StringComparison.OrdinalIgnoreCase))
        {
            return await base.GetPolicyAsync(
                policyName);
        }


        /* =====================================================
           2. LẤY PERMISSION CODE

           Ví dụ:

           policyName:

           Permission:Employee.View


           PermissionPrefix:

           Permission:


           Kết quả:

           Employee.View
        ===================================================== */

        var permission =
            policyName[
                PermissionPrefix.Length..]
            .Trim();


        /* =====================================================
           3. KIỂM TRA PERMISSION CODE

           Nếu Policy chỉ là:

           Permission:

           thì không hợp lệ.
        ===================================================== */

        if (string.IsNullOrWhiteSpace(permission))
        {
            return null;
        }


        /* =====================================================
           4. TẠO DYNAMIC AUTHORIZATION POLICY

           Policy này yêu cầu:

           - User phải đăng nhập
           - User phải có Permission tương ứng
        ===================================================== */

        var policy =
            new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .AddRequirements(
                    new PermissionRequirement(
                        permission))
                .Build();


        /* =====================================================
           5. TRẢ POLICY CHO ASP.NET CORE

           Ví dụ:

           Permission:Employee.View

           ↓

           PermissionRequirement

           ↓

           PermissionAuthorizationHandler
        ===================================================== */

        return policy;
    }
}