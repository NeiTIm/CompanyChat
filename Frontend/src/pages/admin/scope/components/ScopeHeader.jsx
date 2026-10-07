/* =========================================================
   SCOPE HEADER
========================================================= */

function ScopeHeader({
  title = "Scope Management",
  description = "Quản lý phạm vi Department mà người dùng được phép quản lý.",
  onRefresh,
  loading = false,
}) {
  return (
    <div className="scope-header">
      <div className="scope-header-content">
        {/* =================================================
            TITLE
        ================================================= */}

        <div className="scope-header-info">
          <h2 className="scope-header-title">
            {title}
          </h2>

          <p className="scope-header-description">
            {description}
          </p>
        </div>

        {/* =================================================
            REFRESH
        ================================================= */}

        {onRefresh && (
          <button
            type="button"
            className="scope-header-refresh"
            onClick={onRefresh}
            disabled={loading}
          >
            <span className="scope-header-refresh-icon">
              ↻
            </span>

            <span>
              {loading ? "Đang tải..." : "Làm mới"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ScopeHeader;