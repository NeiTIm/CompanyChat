import {
  BuildingIcon,
  EditIcon,
  EyeIcon,
  KeyIcon,
  LockIcon,
  RestoreIcon,
  TrashIcon,
  UnlockIcon,
} from "./UsersIcons";

import {
  getInitial,
} from "../utils/userHelpers";

export default function UsersTable({
  users,
  loading,
  isDeleted,
  currentUser,
  actionLoading,

  onViewUser,
  onEditUser,
  onAssignDepartment,
  onResetPassword,
  onToggleActive,
  onDeleteUser,
  onRestoreUser,
  onChangeRole,
}) {
  return (
    <div className="admin-users-table-wrapper">
      {loading ? (
        <div className="admin-users-loading">
          <div className="admin-loading-spinner" />

          <span>
            Đang tải danh sách nhân viên...
          </span>
        </div>
      ) : users.length === 0 ? (
        <div className="admin-users-empty">
          <div className="admin-empty-icon">
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle
                cx="9"
                cy="8"
                r="4"
              />

              <path d="M3 21a6 6 0 0 1 12 0" />

              <path d="M16 11h5" />

              <path d="M18.5 8.5v5" />
            </svg>
          </div>

          <strong>
            {isDeleted
              ? "Không có nhân viên đã xóa"
              : "Không tìm thấy nhân viên"}
          </strong>

          <span>
            {isDeleted
              ? "Hiện không có tài khoản nào đã bị xóa."
              : "Thử thay đổi từ khóa hoặc bộ lọc."}
          </span>
        </div>
      ) : (
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
              <th>Online</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => {
              const isCurrentUser =
                Number(currentUser?.id) ===
                Number(user.id);

              return (
                <tr
                  key={user.id}
                  className={
                    isCurrentUser
                      ? "is-current-user"
                      : ""
                  }
                >
                  {/* EMPLOYEE */}
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-user-avatar">
                        {getInitial(user)}

                        {user.isOnline && (
                          <span className="admin-avatar-online-dot" />
                        )}
                      </div>

                      <div className="admin-user-info">
                        <div className="admin-user-name-row">
                          <strong>
                            {user.fullName ||
                              user.username}
                          </strong>

                          {isCurrentUser && (
                            <span className="admin-current-badge">
                              Bạn
                            </span>
                          )}
                        </div>

                        <span>
                          @{user.username}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* EMAIL */}
                  <td>
                    <span className="admin-user-email">
                      {user.email}
                    </span>
                  </td>

                  {/* DEPARTMENT */}
                  <td>
                    <div className="admin-department-cell">
                      <span className="admin-department-icon">
                        <BuildingIcon />
                      </span>

                      <span>
                        {user.departmentName ||
                          "Chưa phân phòng ban"}
                      </span>
                    </div>
                  </td>

                  {/* ROLE */}
                  <td>
                    <div
                      className={`admin-role-control ${
                        user.role === "Admin"
                          ? "role-admin"
                          : "role-employee"
                      }`}
                    >
                      <span className="admin-role-dot" />

                      <select
                        value={user.role}
                        onChange={(event) =>
                          onChangeRole(
                            user,
                            event.target.value
                          )
                        }
                        disabled={
                          actionLoading ||
                          isCurrentUser ||
                          isDeleted
                        }
                        aria-label={`Role của ${user.fullName}`}
                      >
                        <option value="Employee">
                          Employee
                        </option>

                        <option value="Admin">
                          Admin
                        </option>
                      </select>
                    </div>
                  </td>

                  {/* STATUS */}
                  <td>
                    <span
                      className={`admin-user-status ${
                        user.isActive
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      <span className="admin-status-dot" />

                      {user.isActive
                        ? "Hoạt động"
                        : "Bị khóa"}
                    </span>
                  </td>

                  {/* ONLINE */}
                  <td>
                    <div
                      className={`admin-user-online ${
                        user.isOnline
                          ? "online"
                          : "offline"
                      }`}
                    >
                      <span className="admin-online-dot" />

                      <span>
                        {user.isOnline
                          ? "Online"
                          : "Offline"}
                      </span>
                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td>
                    <div className="admin-user-actions">
                      {/* VIEW */}
                      <button
                        type="button"
                        className="action-view"
                        onClick={() =>
                          onViewUser(user.id)
                        }
                        title="Xem thông tin"
                      >
                        <EyeIcon />

                        <span>
                          Xem
                        </span>
                      </button>

                      {!isDeleted ? (
                        <>
                          {/* EDIT */}
                          <button
                            type="button"
                            className="action-edit"
                            onClick={() =>
                              onEditUser(user.id)
                            }
                            title="Chỉnh sửa"
                          >
                            <EditIcon />

                            <span>
                              Sửa
                            </span>
                          </button>

                          {/* DEPARTMENT */}
                          <button
                            type="button"
                            className="action-department"
                            onClick={() =>
                              onAssignDepartment(user)
                            }
                            title="Phân phòng ban"
                          >
                            <BuildingIcon />

                            <span>
                              Phòng ban
                            </span>
                          </button>

                          {/* RESET PASSWORD */}
                          <button
                            type="button"
                            className="action-password"
                            onClick={() =>
                              onResetPassword(user)
                            }
                            title="Reset mật khẩu"
                          >
                            <KeyIcon />

                            <span>
                              Reset PW
                            </span>
                          </button>

                          {/* ACTIVE / INACTIVE */}
                          <button
                            type="button"
                            className={`action-active ${
                              user.isActive
                                ? "lock"
                                : "unlock"
                            }`}
                            onClick={() =>
                              onToggleActive(user)
                            }
                            disabled={
                              actionLoading ||
                              isCurrentUser
                            }
                            title={
                              user.isActive
                                ? "Khóa tài khoản"
                                : "Mở khóa tài khoản"
                            }
                          >
                            {user.isActive ? (
                              <LockIcon />
                            ) : (
                              <UnlockIcon />
                            )}

                            <span>
                              {user.isActive
                                ? "Khóa"
                                : "Mở"}
                            </span>
                          </button>

                          {/* DELETE */}
                          <button
                            type="button"
                            className="action-delete"
                            onClick={() =>
                              onDeleteUser(user)
                            }
                            disabled={
                              actionLoading ||
                              isCurrentUser
                            }
                            title="Xóa tài khoản"
                          >
                            <TrashIcon />

                            <span>
                              Xóa
                            </span>
                          </button>
                        </>
                      ) : (
                        /* RESTORE */
                        <button
                          type="button"
                          className="action-active unlock"
                          onClick={() =>
                            onRestoreUser(user)
                          }
                          disabled={
                            actionLoading
                          }
                          title="Khôi phục nhân viên"
                        >
                          <RestoreIcon />

                          <span>
                            Khôi phục
                          </span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}