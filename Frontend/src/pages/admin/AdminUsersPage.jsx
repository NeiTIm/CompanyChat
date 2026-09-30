import { useEffect, useState } from "react";

import {
  getAdminUsers,
  getAdminUser,
  updateUserActive,
  updateUserRole,
  deleteAdminUser,
} from "../../services/admin/adminUserService";

function AdminUsersPage({ currentUser }) {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  // =========================================================
  // LOAD USERS
  // =========================================================

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminUsers();

      setUsers(data);
    } catch (error) {
      console.error(
        "Không thể tải users:",
        error
      );

      setError(
        "Không thể tải danh sách người dùng."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // VIEW USER DETAIL
  // =========================================================

  async function handleViewUser(id) {
    try {
      setDetailLoading(true);

      const user = await getAdminUser(id);

      setSelectedUser(user);
    } catch (error) {
      console.error(
        "Không thể tải thông tin user:",
        error
      );

      alert(
        "Không thể tải thông tin người dùng."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  // =========================================================
  // ACTIVE / INACTIVE
  // =========================================================

  async function handleToggleActive(user) {
    const newActive =
      !user.isActive;

    try {
      setActionLoading(true);

      await updateUserActive(
        user.id,
        newActive
      );

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                isActive: newActive,
              }
            : item
        )
      );

      if (
        selectedUser?.id === user.id
      ) {
        setSelectedUser((current) => ({
          ...current,
          isActive: newActive,
        }));
      }
    } catch (error) {
      console.error(
        "Không thể cập nhật trạng thái:",
        error
      );

      alert(
        "Không thể cập nhật trạng thái tài khoản."
      );
    } finally {
      setActionLoading(false);
    }
  }

  // =========================================================
  // CHANGE ROLE
  // =========================================================

  async function handleChangeRole(user) {
    const newRole =
      user.role === "Admin"
        ? "Employee"
        : "Admin";

    const confirmed = window.confirm(
      `Bạn có chắc muốn đổi ${user.fullName} thành ${newRole}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);

      await updateUserRole(
        user.id,
        newRole
      );

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                role: newRole,
              }
            : item
        )
      );

      if (
        selectedUser?.id === user.id
      ) {
        setSelectedUser((current) => ({
          ...current,
          role: newRole,
        }));
      }
    } catch (error) {
      console.error(
        "Không thể thay đổi role:",
        error
      );

      alert(
        "Không thể thay đổi quyền người dùng."
      );
    } finally {
      setActionLoading(false);
    }
  }

  // =========================================================
  // DELETE USER
  // =========================================================

  async function handleDeleteUser(user) {
    // Không cho Admin tự xóa mình
    if (
      user.id === currentUser.id
    ) {
      alert(
        "Bạn không thể tự xóa tài khoản Admin đang đăng nhập."
      );

      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa user "${user.fullName}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);

      await deleteAdminUser(
        user.id
      );

      setUsers((current) =>
        current.filter(
          (item) =>
            item.id !== user.id
        )
      );

      if (
        selectedUser?.id === user.id
      ) {
        setSelectedUser(null);
      }
    } catch (error) {
      console.error(
        "Không thể xóa user:",
        error
      );

      alert(
        "Không thể xóa người dùng."
      );
    } finally {
      setActionLoading(false);
    }
  }

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredUsers =
    users.filter((user) => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return true;
      }

      return (
        user.fullName
          ?.toLowerCase()
          .includes(keyword) ||
        user.username
          ?.toLowerCase()
          .includes(keyword) ||
        user.email
          ?.toLowerCase()
          .includes(keyword)
      );
    });

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="admin-users-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="admin-users-toolbar">

        <div>
          <h2>
            Users
          </h2>

          <p>
            Quản lý tài khoản người dùng
          </p>
        </div>

        <button
          className="admin-refresh-button"
          onClick={loadUsers}
          disabled={loading}
        >
          ↻ Làm mới
        </button>

      </div>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="admin-users-search">

        <input
          type="text"
          placeholder="Tìm theo tên, username hoặc email..."
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
        />

        <span>
          {filteredUsers.length} users
        </span>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="admin-error">

          <span>
            {error}
          </span>

          <button
            onClick={loadUsers}
          >
            Thử lại
          </button>

        </div>
      )}

      {/* =====================================================
          USERS TABLE
      ===================================================== */}

      <div className="admin-users-table-wrapper">

        <table className="admin-users-table">

          <thead>
            <tr>
              <th>
                User
              </th>

              <th>
                Email
              </th>

              <th>
                Role
              </th>

              <th>
                Status
              </th>

              <th>
                Online
              </th>

              <th>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>

            {/* LOADING */}

            {loading && (
              <tr>
                <td
                  colSpan="6"
                  className="admin-table-empty"
                >
                  Đang tải users...
                </td>
              </tr>
            )}

            {/* EMPTY */}

            {!loading &&
              filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="admin-table-empty"
                  >
                    Không tìm thấy user.
                  </td>
                </tr>
              )}

            {/* DATA */}

            {!loading &&
              filteredUsers.length > 0 &&
              filteredUsers.map(
                (user) => (
                  <tr key={user.id}>

                    {/* =====================
                        USER
                    ====================== */}

                    <td>

                      <div className="admin-user-cell">

                        <div className="admin-user-avatar">

                          {(
                            user.fullName ||
                            user.username ||
                            "U"
                          )
                            .charAt(0)
                            .toUpperCase()}

                        </div>

                        <div>

                          <strong>
                            {user.fullName}
                          </strong>

                          <span>
                            @{user.username}
                          </span>

                        </div>

                      </div>

                    </td>

                    {/* =====================
                        EMAIL
                    ====================== */}

                    <td>
                      {user.email}
                    </td>

                    {/* =====================
                        ROLE
                    ====================== */}

                    <td>

                      <span
                        className={
                          user.role === "Admin"
                            ? "admin-role-badge admin"
                            : "admin-role-badge employee"
                        }
                      >
                        {user.role}
                      </span>

                    </td>

                    {/* =====================
                        ACTIVE
                    ====================== */}

                    <td>

                      <span
                        className={
                          user.isActive
                            ? "admin-status-badge active"
                            : "admin-status-badge inactive"
                        }
                      >
                        {user.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>

                    </td>

                    {/* =====================
                        ONLINE
                    ====================== */}

                    <td>

                      <span className="admin-online-status">

                        <span
                          className={
                            user.isOnline
                              ? "online-dot online"
                              : "online-dot"
                          }
                        />

                        {user.isOnline
                          ? "Online"
                          : "Offline"}

                      </span>

                    </td>

                    {/* =====================
                        ACTIONS
                    ====================== */}

                    <td>

                      <div className="admin-user-actions">

                        {/* VIEW */}

                        <button
                          onClick={() =>
                            handleViewUser(
                              user.id
                            )
                          }
                        >
                          Xem
                        </button>

                        {/* ACTIVE */}

                        <button
                          disabled={
                            actionLoading
                          }
                          onClick={() =>
                            handleToggleActive(
                              user
                            )
                          }
                        >
                          {user.isActive
                            ? "Khóa"
                            : "Mở"}
                        </button>

                        {/* ROLE */}

                        <button
                          disabled={
                            actionLoading
                          }
                          onClick={() =>
                            handleChangeRole(
                              user
                            )
                          }
                        >
                          Đổi quyền
                        </button>

                        {/* DELETE */}

                        <button
                          className="danger"
                          disabled={
                            actionLoading ||
                            user.id ===
                              currentUser.id
                          }
                          onClick={() =>
                            handleDeleteUser(
                              user
                            )
                          }
                        >
                          Xóa
                        </button>

                      </div>

                    </td>

                  </tr>
                )
              )}

          </tbody>

        </table>

      </div>

      {/* =====================================================
          USER DETAIL MODAL
      ===================================================== */}

      {selectedUser && (
        <div
          className="admin-modal-overlay"
          onClick={() =>
            setSelectedUser(null)
          }
        >

          <div
            className="admin-user-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* =====================
                MODAL HEADER
            ====================== */}

            <div className="admin-modal-header">

              <div>

                <h2>
                  User Details
                </h2>

                <p>
                  Thông tin tài khoản
                </p>

              </div>

              <button
                onClick={() =>
                  setSelectedUser(null)
                }
              >
                ×
              </button>

            </div>

            {/* =====================
                MODAL BODY
            ====================== */}

            {detailLoading ? (

              <div className="admin-modal-loading">
                Đang tải...
              </div>

            ) : (

              <div className="admin-user-detail">

                {/* AVATAR */}

                <div className="admin-detail-avatar">

                  {(
                    selectedUser.fullName ||
                    selectedUser.username ||
                    "U"
                  )
                    .charAt(0)
                    .toUpperCase()}

                </div>

                {/* NAME */}

                <h3>
                  {selectedUser.fullName}
                </h3>

                {/* USERNAME */}

                <p>
                  @{selectedUser.username}
                </p>

                {/* DETAILS */}

                <div className="admin-detail-list">

                  <div>
                    <span>
                      ID
                    </span>

                    <strong>
                      {selectedUser.id}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Username
                    </span>

                    <strong>
                      {selectedUser.username}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Full Name
                    </span>

                    <strong>
                      {selectedUser.fullName}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Email
                    </span>

                    <strong>
                      {selectedUser.email}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Role
                    </span>

                    <strong>
                      {selectedUser.role}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Trạng thái
                    </span>

                    <strong>
                      {selectedUser.isActive
                        ? "Active"
                        : "Inactive"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Online
                    </span>

                    <strong>
                      {selectedUser.isOnline
                        ? "Online"
                        : "Offline"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Last seen
                    </span>

                    <strong>
                      {selectedUser.lastSeen
                        ? new Date(
                            selectedUser.lastSeen
                          ).toLocaleString(
                            "vi-VN"
                          )
                        : "Chưa có"}
                    </strong>
                  </div>

                </div>

              </div>

            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default AdminUsersPage;