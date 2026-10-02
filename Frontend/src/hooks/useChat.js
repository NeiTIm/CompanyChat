import { useEffect, useRef, useState } from "react";

import { getUsers } from "../services/userService";

import {
  getUnreadCounts,
  getOrCreateDepartmentConversation,
} from "../services/conversationService";

function useChat(currentUser, socketEvent, websocket, websocketConnected) {
  const [users, setUsers] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);

  const [departmentConversation, setDepartmentConversation] = useState(null);

  const [unreadCounts, setUnreadCounts] = useState({});

  const [departmentUnreadCount, setDepartmentUnreadCount] = useState(0);

  const activeConversationRef = useRef(null);

  /* =====================================================
     LOAD USERS
  ===================================================== */

  useEffect(() => {
    loadUsers();
    loadUnreadCounts();
  }, []);

  async function loadUsers() {
    try {
      const data = await getUsers();

      setUsers(data);
    } catch (error) {
      console.error("Load users error:", error);
    }
  }

  /* =====================================================
     LOAD UNREAD COUNTS
  ===================================================== */

  async function loadUnreadCounts() {
    try {
      const data = await getUnreadCounts();

      const counts = {};

      let departmentCount = 0;

      data.forEach((item) => {
        /*
         * =================================================
         * DEPARTMENT
         * =================================================
         */

        if (item.conversationType === "Department") {
          departmentCount += item.unreadCount;

          return;
        }

        /*
         * =================================================
         * PRIVATE
         * =================================================
         */

        if (item.conversationType === "Private") {
          counts[item.userId] = item.unreadCount;
        }
      });

      setUnreadCounts(counts);

      setDepartmentUnreadCount(departmentCount);
    } catch (error) {
      console.error("Load unread counts error:", error);
    }
  }

  /* =====================================================
     USER STATUS
  ===================================================== */

  useEffect(() => {
    if (!socketEvent) {
      return;
    }

    if (socketEvent.type !== "user_status") {
      return;
    }

    setUsers((current) =>
      current.map((user) =>
        Number(user.id) === Number(socketEvent.userId)
          ? {
              ...user,

              isOnline: socketEvent.isOnline,

              lastSeen: socketEvent.lastSeen,
            }
          : user,
      ),
    );
  }, [socketEvent]);

  /* =====================================================
     CONVERSATION
  ===================================================== */

  function handleConversationChange(conversationId) {
    /*
     * Lưu conversation hiện tại
     * để xử lý unread message.
     */

    activeConversationRef.current = conversationId;

    /*
     * Báo cho Backend biết user
     * đang mở conversation nào.
     */

    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    if (!conversationId) {
      return;
    }

    websocket.send(
      JSON.stringify({
        type: "conversation_change",

        conversationId: conversationId,
      }),
    );
  }

  /* =====================================================
     CONVERSATION READ
  ===================================================== */

  function handleConversationRead() {
    /*
     * ===================================================
     * DEPARTMENT
     * ===================================================
     */

    if (departmentConversation && !selectedUser) {
      setDepartmentUnreadCount(0);

      return;
    }

    /*
     * ===================================================
     * PRIVATE
     * ===================================================
     */

    if (!selectedUser) {
      return;
    }

    setUnreadCounts((current) => {
      const copy = {
        ...current,
      };

      delete copy[selectedUser.id];

      return copy;
    });
  }

  /* =====================================================
     UNREAD MESSAGE
  ===================================================== */

  useEffect(() => {
    if (!socketEvent) {
      return;
    }

    if (socketEvent.type !== "message") {
      return;
    }

    /*
     * ===================================================
     * GET MESSAGE
     * ===================================================
     */

    const message = socketEvent.message || socketEvent.data || socketEvent;

    if (!message) {
      return;
    }

    /*
     * ===================================================
     * OWN MESSAGE
     * ===================================================
     *
     * Tin nhắn do chính mình gửi
     * không tính unread.
     */

    if (Number(message.senderId) === Number(currentUser.id)) {
      return;
    }

    /*
     * ===================================================
     * CONVERSATION ID
     * ===================================================
     */

    const conversationId = Number(message.conversationId);

    /*
     * ===================================================
     * ACTIVE CONVERSATION
     * ===================================================
     *
     * Nếu đang mở đúng conversation
     * thì ChatWindow đã xử lý mark read.
     */

    if (Number(activeConversationRef.current) === conversationId) {
      return;
    }

    /*
     * ===================================================
     * DEPARTMENT MESSAGE
     * ===================================================
     *
     * Nếu user không mở Department Chat
     * thì tăng badge Department.
     */

    if (message.conversationType === "Department") {
      setDepartmentUnreadCount((current) => current + 1);

      return;
    }

    /*
     * ===================================================
     * PRIVATE MESSAGE
     * ===================================================
     *
     * Badge sẽ được cộng cho người gửi.
     */

    if (message.conversationType === "Private") {
      const senderId = Number(message.senderId);

      setUnreadCounts((current) => ({
        ...current,

        [senderId]: (current[senderId] || 0) + 1,
      }));
    }
  }, [socketEvent, currentUser.id]);

  /* =====================================================
     SELECT PRIVATE USER
  ===================================================== */

  function handleSelectUser(user) {
    setSelectedUser(user);

    /*
     * Khi chọn Private Chat,
     * bỏ Department Chat.
     */

    setDepartmentConversation(null);
  }

  /* =====================================================
     SELECT DEPARTMENT
  ===================================================== */

  async function handleSelectDepartment() {
    try {
      const conversation = await getOrCreateDepartmentConversation();

      setDepartmentConversation(conversation);

      /*
       * Khi chọn Department Chat,
       * bỏ Private Chat.
       */

      setSelectedUser(null);

      return conversation;
    } catch (error) {
      console.error("Load department conversation error:", error);

      throw error;
    }
  }

  /* =====================================================
     RETURN
  ===================================================== */

  return {
    users,

    selectedUser,

    departmentConversation,

    unreadCounts,

    departmentUnreadCount,

    handleSelectUser,

    handleSelectDepartment,

    handleConversationRead,

    handleConversationChange,
  };
}

export default useChat;
