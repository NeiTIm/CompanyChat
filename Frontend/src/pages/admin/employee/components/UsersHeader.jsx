import {
  PlusIcon,
  RefreshIcon,
} from "./UsersIcons";

export default function UsersHeader({
  loading,
  isDeleted,
  onRefresh,
  onCreate,
}) {
  return (
    <div className="admin-users-header">
      <div className="admin-users-heading">
        <div className="admin-users-title-row">
          <div className="admin-users-title-icon">
            <svg
              viewBox="0 0 24 24"
              width="19"
              height="19"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>

          <div>
            <h1>Employees</h1>

            <p>
              Quản lý tài khoản và nhân sự
              trong hệ thống
            </p>
          </div>
        </div>
      </div>

      <div className="admin-users-header-actions">
        <button
          type="button"
          className="admin-refresh-button"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshIcon />

          <span>
            {loading
              ? "Đang tải..."
              : "Làm mới"}
          </span>
        </button>

        {!isDeleted && (
          <button
            type="button"
            className="admin-create-button"
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