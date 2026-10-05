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

/* =========================================================
   NORMALIZE NOTIFICATION
========================================================= */

function normalizeNotification(rawNotification) {
  if (!rawNotification) {
    return null;
  }

  return {
    id: rawNotification.id ?? rawNotification.Id,

    userId: rawNotification.userId ?? rawNotification.UserId,

    type: rawNotification.type ?? rawNotification.Type,

    title: rawNotification.title ?? rawNotification.Title,

    content: rawNotification.content ?? rawNotification.Content,

    conversationId:
      rawNotification.conversationId ?? rawNotification.ConversationId ?? null,

    messageId: rawNotification.messageId ?? rawNotification.MessageId ?? null,

    conversationType:
      rawNotification.conversationType ??
      rawNotification.ConversationType ??
      null,

    senderId: rawNotification.senderId ?? rawNotification.SenderId ?? null,

    /*
     * =====================================================
     * DEPARTMENT NAME
     * =====================================================
     *
     * Đây là phần trước đó bị thiếu.
     */
    departmentName:
      rawNotification.departmentName ?? rawNotification.DepartmentName ?? null,

    isRead: rawNotification.isRead ?? rawNotification.IsRead ?? false,

    readAt: rawNotification.readAt ?? rawNotification.ReadAt ?? null,

    createdAt: rawNotification.createdAt ?? rawNotification.CreatedAt ?? null,
  };
}

/* =========================================================
   HOOK
========================================================= */

function useNotifications(socketEvent) {
  const [notifications, setNotifications] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(false);

  /* =======================================================
     SORT
  ======================================================= */

  function sortNotifications(list) {
    return [...list].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );
  }

  /* =======================================================
     LOAD NOTIFICATIONS
  ======================================================= */

  async function loadNotifications() {
    try {
      setLoading(true);

      const data = await getNotifications();

      const normalized = Array.isArray(data)
        ? data.map(normalizeNotification).filter(Boolean)
        : [];

      setNotifications(sortNotifications(normalized));
    } catch (error) {
      console.error("Load notifications error:", error);
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     LOAD UNREAD COUNT
  ======================================================= */

  async function loadUnreadCount() {
    try {
      const data = await getUnreadNotificationCount();

      const count = Number(data?.unreadCount ?? data?.UnreadCount ?? 0);

      setUnreadCount(Number.isNaN(count) ? 0 : count);
    } catch (error) {
      console.error("Load notification unread count error:", error);
    }
  }

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  /* =======================================================
     REALTIME NOTIFICATION
  ======================================================= */

  useEffect(() => {
    if (!socketEvent) {
      return;
    }

    if (socketEvent.type !== "notification") {
      return;
    }

    const rawNotification =
      socketEvent.notification ?? socketEvent.Notification;

    const notification = normalizeNotification(rawNotification);

    if (!notification?.id) {
      return;
    }

    setNotifications((current) => {
      const existingIndex = current.findIndex(
        (item) => Number(item.id) === Number(notification.id),
      );

      /*
       * ===================================================
       * NOTIFICATION ĐÃ TỒN TẠI
       * ===================================================
       *
       * BE đang UPDATE notification cũ
       * thay vì tạo notification mới.
       */
      if (existingIndex >= 0) {
        const existing = current[existingIndex];

        const updated = [...current];

        updated[existingIndex] = notification;

        /*
         * Không tăng unreadCount ở đây.
         *
         * Badge sẽ được đồng bộ riêng
         * với DB.
         */
        return sortNotifications(updated);
      }

      /*
       * ===================================================
       * NOTIFICATION MỚI
       * ===================================================
       */

      return sortNotifications([notification, ...current]);
    });

    /*
     * =====================================================
     * BADGE
     * =====================================================
     *
     * Chỉ notification ID mới mới được xem là
     * notification mới.
     *
     * Sau đó lấy lại count từ BE để đảm bảo
     * frontend = database.
     */
    loadUnreadCount();
  }, [socketEvent]);

  /* =======================================================
     MARK ONE AS READ
  ======================================================= */

  async function handleMarkAsRead(notificationId) {
    try {
      const id = Number(notificationId);

      if (!id) {
        return;
      }

      const notification = notifications.find((item) => Number(item.id) === id);

      if (!notification) {
        return;
      }

      if (notification.isRead) {
        await loadUnreadCount();
        return;
      }

      await markNotificationAsRead(id);

      setNotifications((current) =>
        current.map((item) =>
          Number(item.id) === id
            ? {
                ...item,
                isRead: true,
              }
            : item,
        ),
      );

      /*
       * Không tự -1.
       *
       * Lấy số thực tế từ DB.
       */
      await loadUnreadCount();
    } catch (error) {
      console.error("Mark notification as read error:", error);
    }
  }

  /* =======================================================
     MARK ALL AS READ
  ======================================================= */

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsAsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );

      /*
       * Backend phải là source of truth.
       */
      await loadUnreadCount();
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
    }
  }

  /* =======================================================
     OPEN NOTIFICATION
  ======================================================= */

  async function handleNotificationClick(notification) {
    try {
      if (!notification?.id) {
        console.error("Notification ID is undefined:", notification);

        return null;
      }

      /*
       * ===================================================
       * MARK READ
       * ===================================================
       */

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
      }

      /*
       * ===================================================
       * ĐỒNG BỘ BADGE VỚI DATABASE
       * ===================================================
       */

      await loadUnreadCount();

      /*
       * ===================================================
       * GET TARGET
       * ===================================================
       */

      const target = await getNotificationTarget(notification.id);

      if (!target) {
        return null;
      }

      return {
        ...target,

        conversationId: target.conversationId ?? target.ConversationId,

        conversationType: target.conversationType ?? target.ConversationType,

        senderId: target.senderId ?? target.SenderId,

        userId: target.userId ?? target.UserId,
      };
    } catch (error) {
      console.error("Open notification error:", error);

      return null;
    }
  }

  /* =======================================================
     MARK PRIVATE NOTIFICATIONS AS READ
  ======================================================= */

  async function handleUserNotificationRead(userId) {
    try {
      const targetUserId = Number(userId);

      if (!targetUserId) {
        return;
      }

      const unreadNotifications = notifications.filter(
        (notification) => !notification.isRead,
      );

      if (unreadNotifications.length === 0) {
        await loadUnreadCount();
        return;
      }

      const notificationIds = [];

      for (const notification of unreadNotifications) {
        try {
          const target = await getNotificationTarget(notification.id);

          const conversationType =
            target?.conversationType ?? target?.ConversationType;

          const senderId = Number(target?.senderId ?? target?.SenderId ?? 0);

          if (conversationType === "Private" && senderId === targetUserId) {
            notificationIds.push(Number(notification.id));
          }
        } catch (error) {
          console.error("Get private notification target error:", error);
        }
      }

      if (notificationIds.length === 0) {
        await loadUnreadCount();
        return;
      }

      await Promise.all(
        notificationIds.map((id) => markNotificationAsRead(id)),
      );

      setNotifications((current) =>
        current.map((notification) =>
          notificationIds.includes(Number(notification.id))
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );

      /*
       * Luôn lấy lại count từ BE.
       */
      await loadUnreadCount();
    } catch (error) {
      console.error("Mark user notifications as read error:", error);
    }
  }

  /* =======================================================
     MARK DEPARTMENT NOTIFICATIONS AS READ
  ======================================================= */

  async function handleDepartmentNotificationRead() {
    try {
      const departmentNotifications = notifications.filter((notification) => {
        if (notification.isRead) {
          return false;
        }

        const type = notification.type;

        const conversationType = notification.conversationType;

        return (
          type === "DepartmentMessage" || conversationType === "Department"
        );
      });

      if (departmentNotifications.length === 0) {
        await loadUnreadCount();
        return;
      }

      await Promise.all(
        departmentNotifications.map((notification) =>
          markNotificationAsRead(notification.id),
        ),
      );

      const ids = departmentNotifications.map((notification) =>
        Number(notification.id),
      );

      setNotifications((current) =>
        current.map((notification) =>
          ids.includes(Number(notification.id))
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );

      /*
       * Không tự trừ.
       * Đồng bộ trực tiếp với DB.
       */
      await loadUnreadCount();
    } catch (error) {
      console.error("Mark department notifications as read error:", error);
    }
  }

  /* =======================================================
     DELETE NOTIFICATION
  ======================================================= */

  async function handleDeleteNotification(notificationId) {
    try {
      const id = Number(notificationId);

      if (!id) {
        return;
      }

      await deleteNotification(id);

      setNotifications((current) =>
        current.filter((item) => Number(item.id) !== id),
      );

      /*
       * Notification đã đọc mới được xóa
       * nên count thường không thay đổi.
       *
       * Tuy nhiên sync lại cho chắc chắn.
       */
      await loadUnreadCount();
    } catch (error) {
      console.error("Delete notification error:", error);
    }
  }

  /* =======================================================
     DELETE ALL READ NOTIFICATIONS
  ======================================================= */

  async function handleDeleteAllReadNotifications() {
    try {
      await deleteAllReadNotifications();

      setNotifications((current) =>
        current.filter((notification) => !notification.isRead),
      );

      await loadUnreadCount();
    } catch (error) {
      console.error("Delete all read notifications error:", error);
    }
  }

  /* =======================================================
     RETURN
  ======================================================= */

  return {
    notifications,
    unreadCount,
    loading,

    handleMarkAsRead,
    handleMarkAllAsRead,

    handleNotificationClick,

    handleDeleteNotification,
    handleDeleteAllReadNotifications,

    handleUserNotificationRead,
    handleDepartmentNotificationRead,

    loadNotifications,
    loadUnreadCount,
  };
}

export default useNotifications;
