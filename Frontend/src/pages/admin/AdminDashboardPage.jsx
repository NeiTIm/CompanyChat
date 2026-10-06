import {
  useEffect,
  useState,
} from "react";

import { getAdminDashboard } from "../../services/admin/adminDashboardService";

import AdminUsersPage from "./employee/AdminUsersPage";
import AdminDepartmentsPage from "./department/AdminDepartmentsPage";

import {
  hasPermission,
} from "../../utils/permissionUtils";


function AdminDashboardPage({
  currentUser,
  onBackToChat,
  onLogout,
}) {
  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // Menu đang được chọn
  const [activeMenu, setActiveMenu] =
    useState("dashboard");


  /* =========================================================
     PERMISSIONS
  ========================================================= */

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

  const canViewPermissions =
    hasPermission(
      "System.Security"
    );


  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  useEffect(() => {
    loadDashboard();
  }, []);


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
     MENU ACCESS
  ========================================================= */

  function handleMenuChange(
    menu
  ) {
    setActiveMenu(menu);
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

          <button
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


          {/* =================================================
              USERS / EMPLOYEES
          ================================================= */}

          {canViewEmployees && (
            <button
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
              PERMISSIONS
          ================================================= */}

          {canViewPermissions && (
            <button
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
            className="admin-back-button"
            onClick={onBackToChat}
          >
            ← Quay lại Chat
          </button>


          {/* LOGOUT */}

          <button
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
              {activeMenu === "dashboard"
                ? "Dashboard"
                : activeMenu === "users"
                ? "Users"
                : activeMenu === "departments"
                ? "Departments"
                : activeMenu === "roles"
                ? "Roles"
                : activeMenu === "permissions"
                ? "Permissions"
                : "Dashboard"}
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

          {activeMenu === "dashboard" && (
            <>

              {/* ERROR */}

              {error && (
                <div className="admin-error">

                  {error}

                  <button
                    onClick={loadDashboard}
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

                {/* PANEL HEADER */}

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
                    className="admin-refresh-button"
                    onClick={loadDashboard}
                    disabled={loading}
                  >
                    ↻ Làm mới
                  </button>

                </div>


                {/* OVERVIEW */}

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
                            (dashboard.onlineUsers /
                              dashboard.totalUsers) *
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
              CHƯA TRIỂN KHAI
          ================================================= */}

          {activeMenu === "roles" &&
            canViewRoles && (
              <div className="admin-panel">

                <div className="admin-panel-header">

                  <div>

                    <h2>
                      Role Management
                    </h2>

                    <p>
                      Quản lý vai trò và quyền
                      của người dùng.
                    </p>

                  </div>

                </div>

              </div>
            )}


          {/* =================================================
              PERMISSIONS
              CHƯA TRIỂN KHAI
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


          {/* =================================================
              CONVERSATIONS
          ================================================= */}

          {activeMenu === "conversations" && (
            <div>
              Conversations
            </div>
          )}


          {/* =================================================
              MESSAGES
          ================================================= */}

          {activeMenu === "messages" && (
            <div>
              Messages
            </div>
          )}


          {/* =================================================
              CLEANUP
          ================================================= */}

          {activeMenu === "cleanup" && (
            <div>
              Cleanup
            </div>
          )}

        </section>

      </main>

    </div>
  );
}


export default AdminDashboardPage;