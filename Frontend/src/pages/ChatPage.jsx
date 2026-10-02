import UserList from "../components/user/UserList";
import ChatWindow from "../components/chat/ChatWindow";
import NotificationBell from "../components/notification/NotificationBell";


import useWebSocket from "../hooks/useWebSocket";
import useChat from "../hooks/useChat";
import useNotifications from "../hooks/useNotifications";


/* =========================================================
   ICONS
========================================================= */

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
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
  );
}


function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />

      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.4h.84A1.7 1.7 0 0 0 8.4 10a1.7 1.7 0 0 0-.34-1.88L8 8.06l1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V5h2.4v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 15Z" />
    </svg>
  );
}


/* =========================================================
   CHAT PAGE
========================================================= */

function ChatPage({
  currentUser,
  onGoToAdmin,
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
  } = useWebSocket(
    currentUser
  );


  /* =====================================================
     CHAT
  ===================================================== */

  const {
    users,

    selectedUser,

    departmentConversation,

    unreadCounts,

    departmentUnreadCount,

    handleSelectUser,

    handleSelectDepartment,

    handleConversationRead,

    handleConversationChange,

  } = useChat(
    currentUser,
    socketEvent
  );


  /* =====================================================
     NOTIFICATIONS
  ===================================================== */

  const {
    notifications,
    unreadCount,
    loading,
    handleNotificationClick,
    handleMarkAllAsRead,
  } = useNotifications(
    socketEvent
  );


  /* =====================================================
     LOGOUT
  ===================================================== */

  function handleLogout() {
    closeWebSocket();

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    onLogout();
  }


  /* =====================================================
     SELECT DEPARTMENT CHAT
  ===================================================== */

  async function handleDepartmentChat() {
    try {

      await handleSelectDepartment();

    } catch (error) {

      console.error(
        "Open department chat error:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Không thể mở phòng chat phòng ban."
      );
    }
  }

  async function handleOpenNotification(
        notification
      ) {
        const target =
          await handleNotificationClick(
            notification
          );

        if (!target) {
          return;
        }

        /* ==============================
          PHÒNG BAN
        ============================== */

        if (
          target.conversationType ===
          "Department"
        ) {
          try {
            await handleSelectDepartment();
          } catch (error) {
            console.error(
              "Open department notification error:",
              error
            );
          }

          return;
        }

        /* ==============================
          CHAT RIÊNG
        ============================== */

        if (
          target.conversationType ===
          "Private"
        ) {
          const user =
            users.find(
              (item) =>
                Number(item.id) ===
                Number(target.senderId)
            );

          if (!user) {
            console.error(
              "Notification sender not found:",
              target.senderId
            );

            return;
          }

          handleSelectUser(user);
        }
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

          {/* NOTIFICATION BELL */}
          <NotificationBell
              notifications={
                notifications
              }

              unreadCount={
                unreadCount
              }

              loading={
                loading
              }

              onNotificationClick={
                handleOpenNotification
              }

              onMarkAllAsRead={
                handleMarkAllAsRead
              }
            />
          
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


          {/* ADMIN */}

          {currentUser?.role ===
            "Admin" && (

            <button
              type="button"
              className="admin-dashboard-button"
              onClick={
                onGoToAdmin
              }
            >

              <SettingsIcon />

              <span>
                Admin Dashboard
              </span>

            </button>

          )}


          {/* LOGOUT */}

          <button
            type="button"
            className="logout-button"
            onClick={
              handleLogout
            }
          >
            Đăng xuất
          </button>

        </div>

      </header>


      {/* =================================================
          BODY
      ================================================= */}

      <div className="app-body">


        {/* =================================================
            LEFT SIDEBAR
        ================================================= */}

        <div className="chat-sidebar">


          {/* =================================================
              DEPARTMENT CHAT
          ================================================= */}

          <button
            type="button"
            className={`department-chat-button ${
              departmentConversation
                ? "active"
                : ""
            }`}
            onClick={
              handleDepartmentChat
            }
          >

            <div className="department-chat-icon">

              <BuildingIcon />

            </div>


            <div className="department-chat-content">

              <div className="department-chat-top">

                <div className="department-chat-title">
                  Phòng ban
                </div>

                <span className="department-chat-arrow">
                  →
                </span>

              </div>


              <div className="department-chat-description">
                Trò chuyện nội bộ theo phòng ban
              </div>


              <div className="department-chat-meta">

                <span className="department-chat-status-dot" />

                Kênh nội bộ


                {/* =========================================
                    DEPARTMENT UNREAD
                ========================================= */}

                {departmentUnreadCount >
                  0 && (

                  <span className="department-chat-unread">

                    {departmentUnreadCount >
                    99
                      ? "99+"
                      : departmentUnreadCount}

                  </span>

                )}

              </div>

            </div>

          </button>


          {/* =================================================
              PRIVATE USERS
          ================================================= */}

          <UserList
            users={
              users
            }

            selectedUser={
              selectedUser
            }

            onSelectUser={
              handleSelectUser
            }

            unreadCounts={
              unreadCounts
            }
          />

        </div>


        {/* =================================================
            CHAT WINDOW
        ================================================= */}

        <ChatWindow
          selectedUser={
            selectedUser
          }

          departmentConversation={
            departmentConversation
          }

          currentUser={
            currentUser
          }

          websocket={
            websocket
          }

          websocketConnected={
            websocketConnected
          }

          socketEvent={
            socketEvent
          }

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