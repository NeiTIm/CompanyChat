function NotificationDropdown({
  notifications,
  unreadCount,
  loading,
  onNotificationClick,
  onMarkAllAsRead,
  onDeleteNotification,
  onDeleteAllReadNotifications,
}) {
  /* =========================================================
     FORMAT TIME
  ========================================================= */

  function formatTime(createdAt) {
    if (!createdAt) {
      return "";
    }

    const date =
      new Date(createdAt);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return "";
    }

    return date.toLocaleString(
      "vi-VN",
      {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  }


  /* =========================================================
     CHECK DEPARTMENT
  ========================================================= */

  function isDepartmentNotification(
    notification,
  ) {
    const type =
      notification?.type ??
      notification?.Type;

    const conversationType =
      notification?.conversationType ??
      notification?.ConversationType;

    return (
      type ===
        "DepartmentMessage" ||
      type ===
        "Department" ||
      type ===
        "department" ||
      conversationType ===
        "Department"
    );
  }


  /* =========================================================
     CLICK
  ========================================================= */

  async function handleNotificationClick(
    notification,
  ) {
    if (!notification) {
      return;
    }

    try {
      await onNotificationClick(
        notification,
      );
    } catch (error) {
      console.error(
        "Notification click error:",
        error,
      );
    }
  }


  /* =========================================================
     DELETE
  ========================================================= */

  function handleDeleteNotification(
    event,
    notificationId,
  ) {
    event.stopPropagation();

    if (!notificationId) {
      return;
    }

    onDeleteNotification(
      notificationId,
    );
  }


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="notification-dropdown">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="notification-header-actions">

        <button
          type="button"
          className="notification-delete-all-button"
          onClick={
            onDeleteAllReadNotifications
          }
        >
          Xóa tất cả
        </button>

        <button
          type="button"
          className="notification-mark-all-button"
          onClick={
            onMarkAllAsRead
          }
        >
          Đọc tất cả
        </button>

      </div>


      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="notification-list">

        {/* LOADING */}

        {loading && (
          <div className="notification-empty">
            Đang tải...
          </div>
        )}


        {/* EMPTY */}

        {!loading &&
          notifications.length === 0 && (
            <div className="notification-empty">
              Chưa có thông báo
            </div>
          )}


        {/* LIST */}

        {!loading &&
          notifications.length > 0 &&
          notifications.map(
            (notification) => {
              const isRead =
                Boolean(
                  notification.isRead,
                );

              const isDepartment =
                isDepartmentNotification(
                  notification,
                );

              const departmentName =
                (
                  notification.departmentName ??
                  notification.DepartmentName ??
                  ""
                ).trim();

              return (
                <div
                  key={
                    notification.id
                  }
                  className={`notification-item ${
                    isRead
                      ? "read"
                      : "unread"
                  }`}
                  onClick={() =>
                    handleNotificationClick(
                      notification,
                    )
                  }
                >

                  {/* =====================================
                      UNREAD DOT
                  ===================================== */}

                  <div className="notification-item-dot">
                    {!isRead && (
                      <span />
                    )}
                  </div>


                  {/* =====================================
                      CONTENT
                  ===================================== */}

                  <div className="notification-item-content">

                    {/* TITLE */}

                    <div className="notification-item-title">

                      <span>
                        {
                          notification.title
                        }
                      </span>

                      {/* =================================
                          DEPARTMENT LABEL
                      ================================= */}

                      {isDepartment &&
                        departmentName && (
                          <span className="notification-department-label">
                            🏢{" "}
                            {
                              departmentName
                            }
                          </span>
                        )}

                    </div>


                    {/* MESSAGE */}

                    <div className="notification-item-text">
                      {
                        notification.content
                      }
                    </div>


                    {/* TIME */}

                    <div className="notification-item-time">
                      {formatTime(
                        notification.createdAt,
                      )}
                    </div>

                  </div>


                  {/* =====================================
                      DELETE
                  ===================================== */}

                  {isRead && (
                    <button
                      type="button"
                      className="notification-delete-button"
                      onClick={(
                        event,
                      ) =>
                        handleDeleteNotification(
                          event,
                          notification.id,
                        )
                      }
                    >
                      Xóa
                    </button>
                  )}

                </div>
              );
            },
          )}

      </div>

    </div>
  );
}

export default NotificationDropdown;