import { useEffect, useState } from "react";

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationTarget,
  deleteNotification,
  deleteAllReadNotifications,
} from "../services/notificationService";

function useNotifications(socketEvent) {
  const [notifications, setNotifications] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(false);

  /* =====================================================
     LOAD NOTIFICATIONS
  ===================================================== */

  async function loadNotifications() {
    try {
      setLoading(true);

      const data = await getNotifications();

      setNotifications(data);
    } catch (error) {
      console.error("Load notifications error:", error);
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     LOAD UNREAD COUNT
  ===================================================== */

  async function loadUnreadCount() {
    try {
      const data = await getUnreadNotificationCount();

      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Load notification unread count error:", error);
    }
  }

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadNotifications();

    loadUnreadCount();
  }, []);

  /* =====================================================
     REALTIME NOTIFICATION
  ===================================================== */

  useEffect(() => {
    if (!socketEvent) {
      return;
    }

    if (socketEvent.type !== "notification") {
      return;
    }

    const notification = socketEvent.notification;

    if (!notification) {
      return;
    }

    /* ===================================================
       CHECK EXISTING NOTIFICATION
    =================================================== */

    setNotifications((current) => {
      const exists = current.some(
        (item) => Number(item.id) === Number(notification.id),
      );

      /* ================================================
         NOTIFICATION ĐÃ TỒN TẠI
      ================================================= */

      if (exists) {
        return current
          .map((item) =>
            Number(item.id) === Number(notification.id) ? notification : item,
          )
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      /* ================================================
         NOTIFICATION MỚI
      ================================================= */

      return [notification, ...current];
    });

    /* ===================================================
       RELOAD UNREAD COUNT
    ================================================= */

    loadUnreadCount();
  }, [socketEvent]);

  /* =====================================================
     MARK AS READ
  ===================================================== */

  async function handleMarkAsRead(notificationId) {
    try {
      await markNotificationAsRead(notificationId);

      setNotifications((current) =>
        current.map((notification) =>
          Number(notification.id) === Number(notificationId)
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );

      await loadUnreadCount();
    } catch (error) {
      console.error("Mark notification as read error:", error);
    }
  }

  /* =====================================================
     MARK ALL AS READ
  ===================================================== */

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsAsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
    }
  }

  /* =====================================================
     OPEN NOTIFICATION
  ===================================================== */

  async function handleNotificationClick(notification) {
    try {
      /* ================================================
         MARK AS READ
      ================================================= */

      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);

        setNotifications((current) =>
          current.map((item) =>
            Number(item.id) === Number(notification.id)
              ? {
                  ...item,
                  isRead: true,
                }
              : item,
          ),
        );

        await loadUnreadCount();
      }

      /* ================================================
         GET TARGET
      ================================================= */

      const target = await getNotificationTarget(notification.id);

      return target;
    } catch (error) {
      console.error("Open notification error:", error);

      return null;
    }
  }

  /* =====================================================
     MARK USER NOTIFICATIONS AS READ
  ===================================================== */

  async function handleUserNotificationRead(userId) {
    try {
      /*
       * Lấy những notification
       * chưa đọc.
       */

      const unreadNotifications = notifications.filter(
        (notification) => !notification.isRead,
      );

      /*
       * Không có notification
       * chưa đọc thì không cần làm gì.
       */

      if (unreadNotifications.length === 0) {
        return;
      }

      /*
       * Lưu ID những notification
       * cần đánh dấu đã đọc.
       */

      const notificationIds = [];

      /*
       * Kiểm tra từng notification.
       *
       * Notification không lưu SenderId
       * nên lấy target từ Backend.
       */

      for (const notification of unreadNotifications) {
        try {
          const target = await getNotificationTarget(notification.id);

          /*
           * Chỉ xử lý chat riêng.
           */

          if (target?.conversationType !== "Private") {
            continue;
          }

          /*
           * Notification thuộc user
           * vừa được click.
           */

          if (Number(target.senderId) === Number(userId)) {
            notificationIds.push(notification.id);
          }
        } catch (error) {
          console.error("Get notification target error:", error);
        }
      }

      /*
       * Không có notification phù hợp.
       */

      if (notificationIds.length === 0) {
        return;
      }

      /*
       * Đánh dấu từng notification
       * là đã đọc.
       */

      await Promise.all(
        notificationIds.map((notificationId) =>
          markNotificationAsRead(notificationId),
        ),
      );

      /*
       * Cập nhật giao diện ngay.
       */

      setNotifications((current) =>
        current.map((notification) =>
          notificationIds.includes(notification.id)
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );

      /*
       * Lấy lại số unread chính xác
       * từ Backend.
       */

      await loadUnreadCount();
    } catch (error) {
      console.error("Mark user notifications as read error:", error);
    }
  }

  /* =====================================================
     DELETE NOTIFICATION
  ===================================================== */

  async function handleDeleteNotification(notificationId) {
    try {
      await deleteNotification(notificationId);

      setNotifications((current) =>
        current.filter(
          (notification) => Number(notification.id) !== Number(notificationId),
        ),
      );
    } catch (error) {
      console.error("Delete notification error:", error);
    }
  }

  /* =====================================================
   MARK DEPARTMENT NOTIFICATIONS AS READ
    ===================================================== */

  async function handleDepartmentNotificationRead() {
    try {
      const departmentNotifications = notifications.filter(
        (notification) =>
          !notification.isRead && notification.type === "DepartmentMessage",
      );

      if (departmentNotifications.length === 0) {
        return;
      }

      await Promise.all(
        departmentNotifications.map((notification) =>
          markNotificationAsRead(notification.id),
        ),
      );

      setNotifications((current) =>
        current.map((notification) =>
          notification.type === "DepartmentMessage"
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );

      await loadUnreadCount();
    } catch (error) {
      console.error("Mark department notifications as read error:", error);
    }
  }
  {
    /*Delete all read notifications */
  }
  async function handleDeleteAllReadNotifications() {
    try {
      await deleteAllReadNotifications();

      setNotifications((current) =>
        current.filter((notification) => !notification.isRead),
      );
    } catch (error) {
      console.error("Delete all read notifications error:", error);
    }
  }
  /* =====================================================
     RETURN
  ===================================================== */

  return {
    notifications,

    unreadCount,

    loading,

    handleMarkAsRead,

    handleMarkAllAsRead,

    handleNotificationClick,

    handleDeleteNotification,

    handleUserNotificationRead,

    handleDepartmentNotificationRead,

    handleDeleteAllReadNotifications,
  };
}

export default useNotifications;
