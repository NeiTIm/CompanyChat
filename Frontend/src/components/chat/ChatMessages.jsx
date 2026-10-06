import MessageItem from "./MessageItem";
import Avatar from "../common/Avatar";
import TypingIndicator from "./TypingIndicator";

/* =========================================================
   CHAT MESSAGES
========================================================= */

function ChatMessages({
  messages,
  loading,
  isTyping,
  messagesEndRef,
  currentUser,

  /* =========================
     CHAT TYPE
  ========================= */

  type = "private",

  /* =========================
     PRIVATE
  ========================= */

  selectedUser,

  /* =========================
     DEPARTMENT
  ========================= */

  departmentConversation,

  /* =========================
     GROUP
  ========================= */

  selectedGroup,

  /* =========================
     ACTIONS
  ========================= */

  onDelete,
  onReply,
}) {
  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="messages-container">
        <div className="messages-loading">
          <span className="loading-spinner" />
          Đang tải tin nhắn...
        </div>

        <div ref={messagesEndRef} />
      </div>
    );
  }

  /* =======================================================
     EMPTY STATE
  ======================================================= */

  const renderEmptyState = () => {
    /* =====================================================
       GROUP
    ===================================================== */

    if (type === "group") {
      return (
        <div className="no-messages">
          <div className="no-message-avatar group-empty-icon">
            <svg
              viewBox="0 0 24 24"
              width="26"
              height="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle
                cx="9"
                cy="8"
                r="3"
              />

              <circle
                cx="17"
                cy="9"
                r="2.5"
              />

              <path d="M3.5 20c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" />

              <path d="M14 15c.8-.55 1.78-.87 2.83-.87 2.58 0 4.67 1.88 4.67 4.2" />
            </svg>
          </div>

          <h3>
            {selectedGroup?.name || "Nhóm"}
          </h3>

          <p>
            Gửi tin nhắn đầu tiên
            cho nhóm.
          </p>
        </div>
      );
    }

    /* =====================================================
       DEPARTMENT
    ===================================================== */

    if (type === "department") {
      return (
        <div className="no-messages">
          <div className="no-message-avatar department-empty-icon">
            <svg
              viewBox="0 0 24 24"
              width="26"
              height="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 21V5.5C4 4.67 4.67 4 5.5 4h8c.83 0 1.5.67 1.5 1.5V21" />

              <path d="M15 9h3.5c.83 0 1.5.67 1.5 1.5V21" />

              <path d="M8 8h3" />

              <path d="M8 12h3" />

              <path d="M8 16h3" />

              <path d="M18 13h.01" />

              <path d="M18 17h.01" />

              <path d="M2.5 21h19" />
            </svg>
          </div>

          <h3>
            {departmentConversation?.departmentName ||
              departmentConversation?.name ||
              "Phòng ban"}
          </h3>

          <p>
            Gửi tin nhắn đầu tiên
            cho phòng ban.
          </p>
        </div>
      );
    }

    /* =====================================================
       PRIVATE
    ===================================================== */

    return (
      <div className="no-messages">
        <div className="no-message-avatar">
          <Avatar
            user={selectedUser}
            size="large"
            showStatus
          />
        </div>

        <h3>
          Bắt đầu trò chuyện với{" "}
          {selectedUser?.fullName ||
            selectedUser?.username}
        </h3>

        <p>
          Gửi tin nhắn đầu tiên để
          bắt đầu cuộc trò chuyện.
        </p>
      </div>
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="messages-container">
      {messages.length === 0 ? (
        renderEmptyState()
      ) : (
        messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            currentUser={currentUser}
            onDelete={onDelete}
            onReply={onReply}
          />
        ))
      )}

      {isTyping && (
        <TypingIndicator />
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatMessages;