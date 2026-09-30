import { useEffect, useState } from "react";

import { getAdminDashboard } from "../../services/admin/adminDashboardService";
import AdminUsersPage from "./AdminUsersPage";

function AdminDashboardPage({
  currentUser,
  onBackToChat,
  onLogout,
}) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Menu đang được chọn
  const [activeMenu, setActiveMenu] =
    useState("dashboard");

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
        "Không thể tải Admin Dashboard:",
        error
      );

      setError(
        "Không thể tải dữ liệu Dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-layout">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="admin-sidebar">

        {/* LOGO */}
        <div className="admin-logo">

          <div className="admin-logo-icon">
            C
          </div>

          <div>
            <div className="admin-logo-title">
              CompanyChat
            </div>

            <div className="admin-logo-subtitle">
              Administration
            </div>
          </div>

        </div>

        {/* MENU */}
        <nav className="admin-menu">

          {/* DASHBOARD */}
          <button
            className={
              activeMenu === "dashboard"
                ? "admin-menu-item active"
                : "admin-menu-item"
            }
            onClick={() =>
              setActiveMenu("dashboard")
            }
          >
            <span>📊</span>
            Dashboard
          </button>

          {/* USERS */}
          <button
            className={
              activeMenu === "users"
                ? "admin-menu-item active"
                : "admin-menu-item"
            }
            onClick={() =>
              setActiveMenu("users")
            }
          >
            <span>👥</span>
            Users
          </button>

          {/* CONVERSATIONS */}
          <button
            className="admin-menu-item"
          >
            <span>💬</span>
            Conversations
          </button>

          {/* MESSAGES */}
          <button
            className="admin-menu-item"
          >
            <span>📨</span>
            Messages
          </button>

          {/* CLEANUP */}
          <button
            className="admin-menu-item"
          >
            <span>🧹</span>
            Cleanup
          </button>

        </nav>

        {/* SIDEBAR BOTTOM */}
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
                : "Dashboard"}
            </h1>

            <p>
              Quản lý hệ thống CompanyChat
            </p>

          </div>

          {/* ADMIN PROFILE */}
          <div className="admin-profile">

            <div className="admin-avatar">

              {(
                currentUser?.fullName ||
                currentUser?.username ||
                "A"
              )
                .charAt(0)
                .toUpperCase()}

            </div>

            <div>

              <strong>
                {currentUser?.fullName ||
                  currentUser?.username ||
                  "Admin"}
              </strong>

              <span>
                Administrator
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

          {activeMenu === "users" && (
            <AdminUsersPage
              currentUser={currentUser}
            />
          )}

          {/* =================================================
              CONVERSATIONS
              TẠM THỜI CHƯA LÀM
          ================================================= */}

          {activeMenu === "conversations" && (
            <div>
              Conversations
            </div>
          )}

          {/* =================================================
              MESSAGES
              TẠM THỜI CHƯA LÀM
          ================================================= */}

          {activeMenu === "messages" && (
            <div>
              Messages
            </div>
          )}

          {/* =================================================
              CLEANUP
              TẠM THỜI CHƯA LÀM
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