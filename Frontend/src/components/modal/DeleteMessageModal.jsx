/* =========================================================
   DELETE MESSAGE MODAL
========================================================= */

function DeleteMessageModal({
  message,
  currentUser,
  onClose,
  onDeleteForMe,
  onDeleteForEveryone,
}) {
  if (!message) {
    return null;
  }

  const isMine =
    Number(message.senderId) ===
    Number(currentUser.id);

  return (
    <div
      className="modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="delete-modal"
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >
        <div className="delete-modal-header">
          <div>
            <div className="delete-modal-icon">
              🗑
            </div>

            <h3>Xóa tin nhắn</h3>

            <p>
              Bạn muốn xóa tin nhắn này như thế nào?
            </p>
          </div>

          <button
            className="delete-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="delete-message-preview">
          “{message.content}”
        </div>

        <div className="delete-options">
          <button
            className="delete-option"
            onClick={onDeleteForMe}
          >
            <span className="delete-option-icon">
              🗑
            </span>

            <span className="delete-option-text">
              <strong>Xóa ở phía tôi</strong>

              <small>
                Chỉ xóa tin nhắn khỏi phía bạn.
              </small>
            </span>

            <span className="delete-arrow">
              ›
            </span>
          </button>

          {isMine && (
            <button
              className="delete-option danger"
              onClick={onDeleteForEveryone}
            >
              <span className="delete-option-icon">
                ✕
              </span>

              <span className="delete-option-text">
                <strong>
                  Xóa với mọi người
                </strong>

                <small>
                  Xóa tin nhắn khỏi cuộc trò chuyện.
                </small>
              </span>

              <span className="delete-arrow">
                ›
              </span>
            </button>
          )}
        </div>

        <button
          className="delete-cancel-button"
          onClick={onClose}
        >
          Hủy
        </button>
      </div>
    </div>
  );
}

export default DeleteMessageModal;