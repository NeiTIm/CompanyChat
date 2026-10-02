import { useState } from "react";

import UserList from "../components/user/UserList";
import ChatWindow from "../components/chat/ChatWindow";
import NotificationBell from "../components/notification/NotificationBell";
import CreateGroupModal from "../components/group/CreateGroupModal";

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

function GroupIcon() {
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
      <circle
        cx="9"
        cy="8"
        r="3"
      />

      <path d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6" />

      <circle
        cx="17"
        cy="9"
        r="2.5"
      />

      <path d="M17 14c2.76 0 5 2.24 5 5" />
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
      <circle
        cx="12"
        cy="12"
        r="3"
      />

      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.4h.84A1.7 1.7 0 0 0 8.4 10a1.7 1.7 0 0 0-.34-1.88L8 8.06l1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V5h2.4v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l-.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 15Z" />
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
     CREATE GROUP
  ===================================================== */

  const [showCreateGroup, setShowCreateGroup] =
    useState(false);

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

    departmentConversation,

    /* =========================
       GROUP
    ========================= */

    groups,
    selectedGroup,
    groupUnreadCounts,

    unreadCounts,
    departmentUnreadCount,

    handleSelectUser,
    handleSelectDepartment,
    handleSelectGroup,

    handleGroupUpdated,
    handleGroupRemoved,

    handleConversationRead,
    handleConversationChange,
  } = useChat(
    currentUser,
    socketEvent,
    websocket,
    websocketConnected,
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
    handleDeleteNotification,

    handleUserNotificationRead,
    handleDepartmentNotificationRead,
    handleDeleteAllReadNotifications,
  } = useNotifications(
    socketEvent,
  );

  /* =====================================================
     LOGOUT
  ===================================================== */

  function handleLogout() {
    closeWebSocket();

    localStorage.removeItem(
      "token",
    );

    localStorage.removeItem(
      "user",
    );

    onLogout();
  }

  /* =====================================================
     SELECT DEPARTMENT CHAT
  ===================================================== */

  async function handleDepartmentChat() {
    try {
      await handleSelectDepartment();

      await handleDepartmentNotificationRead();
    } catch (error) {
      console.error(
        "Open department chat error:",
        error,
      );

      alert(
        error?.response?.data?.message ||
          "Không thể mở phòng chat phòng ban.",
      );
    }
  }

  /* =====================================================
     SELECT USER
  ===================================================== */

  async function handleSelectUserFromList(
    user,
  ) {
    handleSelectUser(user);

    await handleUserNotificationRead(
      user.id,
    );
  }

  /* =====================================================
     SELECT GROUP
  ===================================================== */

  function handleSelectGroupFromList(
    group,
  ) {
    handleSelectGroup(group);
  }

  /* =====================================================
     CREATE GROUP
  ===================================================== */

  async function handleCreateGroupCompleted(
    createdGroup,
  ) {
    try {
      setShowCreateGroup(false);

      /*
       * Reload danh sách group.
       *
       * Không thay đổi logic cũ.
       * Chỉ gọi lại handler group hiện tại
       * mà useChat đã cung cấp.
       */
      await handleGroupUpdated();

      /*
       * Backend có thể trả:
       *
       * {
       *   id: 123,
       *   ...
       * }
       *
       * hoặc:
       *
       * {
       *   conversationId: 123,
       *   ...
       * }
       */

      if (
        createdGroup &&
        (
          createdGroup.conversationId ||
          createdGroup.id
        )
      ) {
        handleSelectGroup(
          createdGroup,
        );
      }
    } catch (error) {
      console.error(
        "Handle created group error:",
        error,
      );
    }
  }

  /* =====================================================
     OPEN NOTIFICATION
  ===================================================== */

  async function handleOpenNotification(
    notification,
  ) {
    const target =
      await handleNotificationClick(
        notification,
      );

    if (!target) {
      return;
    }

    /* ===============================================
       DEPARTMENT
    =============================================== */

    if (
      target.conversationType ===
      "Department"
    ) {
      try {
        await handleSelectDepartment();
      } catch (error) {
        console.error(
          "Open department notification error:",
          error,
        );
      }

      return;
    }

    /* ===============================================
       GROUP
    =============================================== */

    if (
      target.conversationType ===
      "Group"
    ) {
      const group =
        groups.find(
          (item) =>
            Number(
              item.conversationId,
            ) ===
            Number(
              target.conversationId,
            ),
        );

      if (!group) {
        console.error(
          "Notification group not found:",
          target.conversationId,
        );

        return;
      }

      handleSelectGroup(
        group,
      );

      return;
    }

    /* ===============================================
       PRIVATE
    =============================================== */

    if (
      target.conversationType ===
      "Private"
    ) {
      const user =
        users.find(
          (item) =>
            Number(item.id) ===
            Number(
              target.senderId,
            ),
        );

      if (!user) {
        console.error(
          "Notification sender not found:",
          target.senderId,
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

          {/* =================================================
              NOTIFICATION
          ================================================= */}

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
            onDeleteNotification={
              handleDeleteNotification
            }
            onDeleteAllReadNotifications={
              handleDeleteAllReadNotifications
            }
          />

          {/* =================================================
              CURRENT USER
          ================================================= */}

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

          {/* =================================================
              ADMIN
          ================================================= */}

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

          {/* =================================================
              LOGOUT
          ================================================= */}

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
              GROUP CHAT
          ================================================= */}

          <div className="group-chat-section">

            <div className="group-chat-header">

              <div className="group-chat-title">
                Nhóm
              </div>

              {/* =================================================
                  CREATE GROUP BUTTON
              ================================================= */}

              <button
                type="button"
                className="group-chat-create-button"
                onClick={() =>
                  setShowCreateGroup(
                    true,
                  )
                }
                title="Tạo nhóm"
                aria-label="Tạo nhóm"
              >
                +
              </button>

            </div>

            <div className="group-chat-list">

              {groups.map(
                (group) => {
                  const conversationId =
                    Number(
                      group.conversationId,
                    );

                  const isActive =
                    Number(
                      selectedGroup?.conversationId,
                    ) ===
                    conversationId;

                  const unread =
                    groupUnreadCounts[
                      conversationId
                    ] || 0;

                  return (
                    <button
                      key={
                        conversationId
                      }
                      type="button"
                      className={`group-chat-item ${
                        isActive
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleSelectGroupFromList(
                          group,
                        )
                      }
                    >

                      <div className="group-chat-icon">
                        <GroupIcon />
                      </div>

                      <div className="group-chat-info">

                        <div className="group-chat-name">
                          {group.name}
                        </div>

                        <div className="group-chat-members">
                          {group.memberCount}{" "}
                          thành viên
                        </div>

                      </div>

                      {unread >
                        0 && (
                        <span className="group-chat-unread">
                          {unread >
                          99
                            ? "99+"
                            : unread}
                        </span>
                      )}

                    </button>
                  );
                },
              )}

              {/* =================================================
                  EMPTY GROUP
              ================================================= */}

              {groups.length === 0 && (
                <div className="group-chat-empty">

                  <div className="group-chat-empty-title">
                    Chưa có nhóm
                  </div>

                  <div className="group-chat-empty-description">
                    Bấm + để tạo nhóm mới.
                  </div>

                </div>
              )}

            </div>

          </div>

          {/* =================================================
              PRIVATE USERS
          ================================================= */}

          <UserList
            users={users}
            selectedUser={
              selectedUser
            }
            onSelectUser={
              handleSelectUserFromList
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

          selectedGroup={
            selectedGroup
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

          /* =========================
             GROUP
          ========================= */

          onGroupUpdated={
            handleGroupUpdated
          }

          onGroupRemoved={
            handleGroupRemoved
          }
        />

      </div>

      {/* =================================================
          CREATE GROUP MODAL
      ================================================= */}

      {showCreateGroup && (
        <CreateGroupModal
          users={users}
          currentUser={currentUser}

          onClose={() =>
            setShowCreateGroup(
              false,
            )
          }

          onCreated={
            handleCreateGroupCompleted
          }
        />
      )}

    </div>
  );
}

export default ChatPage;