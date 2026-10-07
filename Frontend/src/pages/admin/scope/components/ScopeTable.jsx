import {
  hasPermission,
} from "../../../../utils/permissionUtils";

import {
  EyeIcon,
  EditIcon,
} from "../../employee/components/UsersIcons.jsx";


export default function ScopeTable({
  users = [],
  loading = false,
  canAssignScope = false,
  actionLoading = false,
  onView,
  onEdit,
}) {

  /* =========================================================
     PERMISSIONS
  ========================================================= */

  const canViewScope =
    hasPermission(
      "Scope.View"
    );

  const canAssignScopePermission =
    hasPermission(
      "Scope.Assign"
    );


  /* =========================================================
     FINAL PERMISSIONS
  ========================================================= */

  const canView =
    canViewScope;

  const canEdit =
    canAssignScope &&
    canAssignScopePermission;


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {

    return (
      <div className="admin-scope-loading">
        Đang tải danh sách Scope...
      </div>
    );

  }


  /* =========================================================
     EMPTY
  ========================================================= */

  if (!users || users.length === 0) {

    return (
      <div className="admin-scope-empty">
        Không có người dùng nào.
      </div>
    );

  }


  /* =========================================================
     TABLE
  ========================================================= */

  return (

    <div className="admin-scope-table-wrapper">

      <table className="admin-scope-table">

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
              Managed Departments
            </th>

            <th>
              Thao tác
            </th>

          </tr>

        </thead>


        <tbody>

          {users.map((user) => {

            /* =================================================
               USER DATA
            ================================================= */

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

                {/* =================================================
                    USER
                ================================================= */}

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


                {/* =================================================
                    EMAIL
                ================================================= */}

                <td>

                  <span>
                    {email}
                  </span>

                </td>


                {/* =================================================
                    ROLE
                ================================================= */}

                <td>

                  <span className="admin-scope-role-badge">
                    {role}
                  </span>

                </td>


                {/* =================================================
                    MANAGED DEPARTMENTS
                ================================================= */}

                <td>

                  <div className="admin-scope-departments">

                    {managedDepartments.length > 0 ? (

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
                                  key={
                                    `scope-department-${userId}-${departmentId}`
                                  }
                                  className="admin-scope-department-badge"
                                >
                                  {departmentName}
                                </span>

                              );

                            }
                          )}


                        {managedDepartmentCount > 3 && (

                          <span className="admin-scope-department-more">

                            +
                            {managedDepartmentCount - 3}

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


                {/* =================================================
                    ACTIONS
                ================================================= */}

                <td>

                  <div className="admin-user-actions">

                    {/* =============================================
                        VIEW
                    ============================================= */}

                    {canView && (

                      <button
                        type="button"
                        className="admin-action-button"
                        onClick={() =>
                          onView?.(user)
                        }
                        disabled={
                          actionLoading
                        }
                        title="Xem Scope"
                      >

                        <EyeIcon />

                      </button>

                    )}


                    {/* =============================================
                        EDIT / ASSIGN SCOPE
                    ============================================= */}

                    {canEdit && (

                      <button
                        type="button"
                        className="admin-action-button"
                        onClick={() =>
                          onEdit?.(user)
                        }
                        disabled={
                          actionLoading
                        }
                        title="Chỉnh sửa Scope"
                      >

                        <EditIcon />

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