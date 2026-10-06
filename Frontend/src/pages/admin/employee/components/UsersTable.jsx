import {
  hasPermission,
} from "../../../../utils/permissionUtils";

import {
  EyeIcon,
  EditIcon,
  BuildingIcon,
  LockIcon,
  UnlockIcon,
  KeyIcon,
  TrashIcon,
  RestoreIcon,
} from "./UsersIcons";


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

  /* =========================================================
     PERMISSIONS
  ========================================================= */

  const canViewEmployee =
    hasPermission(
      "Employee.View"
    );

  const canUpdateEmployee =
    hasPermission(
      "Employee.Update"
    );

  const canAssignDepartment =
    hasPermission(
      "Employee.AssignDepartment"
    );

  const canResetPassword =
    hasPermission(
      "Employee.ResetPassword"
    );

  const canLockEmployee =
    hasPermission(
      "Employee.Lock"
    );

  const canDeleteEmployee =
    hasPermission(
      "Employee.Delete"
    );

  const canRestoreEmployee =
    hasPermission(
      "Employee.Restore"
    );

  const canAssignRole =
    hasPermission(
      "Role.Assign"
    );


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="admin-users-loading">
        Đang tải danh sách nhân viên...
      </div>
    );
  }


  /* =========================================================
     EMPTY
  ========================================================= */

  if (!users || users.length === 0) {
    return (
      <div className="admin-users-empty">
        Không có nhân viên nào.
      </div>
    );
  }


  /* =========================================================
     TABLE
  ========================================================= */

  return (
    <div className="admin-users-table-wrapper">

      <table className="admin-users-table">

        <thead>
          <tr>

            <th>
              Nhân viên
            </th>

            <th>
              Email
            </th>

            <th>
              Phòng ban
            </th>

            <th>
              Role
            </th>

            <th>
              Trạng thái
            </th>

            <th>
              Online
            </th>

            <th>
              Thao tác
            </th>

          </tr>
        </thead>


        <tbody>

          {users.map((user) => {

            const isCurrentUser =
              Number(currentUser?.id) ===
              Number(user.id);


            return (
              <tr key={user.id}>

                {/* =================================================
                    EMPLOYEE
                ================================================= */}

                <td>

                  <div className="admin-user-info">

                    <div className="admin-user-avatar">
                      {(user.fullName ||
                        user.username ||
                        "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>

                      <div className="admin-user-name">
                        {user.fullName ||
                          user.username}
                      </div>

                      <div className="admin-user-username">
                        @{user.username}
                      </div>

                    </div>

                  </div>

                </td>


                {/* =================================================
                    EMAIL
                ================================================= */}

                <td>
                  {user.email || "—"}
                </td>


                {/* =================================================
                    DEPARTMENT
                ================================================= */}

                <td>

                  {user.departmentName ? (
                    <span>
                      {user.departmentName}
                    </span>
                  ) : (
                    <span>
                      Chưa có
                    </span>
                  )}

                </td>


                {/* =================================================
                    ROLE
                ================================================= */}

                <td>

                  {canAssignRole ? (

                    <div
                      className={
                        `admin-role-control ${
                          user.role === "Admin"
                            ? "role-admin"
                            : "role-employee"
                        }`
                      }
                    >

                      <span className="admin-role-dot" />

                      <select
                        value={
                          user.role || "Employee"
                        }
                        onChange={(event) =>
                          onChangeRole(
                            user,
                            event.target.value
                          )
                        }
                        disabled={
                          actionLoading ||
                          isCurrentUser
                        }
                      >

                        <option value="Admin">
                          Admin
                        </option>

                        <option value="HR">
                          HR
                        </option>

                        <option value="Department Manager">
                          Department Manager
                        </option>

                        <option value="Support">
                          Support
                        </option>

                        <option value="Employee">
                          Employee
                        </option>

                      </select>

                    </div>

                  ) : (

                    <div
                      className={
                        `admin-role-control ${
                          user.role === "Admin"
                            ? "role-admin"
                            : "role-employee"
                        }`
                      }
                    >

                      <span className="admin-role-dot" />

                      <span>
                        {user.role || "Employee"}
                      </span>

                    </div>

                  )}

                </td>


                {/* =================================================
                    ACTIVE STATUS
                ================================================= */}

                <td>

                  {user.isActive ? (
                    <span className="admin-status active">
                      Hoạt động
                    </span>
                  ) : (
                    <span className="admin-status inactive">
                      Đã khóa
                    </span>
                  )}

                </td>


                {/* =================================================
                    ONLINE
                ================================================= */}

                <td>

                  {user.isOnline ? (
                    <span className="admin-online-status online">
                      <span className="admin-online-dot" />
                      Online
                    </span>
                  ) : (
                    <span className="admin-online-status offline">
                      <span className="admin-online-dot" />
                      Offline
                    </span>
                  )}

                </td>


                {/* =================================================
                    ACTIONS
                ================================================= */}

                <td>

                  <div className="admin-user-actions">

                    {/* =============================================
                        VIEW
                    ============================================= */}

                    {canViewEmployee && (
                      <button
                        type="button"
                        className="admin-action-button"
                        onClick={() =>
                          onViewUser(user.id)
                        }
                        disabled={
                          actionLoading
                        }
                        title="Xem thông tin"
                      >
                        <EyeIcon />
                      </button>
                    )}


                    {/* =============================================
                        EDIT
                    ============================================= */}

                    {!isDeleted &&
                      canUpdateEmployee && (
                        <button
                          type="button"
                          className="admin-action-button"
                          onClick={() =>
                            onEditUser(user.id)
                          }
                          disabled={
                            actionLoading
                          }
                          title="Chỉnh sửa"
                        >
                          <EditIcon />
                        </button>
                      )}


                    {/* =============================================
                        ASSIGN DEPARTMENT
                    ============================================= */}

                    {!isDeleted &&
                      canAssignDepartment && (
                        <button
                          type="button"
                          className="admin-action-button"
                          onClick={() =>
                            onAssignDepartment(
                              user
                            )
                          }
                          disabled={
                            actionLoading
                          }
                          title="Phòng ban"
                        >
                          <BuildingIcon />
                        </button>
                      )}


                    {/* =============================================
                        RESET PASSWORD
                    ============================================= */}

                    {!isDeleted &&
                      canResetPassword && (
                        <button
                          type="button"
                          className="admin-action-button"
                          onClick={() =>
                            onResetPassword(
                              user
                            )
                          }
                          disabled={
                            actionLoading
                          }
                          title="Reset mật khẩu"
                        >
                          <KeyIcon />
                        </button>
                      )}


                    {/* =============================================
                        LOCK / UNLOCK
                    ============================================= */}

                    {!isDeleted &&
                      canLockEmployee && (
                        <button
                          type="button"
                          className="admin-action-button"
                          onClick={() =>
                            onToggleActive(
                              user
                            )
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

                        </button>
                      )}


                    {/* =============================================
                        DELETE
                    ============================================= */}

                    {!isDeleted &&
                      canDeleteEmployee && (
                        <button
                          type="button"
                          className="admin-action-button danger"
                          onClick={() =>
                            onDeleteUser(
                              user
                            )
                          }
                          disabled={
                            actionLoading ||
                            isCurrentUser
                          }
                          title="Xóa nhân viên"
                        >
                          <TrashIcon />
                        </button>
                      )}


                    {/* =============================================
                        RESTORE
                    ============================================= */}

                    {isDeleted &&
                      canRestoreEmployee && (
                        <button
                          type="button"
                          className="admin-action-button"
                          onClick={() =>
                            onRestoreUser(
                              user
                            )
                          }
                          disabled={
                            actionLoading
                          }
                          title="Khôi phục"
                        >
                          <RestoreIcon />
                        </button>
                      )}

                  </div>

                </td>

              </tr>
            );

          })}

        </tbody>

      </table>

    </div>
  );
}