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
  const response = await api.get(`/conversations/${conversationId}/messages`, {
    params: {
      _: Date.now(),
    },
  });

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
 * - Không xóa Message khỏi database.
 * - Không ảnh hưởng người còn lại.
 * - Backend lưu HistoryDeletedAt cho CurrentUser.
 */
export async function deleteConversationHistory(conversationId) {
  const response = await api.delete(`/conversations/${conversationId}/history`);

  return response.data;
}

/* =========================================================
   DEPARTMENT CHAT
========================================================= */

/**
 * Lấy danh sách Department mà user hiện tại thuộc về.
 *
 * Bao gồm:
 * - Primary Department
 * - Additional Departments
 *
 * Backend:
 * GET /api/conversations/departments
 */
export async function getMyDepartments() {
  const response = await api.get("/conversations/departments");

  return response.data;
}

/**
 * Tạo hoặc lấy Department Conversation
 *
 * Dùng cho Primary Department.
 *
 * Giữ lại API cũ để không ảnh hưởng
 * các phần frontend hiện tại.
 */
export async function getOrCreateDepartmentConversation() {
  const response = await api.post("/conversations/department");

  return response.data;
}

/**
 * Tạo hoặc lấy Department Conversation
 * theo Department cụ thể.
 *
 * Hỗ trợ:
 * - Primary Department
 * - Additional Department
 */
export async function getOrCreateDepartmentConversationById(departmentId) {
  const response = await api.post(`/conversations/department/${departmentId}`);

  return response.data;
}

/* =========================================================
   GROUP CHAT
========================================================= */

/**
 * Lấy danh sách Group của user hiện tại
 */
export async function getMyGroups() {
  const response = await api.get("/conversations/groups");

  return response.data;
}

/**
 * Lấy thành viên của Group
 */
export async function getGroupMembers(conversationId) {
  const response = await api.get(`/conversations/${conversationId}/members`);

  return response.data;
}

/**
 * Tạo Group
 *
 * @param {string} name
 * @param {number[]} memberIds
 */
export async function createGroup(name, memberIds) {
  const response = await api.post("/conversations/group", {
    name,
    memberIds,
  });

  return response.data;
}

/**
 * Thêm thành viên vào Group
 *
 * @param {number} conversationId
 * @param {number} userId
 */
export async function addGroupMember(conversationId, userId) {
  const response = await api.post(`/conversations/${conversationId}/members`, {
    userId,
  });

  return response.data;
}

/**
 * Xóa thành viên khỏi Group
 *
 * @param {number} conversationId
 * @param {number} userId
 */
export async function removeGroupMember(conversationId, userId) {
  const response = await api.delete(
    `/conversations/${conversationId}/members`,
    {
      data: {
        userId,
      },
    },
  );

  return response.data;
}

/**
 * Đổi quyền thành viên
 *
 * Role:
 * - Admin
 * - Member
 */
export async function updateGroupMemberRole(conversationId, userId, role) {
  const response = await api.patch(
    `/conversations/${conversationId}/members/${userId}/role`,
    {
      role,
    },
  );

  return response.data;
}

/**
 * Rời Group
 */
export async function leaveGroup(conversationId) {
  const response = await api.delete(`/conversations/${conversationId}/leave`);

  return response.data;
}

/**
 * Chuyển quyền Owner
 */
export async function transferGroupOwnership(conversationId, userId) {
  const response = await api.patch(
    `/conversations/${conversationId}/transfer-owner/${userId}`,
  );

  return response.data;
}

/**
 * Xóa Group
 *
 * Chỉ Owner được phép.
 */
export async function deleteGroup(conversationId) {
  const response = await api.delete(`/conversations/${conversationId}`);

  return response.data;
}
