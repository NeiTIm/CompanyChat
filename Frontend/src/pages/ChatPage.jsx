import { useState } from "react";

import UserList from "../components/user/UserList";
import ChatWindow from "../components/chat/ChatWindow";
import NotificationBell from "../components/notification/NotificationBell";
import CreateGroupModal from "../components/group/CreateGroupModal";


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
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6" />
      <circle cx="17" cy="9" r="2.5" />
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.4h.84A1.7 1.7 0 0 0 8.4 10a1.7 1.7 0 0 0-.34-1.88L8 8.06l1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V5h2.4v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l-.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 15Z" />
    </svg>
  );
}

/* =========================================================
   CHAT PAGE
========================================================= */

function ChatPage({
  currentUser,
  websocket,
  websocketConnected,
  socketEvent,
  closeWebSocket,
  onGoToAdmin,
  onLogout,
}) {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");

 

  const {
  users,
  selectedUser,

  departments,
  selectedDepartment,
  departmentUnreadCounts,

  groups,
  selectedGroup,

  groupUnreadCounts,
  unreadCounts,

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
  websocketConnected
);

  const normalizedGroupSearch = groupSearch.trim().toLowerCase();
  const filteredGroups = normalizedGroupSearch
    ? groups.filter((group) =>
        (group.name || "").toLowerCase().includes(normalizedGroupSearch)
      )
    : groups;

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
  } = useNotifications(socketEvent);

  function handleLogout() {
    closeWebSocket();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    onLogout();
  }

 

  async function handleSelectUserFromList(user) {
    handleSelectUser(user);
    await handleUserNotificationRead(user.id);
  }

  function handleSelectGroupFromList(group) {
    handleSelectGroup(group);
  }

  async function handleCreateGroupCompleted(createdGroup) {
    try {
      setShowCreateGroup(false);
      await handleGroupUpdated();

      if (createdGroup && (createdGroup.conversationId || createdGroup.id)) {
        handleSelectGroup(createdGroup);
      }
    } catch (error) {
      console.error("Handle created group error:", error);
    }
  }

  async function handleOpenNotification(notification) {
    const target = await handleNotificationClick(notification);
    if (!target) return;

   if (target.conversationType === "Department") {
  const department = departments.find(
    (item) =>
      Number(item.conversationId) ===
      Number(target.conversationId)
  );

  if (!department) {
    console.error(
      "Notification department not found:",
      target.conversationId
    );

    return;
  }

  try {
    await handleSelectDepartment(department);
  } catch (error) {
    console.error(
      "Open department notification error:",
      error
    );
  }

  return;
}

    if (target.conversationType === "Group") {
      const group = groups.find(
        (item) => Number(item.conversationId) === Number(target.conversationId)
      );

      if (!group) {
        console.error("Notification group not found:", target.conversationId);
        return;
      }

      handleSelectGroup(group);
      return;
    }

    if (target.conversationType === "Private") {
      const user = users.find(
        (item) => Number(item.id) === Number(target.senderId)
      );

      if (!user) {
        console.error("Notification sender not found:", target.senderId);
        return;
      }

      handleSelectUser(user);
    }
  }

  return (
    <div className="app">
      {/* TOPBAR */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-logo">C</div>
          <div className="brand-name">Company Chat</div>
        </div>

        <div className="topbar-right">
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loading}
            onNotificationClick={handleOpenNotification}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDeleteNotification={handleDeleteNotification}
            onDeleteAllReadNotifications={handleDeleteAllReadNotifications}
          />

          <div className="current-user">
            <div className="current-user-name">
              {currentUser.fullName || currentUser.username}
            </div>
            <div className="current-user-role">
              <span
                className={`current-status-dot ${
                  websocketConnected ? "online" : "offline"
                }`}
              />
              {websocketConnected ? "Đang online" : "Offline"}
            </div>
          </div>

          {currentUser?.role === "Admin" && (
            <button
              type="button"
              className="admin-dashboard-button"
              onClick={onGoToAdmin}
            >
              <SettingsIcon />
              <span>Admin Dashboard</span>
            </button>
          )}

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="app-body">
        {/* LEFT SIDEBAR */}
        <div className="chat-sidebar">
         {/* =========================================================
    DEPARTMENT CHAT
========================================================= */}

{departments.length > 0 && (
  <div className="department-chat-list">

    {departments.map((department) => {

      const isSelected =
        selectedDepartment?.departmentId === department.id ||
        selectedDepartment?.id === department.id;

      const unreadCount =
        departmentUnreadCounts[
          department.conversationId
        ] || 0;

      return (
        <button
          key={department.id}
          type="button"
          className={`department-chat-button ${
            isSelected ? "active" : ""
          }`}
          onClick={() =>
            handleSelectDepartment(department)
          }
        >

          {/* =================================================
              ICON
          ================================================= */}

          <div className="department-chat-icon">
            <BuildingIcon />
          </div>


          {/* =================================================
              CONTENT
          ================================================= */}

          <div className="department-chat-content">

            <div className="department-chat-top">

              <div className="department-chat-title">

                {department.name}

                {department.isPrimary && (
                  <span className="department-primary-badge">
                 Chính
                  </span>
                )}

              </div>

              <span className="department-chat-arrow">
                →
              </span>

            </div>


            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <div className="department-chat-description">

              {department.description ||
                "Trò chuyện nội bộ theo phòng ban"}

            </div>


            {/* =================================================
                META
            ================================================= */}

            <div className="department-chat-meta">

              <span className="department-chat-status-dot" />

              {department.isPrimary
                ? "Phòng ban chính"
                : "Phòng ban tham gia"}


              {/* =================================================
                  UNREAD
              ================================================= */}

              {unreadCount > 0 && (
                <span className="group-chat-unread department-chat-unread">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}

            </div>

          </div>

        </button>
      );

    })}

  </div>
)}

          {/* GROUP CHAT */}
          <div className="group-chat-section">
            <div className="group-chat-header">
              <div className="group-chat-title">
                Nhóm
                {groups.length > 0 && (
                  <span className="group-chat-count">{groups.length}</span>
                )}
              </div>

              <div className="group-chat-header-actions">
                {groups.length > 0 && (
                  <button
                    type="button"
                    className={`group-search-toggle ${
                      groupSearch ? "active" : ""
                    }`}
                    onClick={() => {
                      document
                        .querySelector(".group-search-input")
                        ?.focus();
                    }}
                    title="Tìm nhóm"
                    aria-label="Tìm nhóm"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="17"
                      height="17"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-4-4" />
                    </svg>
                  </button>
                )}

                <button
                  type="button"
                  className="group-chat-create-button"
                  onClick={() => setShowCreateGroup(true)}
                  title="Tạo nhóm"
                  aria-label="Tạo nhóm"
                >
                  +
                </button>
              </div>
            </div>

            {/* SEARCH BOX */}
            {groups.length > 0 && (
              <div
                className={`group-search-box ${
                  groupSearch ? "has-value" : ""
                }`}
              >
                <div className="group-search-icon">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
                  </svg>
                </div>

                <input
                  type="text"
                  className="group-search-input"
                  placeholder="Tìm nhóm..."
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setGroupSearch("");
                      e.target.blur();
                    }
                  }}
                  aria-label="Tìm kiếm nhóm"
                />

                {groupSearch && (
                  <button
                    type="button"
                    className="group-search-clear"
                    onClick={() => setGroupSearch("")}
                    title="Xóa tìm kiếm"
                    aria-label="Xóa tìm kiếm"
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            {/* SEARCH RESULT INFO */}
            {groupSearch.trim() && (
              <div className="group-search-result">
                <span>
                  {filteredGroups.length === 0
                    ? "Không tìm thấy nhóm"
                    : `${filteredGroups.length} nhóm phù hợp`}
                </span>
                <kbd>ESC</kbd>
              </div>
            )}

            {/* GROUP LIST */}
            <div className="group-chat-list">
              {filteredGroups.map((group) => {
                const conversationId = Number(group.conversationId);
                const isActive =
                  Number(selectedGroup?.conversationId) === conversationId;
                const unread = groupUnreadCounts[conversationId] || 0;

                return (
                  <button
                    key={conversationId}
                    type="button"
                    className={`group-chat-item ${isActive ? "active" : ""}`}
                    onClick={() => handleSelectGroupFromList(group)}
                  >
                    <div className="group-chat-icon">
                      <GroupIcon />
                    </div>

                    <div className="group-chat-info">
                      <div className="group-chat-name">{group.name}</div>
                      <div className="group-chat-members">
                        {group.memberCount} thành viên
                      </div>
                    </div>

                    {unread > 0 && (
                      <span className="group-chat-unread">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </button>
                );
              })}

              {groups.length > 0 &&
                groupSearch.trim() &&
                filteredGroups.length === 0 && (
                  <div className="group-search-empty">
                    <div className="group-search-empty-icon">
                      <svg
                        viewBox="0 0 24 24"
                        width="23"
                        height="23"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-4-4" />
                        <path d="M8.5 8.5l5 5" />
                        <path d="m13.5 8.5-5 5" />
                      </svg>
                    </div>

                    <div className="group-search-empty-title">
                      Không tìm thấy nhóm
                    </div>
                    <div className="group-search-empty-description">
                      Thử tìm bằng tên nhóm khác.
                    </div>
                  </div>
                )}

              {groups.length === 0 && (
                <div className="group-chat-empty">
                  <div className="group-chat-empty-title">Chưa có nhóm</div>
                  <div className="group-chat-empty-description">
                    Bấm + để tạo nhóm mới.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PRIVATE USERS */}
          <UserList
            users={users}
            selectedUser={selectedUser}
            onSelectUser={handleSelectUserFromList}
            unreadCounts={unreadCounts}

            departments={departments}
            selectedDepartment={selectedDepartment}
            onSelectDepartment={handleSelectDepartment}
            departmentUnreadCounts={departmentUnreadCounts}
          />
        </div>

        {/* CHAT WINDOW */}
        <ChatWindow
          selectedUser={selectedUser}
          departmentConversation={selectedDepartment}
          selectedGroup={selectedGroup}
          currentUser={currentUser}
          websocket={websocket}
          websocketConnected={websocketConnected}
          socketEvent={socketEvent}
          onConversationRead={handleConversationRead}
          onConversationChange={handleConversationChange}
          onGroupUpdated={handleGroupUpdated}
          onGroupRemoved={handleGroupRemoved}
        />
      </div>

      {/* CREATE GROUP MODAL */}
      {showCreateGroup && (
        <CreateGroupModal
          users={users}
          currentUser={currentUser}
          onClose={() => setShowCreateGroup(false)}
          onCreated={handleCreateGroupCompleted}
        />
      )}
    </div>
  );
}

export default ChatPage;