export default function RolesToolbar({
  search,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,

  systemOnly,
  onSystemFilterChange,

  roleName,
  onRoleNameChange,
  roles = [],
}) {
  const hasSearch =
    Boolean(search?.trim());

  const availableRoles =
    Array.isArray(roles)
      ? roles.filter(
          (role) =>
            role &&
            typeof role.name === "string" &&
            role.name.trim() !== ""
        )
      : [];

  return (
    <div className="admin-roles-toolbar">

      {/* =================================================
          SEARCH
      ================================================= */}

      <form
        className="admin-roles-search"
        onSubmit={onSearchSubmit}
      >

        <div className="admin-roles-search-input-wrapper">

          <svg
            className="admin-roles-search-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
            />

            <path d="m20 20-4-4" />
          </svg>


          <input
            type="text"
            value={search}
            onChange={onSearchChange}
            placeholder="Tìm kiếm role..."
            className="admin-roles-search-input"
          />


          {hasSearch && (
            <button
              type="button"
              className="admin-roles-search-clear"
              onClick={onClearSearch}
              title="Xóa tìm kiếm"
            >
              ×
            </button>
          )}

        </div>


        <button
          type="submit"
          className="admin-roles-search-button"
        >
          Tìm kiếm
        </button>

      </form>


      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="admin-roles-filters">

        {/* =================================================
            ROLE TYPE
        ================================================= */}

        <select
          value={systemOnly}
          onChange={onSystemFilterChange}
          className="admin-roles-filter-select"
          aria-label="Lọc loại Role"
        >
          <option value="">
            Tất cả loại
          </option>

          <option value="true">
            System Role
          </option>

          <option value="false">
            Custom Role
          </option>

        </select>


        {/* =================================================
            ROLE NAME
        ================================================= */}

        <select
          value={roleName}
          onChange={onRoleNameChange}
          className="admin-roles-filter-select"
          aria-label="Lọc theo Role"
        >
          <option value="">
            Tất cả Role
          </option>

          {availableRoles.map(
            (role) => (
              <option
                key={
                  role.id ??
                  role.name
                }
                value={role.name}
              >
                {role.name}
              </option>
            )
          )}

        </select>

      </div>

    </div>
  );
}