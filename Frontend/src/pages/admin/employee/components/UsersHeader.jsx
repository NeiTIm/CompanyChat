import {
  PlusIcon,
  RefreshIcon,
} from "./UsersIcons";

import {
  hasPermission,
} from "../../../../utils/permissionUtils";


export default function UsersHeader({
  loading,
  isDeleted,
  onRefresh,
  onCreate,
}) {

  /* =========================================================
     PERMISSION
  ========================================================= */

  const canCreateEmployee =
    hasPermission(
      "Employee.Create"
    );


  return (
    <div className="admin-users-header">

      {/* =====================================================
          TITLE
      ===================================================== */}

      <div className="admin-users-header-left">

        <div>
          <h1>
            Nhân viên
          </h1>

          <p>
            Quản lý tài khoản nhân viên
            trong hệ thống.
          </p>
        </div>

      </div>


      {/* =====================================================
          ACTIONS
      ===================================================== */}

      <div className="admin-users-header-actions">

        {/* ===================================================
            REFRESH
        =================================================== */}

        <button
          type="button"
          className="admin-users-refresh"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshIcon />

          <span>
            Làm mới
          </span>
        </button>


        {/* ===================================================
            CREATE EMPLOYEE

            Chỉ hiện khi:
            Employee.Create
        =================================================== */}

        {!isDeleted &&
          canCreateEmployee && (
            <button
              type="button"
              className="admin-users-create"
              onClick={onCreate}
            >
              <PlusIcon />

              <span>
                Thêm nhân viên
              </span>
            </button>
          )}

      </div>

    </div>
  );
}