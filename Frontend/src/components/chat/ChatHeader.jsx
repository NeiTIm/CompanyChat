import Avatar from "../common/Avatar";
import { useEffect, useState } from "react";
import { formatLastSeen } from "../../utils/dateUtils";
/* =========================================================
   CHAT HEADER
========================================================= */

function ChatHeader({
  selectedUser,
  websocketConnected,
  onDeleteHistory,
}) {
  const showComingSoon = (feature) => {
    alert(`${feature}\n\nTính năng đang phát triển.`);
  };

  if (!selectedUser) {
    return null;
  }

  return (
    <div className="chat-header">
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
              : formatLastSeen(selectedUser.lastSeen)}
          </div>
        </div>
      </div>

      <div className="chat-header-actions">

        {/* Tìm kiếm */}
        <button
          className="header-action-button"
          onClick={() =>
            showComingSoon("🔍 Tìm kiếm tin nhắn")
          }
          title="Tìm kiếm tin nhắn"
        >
          🔍
        </button>

        {/* Gọi thoại */}
        <button
          className="header-action-button"
          onClick={() =>
            showComingSoon("📞 Gọi thoại")
          }
          title="Gọi thoại"
        >
          📞
        </button>

        {/* Video call */}
        <button
          className="header-action-button"
          onClick={() =>
            showComingSoon("📹 Video call")
          }
          title="Video call"
        >
          📹
        </button>

        {/* Realtime */}
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

        {/* Xóa lịch sử */}
        <button
          className="header-delete-button"
          onClick={onDeleteHistory}
          title="Xóa lịch sử cuộc trò chuyện"
        >
          🗑
        </button>

        {/* Thêm */}
        <button
          className="header-action-button"
          onClick={() =>
            showComingSoon("⋮ Tính năng khác")
          }
          title="Tính năng khác"
        >
          ⋮
        </button>
      </div>
    </div>
  );
}
export default ChatHeader;