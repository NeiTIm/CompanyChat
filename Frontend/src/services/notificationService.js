import api from "../api";

/* =========================================================
   GET NOTIFICATIONS
========================================================= */

export async function getNotifications() {
  const response = await api.get("/notifications");

  return response.data;
}

/* =========================================================
   GET UNREAD COUNT
========================================================= */

export async function getUnreadNotificationCount() {
  const response = await api.get("/notifications/unread-count");

  return response.data;
}

/* =========================================================
   MARK ONE AS READ
========================================================= */

export async function markNotificationAsRead(notificationId) {
  const response = await api.post(`/notifications/${notificationId}/read`);

  return response.data;
}

/* =========================================================
   MARK ALL AS READ
========================================================= */

export async function markAllNotificationsAsRead() {
  const response = await api.post("/notifications/read-all");

  return response.data;
}

/* =========================================================
   GET NOTIFICATION TARGET
========================================================= */

export async function getNotificationTarget(notificationId) {
  const response = await api.get(`/notifications/${notificationId}/target`);

  return response.data;
}

/* =========================================================
   DELETE ONE
========================================================= */

export async function deleteNotification(notificationId) {
  const response = await api.delete(`/notifications/${notificationId}`);

  return response.data;
}

/* =========================================================
   DELETE ALL READ
========================================================= */

export async function deleteAllReadNotifications() {
  const response = await api.delete("/notifications/read");

  return response.data;
}
