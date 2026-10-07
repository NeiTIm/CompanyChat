import { SearchIcon } from "./UsersIcons";

export default function UsersToolbar({
  search,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,

  departmentId,
  onDepartmentChange,
  departments,

  role,
  onRoleChange,
  roles,

  isActive,
  onStatusChange,

  isDeleted,
  onDeletedChange,
}) {
  const availableRoles =
    Array.isArray(roles)
      ? roles.filter(
          (item) =>
            item &&
            typeof item.name === "string" &&
            item.name.trim() !== ""
        )
      : [];

  return (
    <div className="admin-users-toolbar">
      {/* =====================================================
          SEARCH
      ===================================================== */}

      <form
        className="admin-users-search"
        onSubmit={onSearchSubmit}
      >
        <SearchIcon />

        <input
          type="search"
          value={search}
          onChange={onSearchChange}
          placeholder="Tìm theo tên, username hoặc email..."
          aria-label="Tìm kiếm nhân viên"
        />

        {search && (
          <button
            type="button"
            className="admin-search-clear"
            onClick={onClearSearch}
            aria-label="Xóa tìm kiếm"
          >
            ×
          </button>
        )}
      </form>

      <div className="admin-users-filters">
        {/* =====================================================
            DEPARTMENT
        ===================================================== */}

        <select
          value={departmentId}
          onChange={onDepartmentChange}
          aria-label="Lọc theo phòng ban"
        >
          <option value="">
            Tất cả phòng ban
          </option>

          {Array.isArray(departments) &&
            departments.map((department) => (
              <option
                key={department.id}
                value={department.id}
              >
                {department.name}
              </option>
            ))}
        </select>

        {/* =====================================================
            ROLE
            System Role + Custom Role
        ===================================================== */}

        <select
          value={role}
          onChange={onRoleChange}
          aria-label="Lọc theo role"
        >
          <option value="">
            Tất cả role
          </option>

          {availableRoles.map((item) => (
            <option
              key={item.id ?? item.name}
              value={item.name}
            >
              {item.name}
            </option>
          ))}
        </select>

        {/* =====================================================
            ACCOUNT STATUS
            Hoạt động / Bị khóa
        ===================================================== */}

        <select
          value={isActive}
          onChange={onStatusChange}
          aria-label="Lọc theo trạng thái tài khoản"
          disabled={isDeleted}
        >
          <option value="">
            Tất cả trạng thái tài khoản
          </option>

          <option value="true">
            Đang hoạt động
          </option>

          <option value="false">
            Bị khóa
          </option>
        </select>

        {/* =====================================================
            DELETED STATUS
        ===================================================== */}

        <select
          value={isDeleted ? "true" : "false"}
          onChange={onDeletedChange}
          aria-label="Lọc theo trạng thái xóa"
        >
          <option value="false">
            Nhân viên hiện tại
          </option>

          <option value="true">
            Đã xóa
          </option>
        </select>
      </div>
    </div>
  );
}