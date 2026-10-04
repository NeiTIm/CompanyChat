import api from "../api";

/* =========================================================
   MESSAGE SERVICE
========================================================= */

/**
 * Xóa message ở phía người dùng hiện tại
 */
export async function deleteMessageForMe(messageId) {
  const response = await api.delete(`/messages/${messageId}/me`);

  return response.data;
}

/**
 * Xóa tin nhắn với mọi người
 *
 * - Chỉ người gửi tin nhắn mới được phép.
 * - Backend đánh dấu IsDeleted.
 * - Backend gửi WebSocket message_deleted
 *   cho tất cả thành viên conversation.
 */
export async function deleteMessageForEveryone(messageId) {
  const response = await api.delete(
    `/conversations/messages/${messageId}/everyone`,
  );

  return response.data;
}
