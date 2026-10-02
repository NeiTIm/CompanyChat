import { useEffect, useRef, useState } from "react";

import { getUsers } from "../services/userService";

import {
  getUnreadCounts,
  getOrCreateDepartmentConversation,
  getMyGroups,
} from "../services/conversationService";

function useChat(
  currentUser,
  socketEvent,
  websocket,
  websocketConnected,
) {
  /* =====================================================
     USERS
  ===================================================== */

  const [users, setUsers] = useState([]);

  const [selectedUser, setSelectedUser] =
    useState(null);

  /* =====================================================
     DEPARTMENT
  ===================================================== */

  const [departmentConversation, setDepartmentConversation] =
    useState(null);

  /* =====================================================
     GROUP
  ===================================================== */

  const [groups, setGroups] =
    useState([]);

  const [selectedGroup, setSelectedGroup] =
    useState(null);

  /* =====================================================
     UNREAD
  ===================================================== */

  const [unreadCounts, setUnreadCounts] =
    useState({});

  const [departmentUnreadCount, setDepartmentUnreadCount] =
    useState(0);

  const [groupUnreadCounts, setGroupUnreadCounts] =
    useState({});

  /* =====================================================
     ACTIVE CONVERSATION
  ===================================================== */

  const activeConversationRef =
    useRef(null);

  /* =====================================================
     LOAD DATA
  ===================================================== */

  useEffect(() => {
    loadUsers();
    loadGroups();
    loadUnreadCounts();
  }, []);

  /* =====================================================
     LOAD USERS
  ===================================================== */

  async function loadUsers() {
    try {
      const data = await getUsers();

      setUsers(data);
    } catch (error) {
      console.error(
        "Load users error:",
        error,
      );
    }
  }

  /* =====================================================
     LOAD GROUPS
  ===================================================== */

  async function loadGroups() {
    try {
      const data = await getMyGroups();

      setGroups(data);
    } catch (error) {
      console.error(
        "Load groups error:",
        error,
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

      const privateCounts = {};

      const groupCounts = {};

      let departmentCount = 0;

      data.forEach((item) => {
        /* ===============================================
           DEPARTMENT
        =============================================== */

        if (
          item.conversationType ===
          "Department"
        ) {
          departmentCount +=
            item.unreadCount;

          return;
        }

        /* ===============================================
           GROUP
        =============================================== */

        if (
          item.conversationType ===
          "Group"
        ) {
          groupCounts[
            item.conversationId
          ] = item.unreadCount;

          return;
        }

        /* ===============================================
           PRIVATE
        =============================================== */

        if (
          item.conversationType ===
          "Private"
        ) {
          privateCounts[
            item.userId
          ] = item.unreadCount;
        }
      });

      setUnreadCounts(
        privateCounts,
      );

      setDepartmentUnreadCount(
        departmentCount,
      );

      setGroupUnreadCounts(
        groupCounts,
      );
    } catch (error) {
      console.error(
        "Load unread counts error:",
        error,
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

    const userId = Number(
      socketEvent.userId,
    );

    const isOnline = Boolean(
      socketEvent.isOnline,
    );

    setUsers((current) =>
      current.map((user) => {
        if (
          Number(user.id) !==
          userId
        ) {
          return user;
        }

        const updatedUser = {
          ...user,
          isOnline,
        };

        if (
          socketEvent.lastSeen !==
          undefined
        ) {
          updatedUser.lastSeen =
            socketEvent.lastSeen;
        }

        return updatedUser;
      }),
    );
  }, [socketEvent]);

  /* =====================================================
     CONVERSATION CHANGE
  ===================================================== */

  function handleConversationChange(
    conversationId,
  ) {
    activeConversationRef.current =
      conversationId;

    if (
      !websocket ||
      websocket.readyState !==
        WebSocket.OPEN
    ) {
      return;
    }

    if (!conversationId) {
      return;
    }

    websocket.send(
      JSON.stringify({
        type: "conversation_change",

        conversationId:
          conversationId,
      }),
    );
  }

  /* =====================================================
     CONVERSATION READ
  ===================================================== */

  function handleConversationRead() {
    /* ===============================================
       DEPARTMENT
    =============================================== */

    if (
      departmentConversation &&
      !selectedUser &&
      !selectedGroup
    ) {
      setDepartmentUnreadCount(0);

      return;
    }

    /* ===============================================
       GROUP
    =============================================== */

    if (selectedGroup) {
      const conversationId =
        Number(
          selectedGroup.id ??
            selectedGroup.conversationId,
        );

      setGroupUnreadCounts(
        (current) => {
          const copy = {
            ...current,
          };

          delete copy[
            conversationId
          ];

          return copy;
        },
      );

      return;
    }

    /* ===============================================
       PRIVATE
    =============================================== */

    if (!selectedUser) {
      return;
    }

    setUnreadCounts(
      (current) => {
        const copy = {
          ...current,
        };

        delete copy[
          selectedUser.id
        ];

        return copy;
      },
    );
  }

  /* =====================================================
     UNREAD MESSAGE
  ===================================================== */

  useEffect(() => {
    if (!socketEvent) {
      return;
    }

    if (
      socketEvent.type !==
      "message"
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

    /* ===============================================
       OWN MESSAGE
    =============================================== */

    if (
      Number(message.senderId) ===
      Number(currentUser.id)
    ) {
      return;
    }

    /* ===============================================
       CONVERSATION ID
    =============================================== */

    const conversationId =
      Number(
        message.conversationId,
      );

    /* ===============================================
       ACTIVE CONVERSATION
    =============================================== */

    if (
      Number(
        activeConversationRef.current,
      ) === conversationId
    ) {
      return;
    }

    /* ===============================================
       DEPARTMENT
    =============================================== */

    if (
      message.conversationType ===
      "Department"
    ) {
      setDepartmentUnreadCount(
        (current) => current + 1,
      );

      return;
    }

    /* ===============================================
       GROUP
    =============================================== */

    if (
      message.conversationType ===
      "Group"
    ) {
      setGroupUnreadCounts(
        (current) => ({
          ...current,

          [conversationId]:
            (current[
              conversationId
            ] || 0) + 1,
        }),
      );

      return;
    }

    /* ===============================================
       PRIVATE
    =============================================== */

    if (
      message.conversationType ===
      "Private"
    ) {
      const senderId =
        Number(message.senderId);

      setUnreadCounts(
        (current) => ({
          ...current,

          [senderId]:
            (current[senderId] ||
              0) + 1,
        }),
      );
    }
  }, [
    socketEvent,
    currentUser.id,
  ]);

  /* =====================================================
     SELECT PRIVATE USER
  ===================================================== */

  function handleSelectUser(user) {
    setSelectedUser(user);

    setSelectedGroup(null);

    setDepartmentConversation(
      null,
    );
  }

  /* =====================================================
     SELECT DEPARTMENT
  ===================================================== */

  async function handleSelectDepartment() {
    try {
      const conversation =
        await getOrCreateDepartmentConversation();

      setDepartmentConversation(
        conversation,
      );

      setSelectedUser(null);

      setSelectedGroup(null);

      return conversation;
    } catch (error) {
      console.error(
        "Load department conversation error:",
        error,
      );

      throw error;
    }
  }

  /* =====================================================
     SELECT GROUP
  ===================================================== */

  function handleSelectGroup(group) {
    setSelectedGroup(group);

    setSelectedUser(null);

    setDepartmentConversation(
      null,
    );
  }

  /* =====================================================
     GROUP UPDATED
  ===================================================== */

  async function handleGroupUpdated() {
    /*
     * Reload lại danh sách group
     * để cập nhật memberCount.
     */

    await loadGroups();
  }

  /* =====================================================
     REMOVE GROUP
  ===================================================== */

  function handleGroupRemoved(
    conversationId,
  ) {
    const id = Number(
      conversationId,
    );

    /* ===============================================
       XÓA GROUP KHỎI SIDEBAR
    =============================================== */

    setGroups((current) =>
      current.filter(
        (group) =>
          Number(
            group.conversationId ??
              group.id,
          ) !== id,
      ),
    );

    /* ===============================================
       XÓA UNREAD
    =============================================== */

    setGroupUnreadCounts(
      (current) => {
        const copy = {
          ...current,
        };

        delete copy[id];

        return copy;
      },
    );

    /* ===============================================
       BỎ GROUP ĐANG CHỌN
    =============================================== */

    setSelectedGroup(
      (current) => {
        if (!current) {
          return null;
        }

        const currentId =
          Number(
            current.conversationId ??
              current.id,
          );

        if (
          currentId === id
        ) {
          return null;
        }

        return current;
      },
    );

    /* ===============================================
       RESET ACTIVE CONVERSATION
    =============================================== */

    activeConversationRef.current =
      null;
  }

  /* =====================================================
     RETURN
  ===================================================== */

  return {
    /* USERS */
    users,

    selectedUser,

    /* DEPARTMENT */
    departmentConversation,

    departmentUnreadCount,

    /* GROUP */
    groups,

    selectedGroup,

    groupUnreadCounts,

    /* PRIVATE UNREAD */
    unreadCounts,

    /* ACTIONS */
    handleSelectUser,

    handleSelectDepartment,

    handleSelectGroup,

    handleGroupUpdated,

    handleGroupRemoved,

    handleConversationRead,

    handleConversationChange,

    /* RELOAD */
    loadGroups,

    loadUsers,

    loadUnreadCounts,
  };
}

export default useChat;