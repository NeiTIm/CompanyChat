export default function RolesToolbar({
  search,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  systemOnly,
  onSystemFilterChange,
}) {
  const hasSearch =
    Boolean(search?.trim());

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

            <path
              d="m20 20-4-4"
            />
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
          FILTER
      ================================================= */}

      <div className="admin-roles-filters">

        <select
          value={systemOnly}
          onChange={
            onSystemFilterChange
          }
          className="admin-roles-filter-select"
        >
          <option value="">
            Tất cả Role
          </option>

          <option value="true">
            System Role
          </option>

          <option value="false">
            Custom Role
          </option>

        </select>

      </div>

    </div>
  );
}