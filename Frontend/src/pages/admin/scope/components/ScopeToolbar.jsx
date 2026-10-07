/* =========================================================
   SCOPE TOOLBAR
========================================================= */

function ScopeToolbar({
  search = "",
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  pageSize = 20,
  onPageSizeChange,
  onRefresh,
  loading = false,
}) {
  return (
    <div className="scope-toolbar">
      {/* =================================================
          SEARCH
      ================================================= */}

      <form
        className="scope-toolbar-search"
        onSubmit={(event) => {
          event.preventDefault();
          onSearchSubmit?.(event);
        }}
      >
        <div className="scope-search">
          <span className="scope-search-icon">
            🔍
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              onSearchChange?.(
                event.target.value
              )
            }
            placeholder="Tìm theo tên, username hoặc email..."
            disabled={loading}
          />

          {search && (
            <button
              type="button"
              className="scope-search-clear"
              onClick={
                onClearSearch
              }
              disabled={loading}
              aria-label="Xóa tìm kiếm"
            >
              ×
            </button>
          )}
        </div>

        <button
          type="submit"
          className="scope-search-button"
          disabled={loading}
        >
          Tìm kiếm
        </button>
      </form>

      {/* =================================================
          RIGHT
      ================================================= */}

      <div className="scope-toolbar-right">
        <label className="scope-page-size">
          <span>Hiển thị</span>

          <select
            value={pageSize}
            onChange={(event) =>
              onPageSizeChange?.(
                Number(
                  event.target.value
                )
              )
            }
            disabled={loading}
          >
            <option value={10}>
              10
            </option>

            <option value={20}>
              20
            </option>

            <option value={50}>
              50
            </option>

            <option value={100}>
              100
            </option>
          </select>
        </label>

        {onRefresh && (
          <button
            type="button"
            className="scope-toolbar-refresh"
            onClick={
              onRefresh
            }
            disabled={loading}
            title="Làm mới"
          >
            ↻
          </button>
        )}
      </div>
    </div>
  );
}

export default ScopeToolbar;