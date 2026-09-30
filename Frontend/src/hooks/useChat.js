import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getUsers,
} from "../services/userService";

import {
  getUnreadCounts,
} from "../services/conversationService";

function useChat(
  currentUser,
  socketEvent
) {
  const [users, setUsers] = useState([]);

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [unreadCounts, setUnreadCounts] =
    useState({});

  const activeConversationRef =
    useRef(null);

  /* =====================================================
     LOAD USERS
  ===================================================== */

  useEffect(() => {
    loadUsers();
    loadUnreadCounts();
  }, []);

  async function loadUsers() {
    try {
      const data =
        await getUsers();

      setUsers(data);
    } catch (error) {
      console.error(
        "Load users error:",
        error
      );
    }
  }

  /* =====================================================
     LOAD UNREAD COUNTS
  ===================================================== */

  async function loadUnreadCounts() {
    try {
      const data =
        await getUnreadCounts();

      const counts = {};

      data.forEach((item) => {
        counts[item.userId] =
          item.unreadCount;
      });

      setUnreadCounts(counts);
    } catch (error) {
      console.error(
        "Load unread counts error:",
        error
      );
    }
  }

  /* =====================================================
     USER STATUS
  ===================================================== */

  useEffect(() => {
    if (!socketEvent) {
      return;
    }

    if (
      socketEvent.type !==
      "user_status"
    ) {
      return;
    }

    setUsers((current) =>
      current.map((user) =>
        Number(user.id) ===
        Number(socketEvent.userId)
          ? {
              ...user,
              isOnline:
                socketEvent.isOnline,
              lastSeen:
                socketEvent.lastSeen,
            }
          : user
      )
    );
  }, [socketEvent]);

  /* =====================================================
     CONVERSATION
  ===================================================== */

  function handleConversationChange(
    conversationId
  ) {
    activeConversationRef.current =
      conversationId;
  }

  function handleConversationRead() {
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

    if (
      socketEvent.type !== "message"
    ) {
      return;
    }

    const message =
      socketEvent.message ||
      socketEvent.data ||
      socketEvent;

    if (!message) {
      return;
    }

    // Tin nhắn do chính mình gửi
    // không tính là unread
    if (
      Number(message.senderId) ===
      Number(currentUser.id)
    ) {
      return;
    }

    const conversationId =
      Number(
        message.conversationId
      );

    // Nếu đang mở đúng cuộc trò chuyện
    // thì ChatWindow đã mark read
    if (
      Number(
        activeConversationRef.current
      ) === conversationId
    ) {
      return;
    }

    const senderId =
      Number(message.senderId);

    setUnreadCounts((current) => ({
      ...current,

      [senderId]:
        (current[senderId] || 0) + 1,
    }));
  }, [
    socketEvent,
    currentUser.id,
  ]);

  /* =====================================================
     SELECT USER
  ===================================================== */

  function handleSelectUser(user) {
    setSelectedUser(user);
  }

  /* =====================================================
     RETURN
  ===================================================== */

  return {
    users,
    selectedUser,
    unreadCounts,

    handleSelectUser,
    handleConversationRead,
    handleConversationChange,
  };
}

export default useChat;