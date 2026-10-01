import Avatar from "../common/Avatar";
import { formatLastSeen } from "../../utils/dateUtils";

/* =========================================================
   ICONS
========================================================= */

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.5 3.5 9 3l2 5-2.5 1.7a13 13 0 0 0 5.3 5.3l1.7-2.5 5 2-.5 2.5c-.3 1.4-1.6 2.4-3 2.3C10 18.8 5.2 14 3.7 6.5c-.3-1.4.7-2.7 2.1-3Z" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="6"
        width="13"
        height="12"
        rx="2"
      />
      <path d="m16 10 5-3v10l-5-3z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6.5 7 7 20h10l.5-13" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
    >
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}

/* =========================================================
   CHAT HEADER
========================================================= */

function ChatHeader({
  selectedUser,
  websocketConnected,
  onDeleteHistory,
}) {
  const showComingSoon = (feature) => {
    alert(
      `${feature}\n\nTính năng đang phát triển.`
    );
  };

  if (!selectedUser) {
    return null;
  }

  return (
    <div className="chat-header">

      {/* =================================================
          USER
      ================================================= */}

      <div className="chat-header-user">

        <Avatar
          user={selectedUser}
          size="large"
          showStatus
        />

        <div className="chat-header-info">

          <div className="chat-header-name">
            {selectedUser.fullName ||
              selectedUser.username}
          </div>

          <div
            className={`chat-presence ${
              selectedUser.isOnline
                ? "online"
                : "offline"
            }`}
          >
            <span className="presence-dot" />

            {selectedUser.isOnline
              ? "Đang online"
              : formatLastSeen(
                  selectedUser.lastSeen
                )}
          </div>

        </div>

      </div>

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className="chat-header-actions">

        <button
          type="button"
          className="header-action-button"
          onClick={() =>
            showComingSoon(
              "Tìm kiếm tin nhắn"
            )
          }
          title="Tìm kiếm tin nhắn"
          aria-label="Tìm kiếm tin nhắn"
        >
          <SearchIcon />
        </button>

        <button
          type="button"
          className="header-action-button"
          onClick={() =>
            showComingSoon("Gọi thoại")
          }
          title="Gọi thoại"
          aria-label="Gọi thoại"
        >
          <PhoneIcon />
        </button>

        <button
          type="button"
          className="header-action-button"
          onClick={() =>
            showComingSoon("Video call")
          }
          title="Video call"
          aria-label="Video call"
        >
          <VideoIcon />
        </button>

        <div
          className={`realtime-status ${
            websocketConnected
              ? "connected"
              : "disconnected"
          }`}
          title={
            websocketConnected
              ? "WebSocket đang kết nối"
              : "WebSocket đã mất kết nối"
          }
        >
          <span className="realtime-dot" />

          <span>
            {websocketConnected
              ? "Realtime"
              : "Mất kết nối"}
          </span>
        </div>

        <button
          type="button"
          className="header-delete-button"
          onClick={onDeleteHistory}
          title="Xóa lịch sử cuộc trò chuyện"
          aria-label="Xóa lịch sử cuộc trò chuyện"
        >
          <TrashIcon />
        </button>

        <button
          type="button"
          className="header-action-button"
          onClick={() =>
            showComingSoon(
              "Tính năng khác"
            )
          }
          title="Tính năng khác"
          aria-label="Tính năng khác"
        >
          <MoreIcon />
        </button>

      </div>

    </div>
  );
}

export default ChatHeader;