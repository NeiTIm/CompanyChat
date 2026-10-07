export default function RolesHeader({
  loading,
  onRefresh,
  onCreate,
  canCreate,
}) {
  return (
    <div className="admin-roles-header">

      <div className="admin-roles-header-left">

        <div className="admin-roles-title-wrapper">

          <h1 className="admin-roles-title">
            Quản lý Role
          </h1>

          <p className="admin-roles-subtitle">
            Quản lý vai trò và quyền truy cập trong hệ thống.
          </p>

        </div>

      </div>


      <div className="admin-roles-header-actions">

        <button
          type="button"
          className="admin-roles-refresh-button"
          onClick={onRefresh}
          disabled={loading}
          title="Làm mới"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />
            <path d="M4 5v4h4" />
            <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />
            <path d="M20 19v-4h-4" />
          </svg>

          <span>
            Làm mới
          </span>
        </button>


        {canCreate && (
          <button
            type="button"
            className="admin-roles-create-button"
            onClick={onCreate}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>

            <span>
              Thêm Role
            </span>
          </button>
        )}

      </div>

    </div>
  );
}