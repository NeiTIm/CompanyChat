function NotificationDropdown({
  notifications,
  unreadCount,
  loading,
  onNotificationClick,
  onMarkAllAsRead,
  onDeleteNotification,
  onDeleteAllReadNotifications,
}) {
  function formatTime(createdAt) {
    if (!createdAt) {
      return "";
    }

    const date = new Date(createdAt);

    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleNotificationClick(notification) {
    await onNotificationClick(notification);
  }

  function handleDeleteNotification(event, notificationId) {
    event.stopPropagation();

    onDeleteNotification(notificationId);
  }

  return (
    <div className="notification-dropdown">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="notification-header-actions">

        {/* XÓA TẤT CẢ THÔNG BÁO ĐÃ ĐỌC */}
        <button
          type="button"
          className="notification-delete-all-button"
          onClick={onDeleteAllReadNotifications}
        >
          Xóa tất cả
        </button>

        {/* ĐỌC TẤT CẢ */}
        <button
          type="button"
          className="notification-mark-all-button"
          onClick={onMarkAllAsRead}
        >
          Đọc tất cả
        </button>

      </div>


      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="notification-list">

        {/* LOADING */}

        {loading && (
          <div className="notification-empty">
            Đang tải...
          </div>
        )}


        {/* KHÔNG CÓ THÔNG BÁO */}

        {!loading &&
          notifications.length === 0 && (
            <div className="notification-empty">
              Chưa có thông báo
            </div>
          )}


        {/* DANH SÁCH THÔNG BÁO */}

        {!loading &&
          notifications.length > 0 &&
          notifications.map((notification) => (

            <div
              key={notification.id}
              className={`notification-item ${
                notification.isRead
                  ? "read"
                  : "unread"
              }`}
              onClick={() =>
                handleNotificationClick(notification)
              }
            >

              {/* =========================================
                  UNREAD DOT
              ========================================= */}

              <div className="notification-item-dot">

                {!notification.isRead && (
                  <span />
                )}

              </div>


              {/* =========================================
                  CONTENT
              ========================================= */}

              <div className="notification-item-content">

                <div className="notification-item-title">
                  {notification.title}
                </div>

                <div className="notification-item-text">
                  {notification.content}
                </div>

                <div className="notification-item-time">
                  {formatTime(
                    notification.createdAt
                  )}
                </div>

              </div>


              {/* =========================================
                  DELETE
              ========================================= */}

              {notification.isRead && (
                <button
                  type="button"
                  className="notification-delete-button"
                  onClick={(event) =>
                    handleDeleteNotification(
                      event,
                      notification.id
                    )
                  }
                >
                  Xóa
                </button>
              )}

            </div>

          ))}

      </div>

    </div>
  );
}

export default NotificationDropdown;