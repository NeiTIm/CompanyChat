import ChatMessages from "./ChatMessages";
import MessageComposer from "./MessageComposer";

/* =========================================================
   DEPARTMENT CHAT VIEW
========================================================= */

function DepartmentChatView({
  departmentConversation,

  messages,
  loading,
  isTyping,
  messagesEndRef,
  currentUser,

  text,
  conversation,
  websocket,
  websocketConnected,

  replyingTo,
  onCancelReply,
  onChange,
  onSubmit,

  onDeleteHistory,

  onDelete,
  onReply,
}) {
  const departmentName =
    departmentConversation?.departmentName ||
    departmentConversation?.name ||
    "Phòng ban";

  return (
    <main className="chat-container">

      {/* =================================================
          DEPARTMENT HEADER
      ================================================= */}

      <div className="chat-header department-chat-header">

        {/* ===============================================
            DEPARTMENT INFO
        =============================================== */}

        <div className="chat-header-user">

          <div className="department-header-icon">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
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

          <div className="chat-header-info">

            <div className="chat-header-name">
              {departmentName}
            </div>

            <div className="department-header-status">

              <span className="department-status-dot" />

              Phòng chat nội bộ

            </div>

          </div>
        </div>

        {/* ===============================================
            ACTIONS
        =============================================== */}

        <div className="chat-header-actions">

          <div className="department-header-label">
            Department
          </div>

          <button
            type="button"
            className="header-delete-button"
            onClick={onDeleteHistory}
            title="Xóa lịch sử trò chuyện"
            aria-label="Xóa lịch sử trò chuyện"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 7h16" />

              <path d="M9 7V4h6v3" />

              <path d="M6.5 7 7 20h10l.5-13" />

              <path d="M10 11v5" />

              <path d="M14 11v5" />
            </svg>
          </button>

        </div>
      </div>

      {/* =================================================
          MESSAGES
      ================================================= */}

      <ChatMessages
        type="department"
        departmentConversation={
          departmentConversation
        }
        messages={messages}
        loading={loading}
        isTyping={isTyping}
        messagesEndRef={messagesEndRef}
        currentUser={currentUser}
        onDelete={onDelete}
        onReply={onReply}
      />

      {/* =================================================
          COMPOSER
      ================================================= */}

      <MessageComposer
        text={text}
        selectedUser={{
          id: null,

          fullName:
            departmentName,

          username:
            departmentName,

          isOnline: true,
        }}
        conversation={conversation}
        websocket={websocket}
        websocketConnected={
          websocketConnected
        }
        replyingTo={replyingTo}
        onCancelReply={onCancelReply}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    </main>
  );
}

export default DepartmentChatView;