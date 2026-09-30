import UserList from "../components/user/UserList";
import ChatWindow from "../components/chat/ChatWindow";

import useWebSocket from "../hooks/useWebSocket";
import useChat from "../hooks/useChat";

/* =========================================================
   CHAT PAGE
========================================================= */

function ChatPage({
  currentUser,
  onLogout,
}) {
  /* =====================================================
     WEBSOCKET
  ===================================================== */

  const {
    websocket,
    websocketConnected,
    socketEvent,
    closeWebSocket,
  } = useWebSocket(currentUser);

  /* =====================================================
     CHAT
  ===================================================== */

  const {
    users,
    selectedUser,
    unreadCounts,

    handleSelectUser,
    handleConversationRead,
    handleConversationChange,
  } = useChat(
    currentUser,
    socketEvent
  );

  /* =====================================================
     LOGOUT
  ===================================================== */

  function handleLogout() {
    closeWebSocket();

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    onLogout();
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="app">

      {/* =================================================
          TOPBAR
      ================================================= */}

      <header className="topbar">
        <div className="brand">
          <div className="brand-logo">
            C
          </div>

          <div className="brand-name">
            Company Chat
          </div>
        </div>

        <div className="topbar-right">

          <div className="current-user">
            <div className="current-user-name">
              {currentUser.fullName ||
                currentUser.username}
            </div>

            <div className="current-user-role">
              <span
                className={`current-status-dot ${
                  websocketConnected
                    ? "online"
                    : "offline"
                }`}
              />

              {websocketConnected
                ? "Đang online"
                : "Offline"}
            </div>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Đăng xuất
          </button>

        </div>
      </header>

      {/* =================================================
          BODY
      ================================================= */}

      <div className="app-body">

        {/* USER LIST */}

        <UserList
          users={users}
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
          unreadCounts={unreadCounts}
        />

        {/* CHAT WINDOW */}

        <ChatWindow
          selectedUser={selectedUser}
          currentUser={currentUser}
          websocket={websocket}
          websocketConnected={
            websocketConnected
          }
          socketEvent={socketEvent}
          onConversationRead={
            handleConversationRead
          }
          onConversationChange={
            handleConversationChange
          }
        />

      </div>
    </div>
  );
}

export default ChatPage;