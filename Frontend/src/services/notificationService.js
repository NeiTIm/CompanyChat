import api from "../api";

export async function getNotifications() {
  const response = await api.get("/notifications");

  return response.data;
}

export async function getUnreadNotificationCount() {
  const response = await api.get("/notifications/unread-count");

  return response.data;
}

export async function markNotificationAsRead(notificationId) {
  const response = await api.post(`/notifications/${notificationId}/read`);

  return response.data;
}

export async function markAllNotificationsAsRead() {
  const response = await api.post("/notifications/read-all");

  return response.data;
}

export async function getNotificationTarget(notificationId) {
  const response = await api.get(`/notifications/${notificationId}/target`);

  return response.data;
}
export async function deleteNotification(notificationId) {
  const response = await api.delete(`/notifications/${notificationId}`);

  return response.data;
}
export async function deleteAllReadNotifications() {
  const response = await api.delete("/notifications/read");

  return response.data;
}
