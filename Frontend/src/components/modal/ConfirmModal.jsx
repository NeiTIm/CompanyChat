

export default function ConfirmModal({
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <div
      className="admin-confirm-overlay"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="admin-confirm-modal"
        onClick={(event) => event.stopPropagation()}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="admin-confirm-header">
          <div
            className={`admin-confirm-icon ${
              danger ? "danger" : "warning"
            }`}
          >
            {danger ? "!" : "?"}
          </div>

          <div className="admin-confirm-title-wrapper">
            <h2>{title}</h2>
          </div>

          <button
            type="button"
            className="admin-confirm-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="admin-confirm-content">
          <p>{message}</p>
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="admin-confirm-footer">
          <button
            type="button"
            className="admin-confirm-btn admin-confirm-cancel"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`admin-confirm-btn ${
              danger
                ? "admin-confirm-danger"
                : "admin-confirm-primary"
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}