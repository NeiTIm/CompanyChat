import api from "../api";

/* =========================================================
   CONVERSATION SERVICE
========================================================= */

/**
 * Lấy số lượng tin nhắn chưa đọc
 */
export async function getUnreadCounts() {
  const response = await api.get("/conversations/unread");

  return response.data;
}

/**
 * Tạo hoặc lấy conversation riêng tư
 */
export async function getPrivateConversation(userId) {
  const response = await api.post(`/conversations/private/${userId}`);

  return response.data;
}

/**
 * Lấy danh sách message của conversation
 */
export async function getConversationMessages(conversationId) {
  const response = await api.get(`/conversations/${conversationId}/messages`);

  return response.data;
}

/**
 * Đánh dấu conversation đã đọc
 */
export async function markConversationAsRead(conversationId) {
  const response = await api.post(`/conversations/${conversationId}/read`);

  return response.data;
}

/**
 * Xóa lịch sử conversation cho CURRENT USER
 *
 * Lưu ý:
 * - Không xóa Message khỏi database.
 * - Không ảnh hưởng người còn lại.
 * - Backend lưu HistoryDeletedAt cho CurrentUser.
 */
export async function deleteConversationHistory(conversationId) {
  const response = await api.delete(`/conversations/${conversationId}/history`);

  return response.data;
}
