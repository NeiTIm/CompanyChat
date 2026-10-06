namespace CompanyChat.Api.Authorization;

public static class Permissions
{
    // =========================================================
    // EMPLOYEE
    // =========================================================

    public const string EmployeeView =
        "Employee.View";

    public const string EmployeeCreate =
        "Employee.Create";

    public const string EmployeeUpdate =
        "Employee.Update";

    public const string EmployeeDelete =
        "Employee.Delete";

    public const string EmployeeRestore =
        "Employee.Restore";

    public const string EmployeeLock =
        "Employee.Lock";

    public const string EmployeeResetPassword =
        "Employee.ResetPassword";

    public const string EmployeeAssignDepartment =
        "Employee.AssignDepartment";


    // =========================================================
    // DEPARTMENT
    // =========================================================

    public const string DepartmentView =
        "Department.View";

    public const string DepartmentCreate =
        "Department.Create";

    public const string DepartmentUpdate =
        "Department.Update";

    public const string DepartmentEnable =
        "Department.Enable";

    public const string DepartmentDisable =
        "Department.Disable";

    public const string DepartmentManageMembers =
        "Department.ManageMembers";

    public const string DepartmentViewStatistics =
        "Department.ViewStatistics";


    // =========================================================
    // ROLE
    // =========================================================

    public const string RoleView =
        "Role.View";

    public const string RoleCreate =
        "Role.Create";

    public const string RoleUpdate =
        "Role.Update";

    public const string RoleDelete =
        "Role.Delete";

    public const string RoleAssign =
        "Role.Assign";


    // =========================================================
    // CONVERSATION
    // =========================================================

    public const string ConversationView =
        "Conversation.View";

    public const string ConversationCreate =
        "Conversation.Create";


    // =========================================================
    // MESSAGE
    // =========================================================

    public const string MessageView =
        "Message.View";

    public const string MessageSend =
        "Message.Send";

    public const string MessageEditOwn =
        "Message.EditOwn";

    public const string MessageDeleteOwn =
        "Message.DeleteOwn";

    public const string MessageModerate =
        "Message.Moderate";


    // =========================================================
    // DASHBOARD
    // =========================================================

    public const string DashboardView =
        "Dashboard.View";


    // =========================================================
    // AUDIT LOG
    // =========================================================

    public const string AuditLogView =
        "AuditLog.View";


    // =========================================================
    // SYSTEM
    // =========================================================

    public const string SystemSettings =
        "System.Settings";

    public const string SystemSecurity =
        "System.Security";
}