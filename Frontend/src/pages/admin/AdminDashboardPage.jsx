import {
  useEffect,
  useState,
} from "react";

import {
  getAdminDashboard,
} from "../../services/admin/adminDashboardService";

import AdminUsersPage from "./employee/AdminUsersPage";
import AdminDepartmentsPage from "./department/AdminDepartmentsPage";
import AdminRolesPage from "./role/AdminRolesPage";
import AdminScopePage from "./scope/AdminScopePage";

import {
  hasPermission,
} from "../../utils/permissionUtils";


function AdminDashboardPage({
  currentUser,
  onBackToChat,
  onLogout,
}) {

  /* =========================================================
     DASHBOARD
  ========================================================= */

  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  /* =========================================================
     MENU
  ========================================================= */

  const [activeMenu, setActiveMenu] =
    useState("dashboard");


  /* =========================================================
     PERMISSIONS
  ========================================================= */

  const canViewDashboard =
    hasPermission(
      "Dashboard.View"
    );

  const canViewEmployees =
    hasPermission(
      "Employee.View"
    );

  const canViewDepartments =
    hasPermission(
      "Department.View"
    );

  const canViewRoles =
    hasPermission(
      "Role.View"
    );

  const canViewScope =
    hasPermission(
      "Scope.View"
    );

  const canViewPermissions =
    hasPermission(
      "System.Security"
    );


  /* =========================================================
     FIRST AVAILABLE MENU
  ========================================================= */

  function getFirstAvailableMenu() {

    if (canViewDashboard) {
      return "dashboard";
    }

    if (canViewEmployees) {
      return "users";
    }

    if (canViewDepartments) {
      return "departments";
    }

    if (canViewRoles) {
      return "roles";
    }

    if (canViewScope) {
      return "scope";
    }

    if (canViewPermissions) {
      return "permissions";
    }

    return null;
  }


  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  useEffect(() => {

    if (
      activeMenu !== "dashboard" ||
      !canViewDashboard
    ) {
      return;
    }

    loadDashboard();

  }, [
    activeMenu,
    canViewDashboard,
  ]);


  async function loadDashboard() {

    try {

      setLoading(true);

      setError("");

      const data =
        await getAdminDashboard();

      setDashboard(data);

    } catch (error) {

      console.error(
        "Không thể tải Dashboard:",
        error
      );

      setError(
        "Không thể tải dữ liệu Dashboard."
      );

    } finally {

      setLoading(false);

    }

  }


  /* =========================================================
     INITIAL MENU VALIDATION
  ========================================================= */

  useEffect(() => {

    const firstAvailableMenu =
      getFirstAvailableMenu();

    if (!firstAvailableMenu) {

      setActiveMenu(null);

      return;
    }


    const hasAccessToCurrentMenu =
      (
        activeMenu === "dashboard" &&
        canViewDashboard
      ) ||
      (
        activeMenu === "users" &&
        canViewEmployees
      ) ||
      (
        activeMenu === "departments" &&
        canViewDepartments
      ) ||
      (
        activeMenu === "roles" &&
        canViewRoles
      ) ||
      (
        activeMenu === "scope" &&
        canViewScope
      ) ||
      (
        activeMenu === "permissions" &&
        canViewPermissions
      );


    if (!hasAccessToCurrentMenu) {

      setActiveMenu(
        firstAvailableMenu
      );

    }

  }, [
    activeMenu,
    canViewDashboard,
    canViewEmployees,
    canViewDepartments,
    canViewRoles,
    canViewScope,
    canViewPermissions,
  ]);


  /* =========================================================
     MENU ACCESS
  ========================================================= */

  function handleMenuChange(
    menu
  ) {

    if (menu === "dashboard") {

      if (!canViewDashboard) {
        return;
      }

    }


    if (menu === "users") {

      if (!canViewEmployees) {
        return;
      }

    }


    if (menu === "departments") {

      if (!canViewDepartments) {
        return;
      }

    }


    if (menu === "roles") {

      if (!canViewRoles) {
        return;
      }

    }


    if (menu === "scope") {

      if (!canViewScope) {
        return;
      }

    }


    if (menu === "permissions") {

      if (!canViewPermissions) {
        return;
      }

    }


    setActiveMenu(menu);

  }


  /* =========================================================
     PAGE TITLE
  ========================================================= */

  function getPageTitle() {

    switch (activeMenu) {

      case "dashboard":
        return "Dashboard";

      case "users":
        return "Users";

      case "departments":
        return "Departments";

      case "roles":
        return "Roles";

      case "scope":
        return "Scope";

      case "permissions":
        return "Permissions";

      default:
        return "CompanyChat";

    }

  }


  /* =========================================================
     NO PERMISSION
  ========================================================= */

  const firstAvailableMenu =
    getFirstAvailableMenu();


  if (!firstAvailableMenu) {

    return (

      <div className="admin-layout">

        <main className="admin-main">

          <section className="admin-content">

            <div className="admin-panel">

              <div className="admin-panel-header">

                <div>

                  <h2>
                    Không có quyền truy cập
                  </h2>

                  <p>
                    Tài khoản của bạn chưa được
                    cấp quyền quản trị phù hợp.
                  </p>

                </div>

              </div>

            </div>

          </section>

        </main>

      </div>

    );

  }


  return (

    <div className="admin-layout">


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="admin-sidebar">


        {/* ===================================================
            LOGO
        =================================================== */}

        <div className="admin-logo">

          <div className="admin-logo-icon">
            C
          </div>

          <div>

            <div className="admin-logo-title">
              CompanyChat
            </div>

            <div className="admin-logo-subtitle">
              Management
            </div>

          </div>

        </div>


        {/* ===================================================
            MENU
        =================================================== */}

        <nav className="admin-menu">


          {/* =================================================
              DASHBOARD
          ================================================= */}

          {canViewDashboard && (

            <button
              type="button"
              className={
                activeMenu === "dashboard"
                  ? "admin-menu-item active"
                  : "admin-menu-item"
              }
              onClick={() =>
                handleMenuChange(
                  "dashboard"
                )
              }
            >

              <span>
                📊
              </span>

              Dashboard

            </button>

          )}


          {/* =================================================
              USERS / EMPLOYEES
          ================================================= */}

          {canViewEmployees && (

            <button
              type="button"
              className={
                activeMenu === "users"
                  ? "admin-menu-item active"
                  : "admin-menu-item"
              }
              onClick={() =>
                handleMenuChange(
                  "users"
                )
              }
            >

              <span>
                👥
              </span>

              Users

            </button>

          )}


          {/* =================================================
              DEPARTMENTS
          ================================================= */}

          {canViewDepartments && (

            <button
              type="button"
              className={
                activeMenu === "departments"
                  ? "admin-menu-item active"
                  : "admin-menu-item"
              }
              onClick={() =>
                handleMenuChange(
                  "departments"
                )
              }
            >

              <span>
                🏢
              </span>

              Departments

            </button>

          )}


          {/* =================================================
              ROLES
          ================================================= */}

          {canViewRoles && (

            <button
              type="button"
              className={
                activeMenu === "roles"
                  ? "admin-menu-item active"
                  : "admin-menu-item"
              }
              onClick={() =>
                handleMenuChange(
                  "roles"
                )
              }
            >

              <span>
                🛡️
              </span>

              Roles

            </button>

          )}


          {/* =================================================
              SCOPE
          ================================================= */}

          {canViewScope && (

            <button
              type="button"
              className={
                activeMenu === "scope"
                  ? "admin-menu-item active"
                  : "admin-menu-item"
              }
              onClick={() =>
                handleMenuChange(
                  "scope"
                )
              }
            >

              <span>
                🎯
              </span>

              Scope

            </button>

          )}


          {/* =================================================
              PERMISSIONS
          ================================================= */}

          {canViewPermissions && (

            <button
              type="button"
              className={
                activeMenu === "permissions"
                  ? "admin-menu-item active"
                  : "admin-menu-item"
              }
              onClick={() =>
                handleMenuChange(
                  "permissions"
                )
              }
            >

              <span>
                🔐
              </span>

              Permissions

            </button>

          )}


          {/* =================================================
              CONVERSATIONS
              TẠM THỜI CHƯA LÀM
          ================================================= */}

          <button
            type="button"
            className="admin-menu-item"
            disabled
          >

            <span>
              💬
            </span>

            Conversations

          </button>


          {/* =================================================
              MESSAGES
              TẠM THỜI CHƯA LÀM
          ================================================= */}

          <button
            type="button"
            className="admin-menu-item"
            disabled
          >

            <span>
              📨
            </span>

            Messages

          </button>


          {/* =================================================
              CLEANUP
              TẠM THỜI CHƯA LÀM
          ================================================= */}

          <button
            type="button"
            className="admin-menu-item"
            disabled
          >

            <span>
              🧹
            </span>

            Cleanup

          </button>

        </nav>


        {/* ===================================================
            SIDEBAR BOTTOM
        =================================================== */}

        <div className="admin-sidebar-bottom">


          {/* BACK TO CHAT */}

          <button
            type="button"
            className="admin-back-button"
            onClick={onBackToChat}
          >
            ← Quay lại Chat
          </button>


          {/* LOGOUT */}

          <button
            type="button"
            className="admin-logout-button"
            onClick={onLogout}
          >
            Đăng xuất
          </button>

        </div>

      </aside>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="admin-main">


        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="admin-header">

          <div>

            <h1>
              {getPageTitle()}
            </h1>

            <p>
              Quản lý hệ thống CompanyChat
            </p>

          </div>


          {/* =================================================
              CURRENT USER PROFILE
          ================================================= */}

          <div className="admin-profile">

            <div className="admin-avatar">

              {(
                currentUser?.fullName ||
                currentUser?.username ||
                "U"
              )
                .charAt(0)
                .toUpperCase()}

            </div>


            <div>

              <strong>
                {currentUser?.fullName ||
                  currentUser?.username ||
                  "User"}
              </strong>

              <span>
                {currentUser?.role ||
                  "Employee"}
              </span>

            </div>

          </div>

        </header>


        {/* ===================================================
            CONTENT
        =================================================== */}

        <section className="admin-content">


          {/* =================================================
              DASHBOARD
          ================================================= */}

          {activeMenu === "dashboard" &&
            canViewDashboard && (

              <>

                {/* ERROR */}

                {error && (

                  <div className="admin-error">

                    {error}

                    <button
                      type="button"
                      onClick={
                        loadDashboard
                      }
                    >
                      Thử lại
                    </button>

                  </div>

                )}


                {/* =============================================
                    STAT CARDS
                ============================================= */}

                <div className="admin-stats">


                  {/* USERS */}

                  <div className="admin-stat-card">

                    <div className="admin-stat-icon">
                      👥
                    </div>

                    <div>

                      <span>
                        Tổng Users
                      </span>

                      <strong>
                        {loading
                          ? "..."
                          : dashboard?.totalUsers ??
                            0}
                      </strong>

                    </div>

                  </div>


                  {/* ONLINE */}

                  <div className="admin-stat-card">

                    <div className="admin-stat-icon">
                      🟢
                    </div>

                    <div>

                      <span>
                        Đang online
                      </span>

                      <strong>
                        {loading
                          ? "..."
                          : dashboard?.onlineUsers ??
                            0}
                      </strong>

                    </div>

                  </div>


                  {/* CONVERSATIONS */}

                  <div className="admin-stat-card">

                    <div className="admin-stat-icon">
                      💬
                    </div>

                    <div>

                      <span>
                        Conversations
                      </span>

                      <strong>
                        {loading
                          ? "..."
                          : dashboard?.totalConversations ??
                            0}
                      </strong>

                    </div>

                  </div>


                  {/* MESSAGES */}

                  <div className="admin-stat-card">

                    <div className="admin-stat-icon">
                      📨
                    </div>

                    <div>

                      <span>
                        Messages
                      </span>

                      <strong>
                        {loading
                          ? "..."
                          : dashboard?.totalMessages ??
                            0}
                      </strong>

                    </div>

                  </div>

                </div>


                {/* =============================================
                    SYSTEM OVERVIEW
                ============================================= */}

                <div className="admin-panel">

                  <div className="admin-panel-header">

                    <div>

                      <h2>
                        Tổng quan hệ thống
                      </h2>

                      <p>
                        Thông tin hiện tại của
                        CompanyChat
                      </p>

                    </div>


                    <button
                      type="button"
                      className="admin-refresh-button"
                      onClick={
                        loadDashboard
                      }
                      disabled={loading}
                    >
                      ↻ Làm mới
                    </button>

                  </div>


                  <div className="admin-overview">


                    {/* ACTIVE USERS */}

                    <div className="admin-overview-item">

                      <span>
                        Người dùng hoạt động
                      </span>

                      <strong>
                        {loading
                          ? "..."
                          : dashboard?.activeUsers ??
                            0}
                      </strong>

                    </div>


                    {/* DELETED MESSAGES */}

                    <div className="admin-overview-item">

                      <span>
                        Tin nhắn đã xóa
                      </span>

                      <strong>
                        {loading
                          ? "..."
                          : dashboard?.deletedMessages ??
                            0}
                      </strong>

                    </div>


                    {/* ONLINE RATE */}

                    <div className="admin-overview-item">

                      <span>
                        Tỷ lệ online
                      </span>

                      <strong>

                        {loading
                          ? "..."
                          : dashboard?.totalUsers
                          ? `${Math.round(
                              (
                                dashboard.onlineUsers /
                                dashboard.totalUsers
                              ) *
                                100
                            )}%`
                          : "0%"}

                      </strong>

                    </div>

                  </div>

                </div>

              </>

            )}


          {/* =================================================
              USERS
          ================================================= */}

          {activeMenu === "users" &&
            canViewEmployees && (

              <AdminUsersPage
                currentUser={
                  currentUser
                }
              />

            )}


          {/* =================================================
              DEPARTMENTS
          ================================================= */}

          {activeMenu === "departments" &&
            canViewDepartments && (

              <AdminDepartmentsPage />

            )}


          {/* =================================================
              ROLES
          ================================================= */}

          {activeMenu === "roles" &&
            canViewRoles && (

              <AdminRolesPage />

            )}


          {/* =================================================
              SCOPE
          ================================================= */}

          {activeMenu === "scope" &&
            canViewScope && (

              <AdminScopePage />

            )}


          {/* =================================================
              PERMISSIONS
          ================================================= */}

          {activeMenu === "permissions" &&
            canViewPermissions && (

              <div className="admin-panel">

                <div className="admin-panel-header">

                  <div>

                    <h2>
                      Permission Management
                    </h2>

                    <p>
                      Quản lý Permission của
                      CompanyChat.
                    </p>

                  </div>

                </div>

              </div>

            )}

        </section>

      </main>

    </div>

  );

}


export default AdminDashboardPage;