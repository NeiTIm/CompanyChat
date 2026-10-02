function NotificationDropdown({
  notifications,
  unreadCount,
  loading,
  onNotificationClick,
  onMarkAllAsRead,
}) {

  function formatTime(
    createdAt
  ) {
    if (!createdAt) {
      return "";
    }

    const date =
      new Date(createdAt);

    return date.toLocaleString(
      "vi-VN",
      {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }


  async function handleNotificationClick(
    notification
  ) {
    await onNotificationClick(
      notification
    );
  }


  return (
    <div className="notification-dropdown">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="notification-dropdown-header">

        <div className="notification-dropdown-title">
          Thông báo
        </div>


        {unreadCount > 0 && (

          <button
            type="button"
            className="notification-read-all-button"
            onClick={
              onMarkAllAsRead
            }
          >
            Đọc tất cả
          </button>

        )}

      </div>


      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="notification-list">

        {loading && (

          <div className="notification-empty">
            Đang tải...
          </div>

        )}


        {!loading &&
          notifications.length === 0 && (

          <div className="notification-empty">
            Chưa có thông báo
          </div>

        )}


        {!loading &&
          notifications.length > 0 &&
          notifications.map(
            (notification) => (

            <button
              type="button"
              key={
                notification.id
              }
              className={`notification-item ${
                notification.isRead
                  ? "read"
                  : "unread"
              }`}
              onClick={() =>
                handleNotificationClick(
                  notification
                )
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
                  {
                    notification.title
                  }
                </div>


                <div className="notification-item-text">
                  {
                    notification.content
                  }
                </div>


                <div className="notification-item-time">
                  {formatTime(
                    notification.createdAt
                  )}
                </div>

              </div>

            </button>

          )
        )}

      </div>

    </div>
  );
}

export default NotificationDropdown;