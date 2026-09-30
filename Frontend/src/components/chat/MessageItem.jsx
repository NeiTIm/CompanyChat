import Avatar from "../common/Avatar";
import DeliveryStatus from "./DeliveryStatus";

import { formatTime } from "../../utils/dateUtils";
import { getDeliveryStatus } from "../../utils/messageUtils";
/* =========================================================
   MESSAGE ITEM
========================================================= */

function MessageItem({
  message,
  currentUser,
  onDelete,
}) {
  const isMine =
    Number(message.senderId) ===
    Number(currentUser.id);

  const deliveryStatus = isMine
    ? getDeliveryStatus(message)
    : null;

  const isDeleted =
    message.isDeleted === true;

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
          } ${isDeleted ? "deleted" : ""}`}
          onClick={() => {
            if (!message.pending) {
              onDelete(message);
            }
          }}
          title={
            isDeleted
              ? ""
              : "Nhấn để xem tùy chọn"
          }
        >
          {isDeleted ? (
            <span className="deleted-message">
              Tin nhắn đã bị xóa
            </span>
          ) : (
            message.content
          )}
        </button>

        <div
          className={`message-meta ${
            isMine ? "mine" : "other"
          }`}
        >
          <span className="message-time">
            {formatTime(message.sentAt)}
          </span>

          {isMine && !isDeleted && (
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