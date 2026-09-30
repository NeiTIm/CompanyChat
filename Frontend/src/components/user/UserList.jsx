import { useState } from "react";
import Avatar from "../common/Avatar";
import { formatLastSeen } from "../../utils/dateUtils";


/* =========================================================
   USER LIST
========================================================= */

function UserList({
  users,
  selectedUser,
  onSelectUser,
  unreadCounts,
}) {
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((user) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      user.fullName?.toLowerCase().includes(keyword) ||
      user.username?.toLowerCase().includes(keyword)
    );
  });

  const onlineCount = users.filter(
    (user) => user.isOnline
  ).length;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div>
          <h2>Nhân viên</h2>

          <div className="employee-summary">
            <span>{users.length} người</span>

            <span className="online-summary">
              <span className="mini-online-dot" />
              {onlineCount} online
            </span>
          </div>
        </div>
      </div>

      <div className="search-box">
        <span className="search-icon">⌕</span>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm nhân viên..."
        />
      </div>

      <div className="user-list">
        {filteredUsers.map((user) => {
  const selected =
    selectedUser?.id === user.id;

  const unreadCount =
    unreadCounts[user.id] || 0;

          return (
            <button
              key={user.id}
              className={`user-item ${
                selected ? "selected" : ""
              }`}
              onClick={() => onSelectUser(user)}
            >
              <Avatar
                user={user}
                size="medium"
                showStatus
              />

              <div className="user-info">
               <div className="user-name-row">
                <div className="user-name">
                  {user.fullName || user.username}
                </div>

                {unreadCount > 0 && (
                  <span className="unread-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>

                <div className="user-username">
                  @{user.username}
                </div>

                <div
                  className={`user-presence ${
                    user.isOnline
                      ? "online"
                      : "offline"
                  }`}
                >
                  <span className="presence-dot" />

                  {user.isOnline
                    ? "Đang online"
                    : formatLastSeen(user.lastSeen)}
                </div>
              </div>
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="empty-users">
            <div className="empty-users-icon">
              ⌕
            </div>

            <div>
              Không tìm thấy nhân viên
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
export default UserList;