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

        <h3>Xóa toàn bộ lịch sử?</h3>

        <p>
          Bạn có chắc muốn xóa toàn bộ lịch sử của
          cuộc trò chuyện này?
        </p>

        <p className="delete-warning">
          ⚠️ Hành động này sẽ xóa toàn bộ tin nhắn
          trong cuộc trò chuyện.
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