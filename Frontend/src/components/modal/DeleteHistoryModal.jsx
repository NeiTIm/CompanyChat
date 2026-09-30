/* =========================================================
   DELETE HISTORY MODAL
========================================================= */

function DeleteHistoryModal({
  onClose,
  onConfirm,
  loading,
}) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="delete-history-modal"
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >
        <div className="delete-history-icon">
          🗑️
        </div>

        <h3>Xóa lịch sử cuộc trò chuyện?</h3>

        <p>
          Bạn có chắc muốn xóa lịch sử cuộc trò
          chuyện này ở phía bạn?
        </p>

        <p className="delete-warning">
          ⚠️ Lịch sử sẽ chỉ bị ẩn ở phía bạn.
          Người còn lại vẫn có thể xem lịch sử
          cuộc trò chuyện.
        </p>

        <div className="modal-actions">
          <button
            className="cancel-button"
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </button>

          <button
            className="confirm-delete-button"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? "Đang xóa..."
              : "Xóa lịch sử"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteHistoryModal;