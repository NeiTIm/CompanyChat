import api from "../api";

/* =========================================================
   MESSAGE SERVICE
========================================================= */

/**
 * Xóa message ở phía người dùng hiện tại
 */
export async function deleteMessageForMe(
  messageId
) {
  const response =
    await api.delete(
      `/messages/${messageId}/me`
    );

  return response.data;
}

/**
 * Xóa message với mọi người
 */
export async function deleteMessageForEveryone(
  messageId
) {
  const response =
    await api.delete(
      `/messages/${messageId}/everyone`
    );

  return response.data;
}