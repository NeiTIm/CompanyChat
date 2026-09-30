import Avatar from "../common/Avatar";
import DeliveryStatus from "./DeliveryStatus";

import { formatTime } from "../../utils/dateUtils";
import { getDeliveryStatus } from "../../utils/messageUtils";

function MessageItem({
  message,
  currentUser,
  onDelete,
  onReply,
}) {
  const isMine =
    Number(message.senderId) ===
    Number(currentUser.id);

  const deliveryStatus = isMine
    ? getDeliveryStatus(message)
    : null;

  const isDeleted =
    message.isDeleted === true;

  const isDeletedByHistory =
    message.isDeletedByHistory === true;

  const showDeletedPlaceholder =
    isDeleted ||
    isDeletedByHistory;

  let deletedText =
    "Tin nhắn đã bị xóa";

  if (isDeletedByHistory && isMine) {
    deletedText =
      "Bạn đã xóa tin nhắn";
  }

  return (
    <div
      className={`message-row ${
        isMine ? "mine" : "other"
      }`}
    >
      {!isMine && (
        <Avatar
          user={{
            fullName:
              message.senderName || "?",
          }}
          size="small"
        />
      )}

      <div className="message-column">
        <button
          type="button"
          className={`message-bubble ${
            isMine ? "mine" : "other"
          } ${
            showDeletedPlaceholder
              ? "deleted"
              : ""
          }`}
          onClick={() => {
            if (
              !message.pending &&
              !showDeletedPlaceholder
            ) {
              onDelete(message);
            }
          }}
          title={
            showDeletedPlaceholder
              ? ""
              : "Nhấn để xem tùy chọn"
          }
        >
          {showDeletedPlaceholder ? (
            <span className="deleted-message">
              {deletedText}
            </span>
          ) : (
            <>
              {message.replyTo && (
                <div className="reply-preview">
                  <div className="reply-preview-name">
                    {message.replyTo.senderName}
                  </div>

                  <div className="reply-preview-content">
                    {message.replyTo.content}
                  </div>
                </div>
              )}

              <div className="message-content">
                {message.content}
              </div>
            </>
          )}
        </button>

        {!showDeletedPlaceholder &&
          !message.pending && (
            <button
              type="button"
              className="reply-button"
              onClick={() => onReply(message)}
              title="Trả lời tin nhắn"
            >
              ↩
            </button>
          )}

        <div
          className={`message-meta ${
            isMine ? "mine" : "other"
          }`}
        >
          <span className="message-time">
            {formatTime(message.sentAt)}
          </span>

          {isMine &&
            !showDeletedPlaceholder && (
              <DeliveryStatus
                status={deliveryStatus}
              />
            )}
        </div>
      </div>
    </div>
  );
}

export default MessageItem;