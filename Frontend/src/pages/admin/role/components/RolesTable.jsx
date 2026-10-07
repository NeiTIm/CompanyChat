export default function RolesTable({
  roles,
  loading,
  actionLoading,

  onViewRole,
  onEditRole,
  onDeleteRole,
  onManagePermissions,

  canView,
  canUpdate,
  canDelete,
  canAssign,
}) {
  if (loading) {
    return (
      <div className="admin-roles-table-wrapper">

        <div className="admin-roles-table-loading">
          <div className="admin-roles-loading-spinner" />

          <span>
            Đang tải danh sách Role...
          </span>
        </div>

      </div>
    );
  }


  if (!roles || roles.length === 0) {
    return (
      <div className="admin-roles-table-wrapper">

        <div className="admin-roles-empty">

          <div className="admin-roles-empty-icon">

            <svg
              viewBox="0 0 24 24"
              width="32"
              height="32"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle
                cx="9"
                cy="7"
                r="4"
              />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>

          </div>

          <h3>
            Không có Role
          </h3>

          <p>
            Không tìm thấy Role phù hợp với điều kiện hiện tại.
          </p>

        </div>

      </div>
    );
  }


  return (
    <div className="admin-roles-table-wrapper">

      <table className="admin-roles-table">

        <thead>

          <tr>

            <th>
              Role
            </th>

            <th>
              Loại
            </th>

            <th>
              Người dùng
            </th>

            <th>
              Permission
            </th>

            <th>
              Ngày tạo
            </th>

            <th className="admin-roles-actions-column">
              Thao tác
            </th>

          </tr>

        </thead>


        <tbody>

          {roles.map(
            (role) => {

              const isSystemRole =
                Boolean(
                  role.isSystemRole
                );

              const userCount =
                Number(
                  role.userCount || 0
                );

              const permissionCount =
                Number(
                  role.permissionCount || 0
                );


              return (
                <tr
                  key={role.id}
                >

                  {/* =========================================
                      ROLE
                  ========================================= */}

                  <td>

                    <div className="admin-role-info">

                      <div className="admin-role-avatar">

                        {role.name
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "R"}

                      </div>


                      <div className="admin-role-text">

                        <div className="admin-role-name">
                          {role.name}
                        </div>

                        <div className="admin-role-description">

                          {role.description ||
                            "Không có mô tả"}

                        </div>

                      </div>

                    </div>

                  </td>


                  {/* =========================================
                      TYPE
                  ========================================= */}

                  <td>

                    {isSystemRole ? (
                      <span className="admin-role-badge system">
                        System Role
                      </span>
                    ) : (
                      <span className="admin-role-badge custom">
                        Custom Role
                      </span>
                    )}

                  </td>


                  {/* =========================================
                      USERS
                  ========================================= */}

                  <td>

                    <div className="admin-role-count">

                      <strong>
                        {userCount}
                      </strong>

                      <span>
                        người dùng
                      </span>

                    </div>

                  </td>


                  {/* =========================================
                      PERMISSIONS
                  ========================================= */}

                  <td>

                    <div className="admin-role-count">

                      <strong>
                        {permissionCount}
                      </strong>

                      <span>
                        quyền
                      </span>

                    </div>

                  </td>


                  {/* =========================================
                      CREATED
                  ========================================= */}

                  <td>

                    <span className="admin-role-created">

                      {role.createdAt
                        ? new Date(
                            role.createdAt
                          ).toLocaleDateString(
                            "vi-VN"
                          )
                        : "—"}

                    </span>

                  </td>


                  {/* =========================================
                      ACTIONS
                  ========================================= */}

                  <td>

                    <div className="admin-role-actions">

                      {/* VIEW */}

                      {canView && (
                        <button
                          type="button"
                          className="admin-role-action-button view"
                          onClick={() =>
                            onViewRole(
                              role.id
                            )
                          }
                          disabled={
                            actionLoading
                          }
                          title="Xem chi tiết"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="17"
                            height="17"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path
                              d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r="2.5"
                            />
                          </svg>
                        </button>
                      )}


                      {/* EDIT */}

                      {canUpdate && (
                        <button
                          type="button"
                          className="admin-role-action-button edit"
                          onClick={() =>
                            onEditRole(
                              role.id
                            )
                          }
                          disabled={
                            actionLoading
                          }
                          title={
                            isSystemRole
                              ? "Chỉnh sửa mô tả"
                              : "Chỉnh sửa Role"
                          }
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="17"
                            height="17"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                          </svg>
                        </button>
                      )}


                      {/* PERMISSION */}

                      {canAssign && (
                        <button
                          type="button"
                          className="admin-role-action-button permission"
                          onClick={() =>
                            onManagePermissions(
                              role.id
                            )
                          }
                          disabled={
                            actionLoading
                          }
                          title="Quản lý Permission"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="17"
                            height="17"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 2v20" />
                            <path d="M2 12h20" />
                            <circle
                              cx="12"
                              cy="12"
                              r="8"
                            />
                          </svg>
                        </button>
                      )}


                      {/* DELETE */}

                      {canDelete &&
                        !isSystemRole && (
                          <button
                            type="button"
                            className="admin-role-action-button delete"
                            onClick={() =>
                              onDeleteRole(
                                role
                              )
                            }
                            disabled={
                              actionLoading ||
                              userCount > 0
                            }
                            title={
                              userCount > 0
                                ? "Role đang được sử dụng"
                                : "Xóa Role"
                            }
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="17"
                              height="17"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v5" />
                              <path d="M14 11v5" />
                            </svg>
                          </button>
                        )}

                    </div>

                  </td>

                </tr>
              );
            }
          )}

        </tbody>

      </table>

    </div>
  );
}