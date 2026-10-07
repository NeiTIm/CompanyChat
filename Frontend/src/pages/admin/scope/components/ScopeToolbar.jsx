/* =========================================================
   SCOPE TOOLBAR
========================================================= */

function ScopeToolbar({
  search = "",
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
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
            onChange={(event) => {
              onSearchChange?.(
                event.target.value
              );
            }}
            placeholder="Tìm theo tên, username hoặc email..."
            disabled={loading}
          />

          {search && (
            <button
              type="button"
              className="scope-search-clear"
              onClick={onClearSearch}
              disabled={loading}
              aria-label="Xóa tìm kiếm"
            >
              ×
            </button>
          )}

        </div>


        {/* =================================================
            SEARCH BUTTON
        ================================================= */}

        <button
          type="submit"
          className="scope-search-button"
          disabled={loading}
        >
          Tìm kiếm
        </button>

      </form>

    </div>
  );
}

export default ScopeToolbar;