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

    const userId = Number(socketEvent.userId);

    const isOnline = Boolean(socketEvent.isOnline);

    console.log("USER STATUS:", {
      userId,
      isOnline,
      lastSeen: socketEvent.lastSeen,
    });

    setUsers((current) =>
      current.map((user) => {
        if (Number(user.id) !== userId) {
          return user;
        }

        /*
         * Chỉ cập nhật lastSeen
         * nếu Backend thực sự gửi.
         *
         * Tránh:
         *
         * lastSeen = undefined
         */
        const updatedUser = {
          ...user,

          isOnline,
        };

        if (socketEvent.lastSeen !== undefined) {
          updatedUser.lastSeen = socketEvent.lastSeen;
        }

        return updatedUser;
      }),
    );
  }, [socketEvent]);

  /* =====================================================
     CONVERSATION CHANGE
  ===================================================== */

  function handleConversationChange(conversationId) {
    activeConversationRef.current = conversationId;

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

    const message = socketEvent.message || socketEvent.data || socketEvent;

    if (!message) {
      return;
    }

    /*
     * ===================================================
     * OWN MESSAGE
     * ===================================================
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
     */

    if (Number(activeConversationRef.current) === conversationId) {
      return;
    }

    /*
     * ===================================================
     * DEPARTMENT MESSAGE
     * ===================================================
     */

    if (message.conversationType === "Department") {
      setDepartmentUnreadCount((current) => current + 1);

      return;
    }

    /*
     * ===================================================
     * PRIVATE MESSAGE
     * ===================================================
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

    setDepartmentConversation(null);
  }

  /* =====================================================
     SELECT DEPARTMENT
  ===================================================== */

  async function handleSelectDepartment() {
    try {
      const conversation = await getOrCreateDepartmentConversation();

      setDepartmentConversation(conversation);

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
