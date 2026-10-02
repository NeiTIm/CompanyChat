import { useEffect, useState } from "react";

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationTarget,
} from "../services/notificationService";

function useNotifications(socketEvent) {
  const [notifications, setNotifications] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(false);

  /*
   * ==========================
   * LOAD NOTIFICATIONS
   * ==========================
   */

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

  /*
   * ==========================
   * LOAD UNREAD COUNT
   * ==========================
   */

  async function loadUnreadCount() {
    try {
      const data = await getUnreadNotificationCount();

      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Load notification unread count error:", error);
    }
  }

  /*
   * ==========================
   * INITIAL LOAD
   * ==========================
   */

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  /*
   * ==========================
   * REALTIME NOTIFICATION
   * ==========================
   */

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

    /*
     * Thêm notification mới lên đầu.
     */

    setNotifications((current) => [notification, ...current]);

    /*
     * Tăng số notification chưa đọc.
     */

    if (!notification.isRead) {
      setUnreadCount((current) => current + 1);
    }
  }, [socketEvent]);

  /*
   * ==========================
   * MARK AS READ
   * ==========================
   */

  async function handleMarkAsRead(notificationId) {
    try {
      await markNotificationAsRead(notificationId);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      console.error("Mark notification as read error:", error);
    }
  }

  /*
   * ==========================
   * MARK ALL AS READ
   * ==========================
   */

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
  /*
   * ==========================
   * HANDLE NOTIFICATION CLICK
   * ==========================
   * Khi click vào notification, đánh dấu là đã đọc (nếu chưa đọc) và lấy target của notification.
   * Trả về target để điều hướng đến trang tương ứng.
   * ==========================
   */
  async function handleNotificationClick(notification) {
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  isRead: true,
                }
              : item,
          ),
        );

        setUnreadCount((current) => Math.max(0, current - 1));
      }

      const target = await getNotificationTarget(notification.id);

      return target;
    } catch (error) {
      console.error("Open notification error:", error);

      return null;
    }
  }
  return {
    notifications,
    unreadCount,
    loading,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleNotificationClick,
  };
}

export default useNotifications;
