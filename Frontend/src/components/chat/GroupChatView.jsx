import ChatMessages from "./ChatMessages";
import MessageComposer from "./MessageComposer";

/* =========================================================
   GROUP CHAT VIEW
========================================================= */

function GroupChatView({
  selectedGroup,

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
  onOpenGroupDetails,

  onDelete,
  onReply,
}) {
  const groupName =
    selectedGroup?.name ||
    "Nhóm";

  return (
    <main className="chat-container">

      {/* =================================================
          GROUP HEADER
      ================================================= */}

      <div className="chat-header group-chat-header">

        <div
          className="chat-header-user group-header-clickable"
          onClick={onOpenGroupDetails}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" ||
              e.key === " "
            ) {
              onOpenGroupDetails();
            }
          }}
        >

          <div className="group-header-icon">

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

          <div className="chat-header-info">

            <div className="chat-header-name">
              {groupName}
            </div>

            <div className="group-header-status">

              <span className="group-status-dot" />

              {selectedGroup?.memberCount
                ? `${selectedGroup.memberCount} thành viên`
                : "Nhóm chat nội bộ"}

            </div>

          </div>
        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="chat-header-actions">

          <div className="group-header-label">
            Group
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
        type="group"
        selectedGroup={selectedGroup}
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
            groupName,

          username:
            groupName,

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

export default GroupChatView;