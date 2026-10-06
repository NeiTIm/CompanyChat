using System.Security.Claims;

using CompanyChat.Api.Services.Authorization;

using Microsoft.AspNetCore.Authorization;

namespace CompanyChat.Api.Authorization;

/* =========================================================
   PERMISSION AUTHORIZATION HANDLER

   Handler chịu trách nhiệm kiểm tra User hiện tại
   có Permission mà Authorization yêu cầu hay không.

   Flow:

   [Authorize(
       Policy = "Permission:Employee.View"
   )]

        ↓

   PermissionPolicyProvider

        ↓

   PermissionRequirement

        ↓

   PermissionAuthorizationHandler

        ↓

   PermissionService

        ↓

   Role
        ↓
   RolePermission
        ↓
   Permission

        ↓

   Allow / Deny
========================================================= */

public class PermissionAuthorizationHandler(
    PermissionService permissionService)
    : AuthorizationHandler<PermissionRequirement>
{
    /* =========================================================
       HANDLE REQUIREMENT
    ========================================================= */

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        /* =====================================================
           1. LẤY USER ID TỪ JWT
        ===================================================== */

        var userIdClaim =
            context.User.FindFirst(
                ClaimTypes.NameIdentifier);

        if (userIdClaim == null)
        {
            return;
        }

        if (!int.TryParse(
                userIdClaim.Value,
                out var userId))
        {
            return;
        }


        /* =====================================================
           2. KIỂM TRA PERMISSION

           PermissionService chịu trách nhiệm:

           - User tồn tại
           - User chưa bị xóa
           - User đang active
           - User có Role
           - Role có Permission
        ===================================================== */

        var hasPermission =
            await permissionService.HasPermissionAsync(
                userId,
                requirement.Permission);


        /* =====================================================
           3. AUTHORIZATION SUCCESS
        ===================================================== */

        if (hasPermission)
        {
            context.Succeed(requirement);
        }
    }
}