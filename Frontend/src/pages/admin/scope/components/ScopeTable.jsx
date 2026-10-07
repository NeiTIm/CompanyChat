export default function ScopeTable({
  users = [],
  loading = false,
  canAssignScope = false,
  onView,
  onEdit,
}) {
  return (
    <div className="admin-scope-table-wrapper">
      <table className="admin-scope-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Managed Departments</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (
            <tr key="scope-loading">
              <td
                colSpan={5}
                className="admin-scope-loading"
              >
                Đang tải dữ liệu...
              </td>
            </tr>
          )}

          {/* =================================================
              EMPTY
          ================================================= */}

          {!loading &&
            users.length === 0 && (
              <tr key="scope-empty">
                <td
                  colSpan={5}
                  className="admin-scope-empty"
                >
                  Không có dữ liệu.
                </td>
              </tr>
            )}

          {/* =================================================
              USERS
          ================================================= */}

          {!loading &&
            users.map((user) => {
              const userId =
                user?.userId ??
                user?.UserId ??
                user?.id ??
                user?.Id;

              const fullName =
                user?.fullName ??
                user?.FullName ??
                "Unknown user";

              const email =
                user?.email ??
                user?.Email ??
                "—";

              const role =
                user?.role ??
                user?.Role ??
                "—";

              const managedDepartments =
                user?.managedDepartments ??
                user?.ManagedDepartments ??
                [];

              const managedDepartmentCount =
                user?.managedDepartmentCount ??
                user?.ManagedDepartmentCount ??
                managedDepartments.length;

              return (
                <tr
                  key={`scope-user-${userId}`}
                >
                  {/* =========================================
                      USER
                  ========================================= */}

                  <td>
                    <div className="admin-scope-user">
                      <div className="admin-scope-avatar">
                        {fullName
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="admin-scope-user-info">
                        <div className="admin-scope-user-name">
                          {fullName}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* =========================================
                      EMAIL
                  ========================================= */}

                  <td>
                    <span>
                      {email}
                    </span>
                  </td>

                  {/* =========================================
                      ROLE
                  ========================================= */}

                  <td>
                    <span className="admin-scope-role-badge">
                      {role}
                    </span>
                  </td>

                  {/* =========================================
                      DEPARTMENTS
                  ========================================= */}

                  <td>
                    <div className="admin-scope-departments">
                      {managedDepartments.length >
                      0 ? (
                        <>
                          {managedDepartments
                            .slice(0, 3)
                            .map(
                              (
                                department,
                              ) => {
                                const departmentId =
                                  department?.departmentId ??
                                  department?.DepartmentId ??
                                  department?.id ??
                                  department?.Id;

                                const departmentName =
                                  department?.departmentName ??
                                  department?.DepartmentName ??
                                  department?.name ??
                                  department?.Name ??
                                  "Unknown";

                                return (
                                  <span
                                    key={`scope-department-${userId}-${departmentId}`}
                                    className="admin-scope-department-badge"
                                  >
                                    {
                                      departmentName
                                    }
                                  </span>
                                );
                              },
                            )}

                          {managedDepartmentCount >
                            3 && (
                            <span className="admin-scope-department-more">
                              +
                              {managedDepartmentCount -
                                3}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="admin-scope-no-department">
                          Chưa có Scope
                        </span>
                      )}
                    </div>
                  </td>

                  {/* =========================================
                      ACTIONS
                  ========================================= */}

                  <td>
                    <div className="scope-action-column">
                      <button
                        type="button"
                        className="admin-scope-view-button"
                        onClick={() =>
                          onView?.(
                            user,
                          )
                        }
                      >
                        Xem
                      </button>

                      {canAssignScope && (
                        <button
                          type="button"
                          className="admin-scope-edit-button"
                          onClick={() =>
                            onEdit?.(
                              user,
                            )
                          }
                        >
                          Sửa
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