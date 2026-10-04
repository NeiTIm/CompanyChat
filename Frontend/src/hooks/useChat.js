import { useEffect, useRef, useState } from "react";

import { getUsers } from "../services/userService";

import {
  getUnreadCounts,
  getOrCreateDepartmentConversation,
  getMyGroups,
} from "../services/conversationService";

function useChat(currentUser, socketEvent, websocket, websocketConnected) {
  /* =====================================================
     USERS
  ===================================================== */

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  /* =====================================================
     DEPARTMENT
  ===================================================== */

  const [departmentConversation, setDepartmentConversation] = useState(null);

  /* =====================================================
     GROUP
  ===================================================== */

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  /* =====================================================
     UNREAD
  ===================================================== */

  const [unreadCounts, setUnreadCounts] = useState({});
  const [departmentUnreadCount, setDepartmentUnreadCount] = useState(0);
  const [groupUnreadCounts, setGroupUnreadCounts] = useState({});

  /* =====================================================
     ACTIVE CONVERSATION
  ===================================================== */

  const activeConversationRef = useRef(null);

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

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load users error:", error);
    }
  }

  /* =====================================================
     LOAD GROUPS
  ===================================================== */

  async function loadGroups() {
    try {
      const data = await getMyGroups();

      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load groups error:", error);
    }
  }

  /* =====================================================
     LOAD UNREAD COUNTS
  ===================================================== */

  async function loadUnreadCounts() {
    try {
      const data = await getUnreadCounts();

      if (!Array.isArray(data)) {
        return;
      }

      const privateCounts = {};
      const groupCounts = {};

      let departmentCount = 0;

      data.forEach((item) => {
        const conversationType = item.conversationType ?? item.ConversationType;

        const conversationId = Number(
          item.conversationId ?? item.ConversationId ?? 0,
        );

        const userId = Number(item.userId ?? item.UserId ?? 0);

        const unreadCount = Number(item.unreadCount ?? item.UnreadCount ?? 0);

        if (unreadCount <= 0) {
          return;
        }

        /* ===============================================
           DEPARTMENT
        =============================================== */

        if (conversationType === "Department") {
          departmentCount += unreadCount;
          return;
        }

        /* ===============================================
           GROUP
        =============================================== */

        if (conversationType === "Group") {
          if (conversationId > 0) {
            groupCounts[conversationId] = unreadCount;
          }

          return;
        }

        /* ===============================================
           PRIVATE
        =============================================== */

        if (conversationType === "Private") {
          if (userId > 0) {
            privateCounts[userId] = unreadCount;
          }
        }
      });

      setUnreadCounts(privateCounts);
      setDepartmentUnreadCount(departmentCount);
      setGroupUnreadCounts(groupCounts);
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

    const userId = Number(socketEvent.userId ?? socketEvent.UserId);

    const isOnline = Boolean(socketEvent.isOnline ?? socketEvent.IsOnline);

    setUsers((current) =>
      current.map((user) => {
        if (Number(user.id) !== userId) {
          return user;
        }

        const updatedUser = {
          ...user,
          isOnline,
        };

        const lastSeen = socketEvent.lastSeen ?? socketEvent.LastSeen;

        if (lastSeen !== undefined) {
          updatedUser.lastSeen = lastSeen;
        }

        return updatedUser;
      }),
    );
  }, [socketEvent]);

  /* =====================================================
     CONVERSATION CHANGE
  ===================================================== */

  function handleConversationChange(conversationId) {
    const id = Number(conversationId);

    if (!id) {
      activeConversationRef.current = null;
      return;
    }

    activeConversationRef.current = id;

    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    websocket.send(
      JSON.stringify({
        type: "conversation_change",
        conversationId: id,
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

    if (departmentConversation && !selectedUser && !selectedGroup) {
      setDepartmentUnreadCount(0);

      return;
    }

    /* ===============================================
       GROUP
    =============================================== */

    if (selectedGroup) {
      const conversationId = Number(
        selectedGroup.conversationId ?? selectedGroup.id ?? 0,
      );

      if (!conversationId) {
        return;
      }

      setGroupUnreadCounts((current) => {
        const copy = { ...current };

        delete copy[conversationId];

        return copy;
      });

      return;
    }

    /* ===============================================
       PRIVATE
    =============================================== */

    if (selectedUser) {
      const userId = Number(selectedUser.id);

      if (!userId) {
        return;
      }

      setUnreadCounts((current) => {
        const copy = { ...current };

        delete copy[userId];

        return copy;
      });
    }
  }

  /* =====================================================
     RECEIVE MESSAGE → UPDATE UNREAD
  ===================================================== */

  useEffect(() => {
    if (!socketEvent) {
      return;
    }

    if (socketEvent.type !== "message") {
      return;
    }

    const rawMessage =
      socketEvent.message ??
      socketEvent.Message ??
      socketEvent.data ??
      socketEvent;

    if (!rawMessage) {
      return;
    }

    const senderId = Number(rawMessage.senderId ?? rawMessage.SenderId ?? 0);

    /* ===============================================
       IGNORE OWN MESSAGE
    =============================================== */

    if (senderId === Number(currentUser?.id)) {
      return;
    }

    const conversationId = Number(
      rawMessage.conversationId ?? rawMessage.ConversationId ?? 0,
    );

    if (!conversationId) {
      return;
    }

    const conversationType =
      rawMessage.conversationType ?? rawMessage.ConversationType;

    /* ===============================================
       ACTIVE CONVERSATION
    =============================================== */

    if (Number(activeConversationRef.current) === conversationId) {
      return;
    }

    /* ===============================================
       DEPARTMENT
    =============================================== */

    if (conversationType === "Department") {
      setDepartmentUnreadCount((current) => current + 1);

      return;
    }

    /* ===============================================
       GROUP
    =============================================== */

    if (conversationType === "Group") {
      setGroupUnreadCounts((current) => ({
        ...current,
        [conversationId]: (current[conversationId] || 0) + 1,
      }));

      return;
    }

    /* ===============================================
       PRIVATE
    =============================================== */

    if (conversationType === "Private") {
      setUnreadCounts((current) => ({
        ...current,
        [senderId]: (current[senderId] || 0) + 1,
      }));
    }
  }, [socketEvent, currentUser?.id]);

  /* =====================================================
     SELECT PRIVATE USER
  ===================================================== */

  function handleSelectUser(user) {
    setSelectedUser(user);

    setSelectedGroup(null);

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

      setSelectedGroup(null);

      return conversation;
    } catch (error) {
      console.error("Load department conversation error:", error);

      throw error;
    }
  }

  /* =====================================================
     SELECT GROUP
  ===================================================== */

  function handleSelectGroup(group) {
    if (!group) {
      return;
    }

    setSelectedGroup(group);

    setSelectedUser(null);

    setDepartmentConversation(null);

    /* ===============================================
       CLEAR GROUP UNREAD IMMEDIATELY
    =============================================== */

    const conversationId = Number(group.conversationId ?? group.id ?? 0);

    if (conversationId) {
      setGroupUnreadCounts((current) => {
        const copy = { ...current };

        delete copy[conversationId];

        return copy;
      });
    }
  }

  /* =====================================================
     GROUP UPDATED
  ===================================================== */

  async function handleGroupUpdated() {
    await loadGroups();
  }

  /* =====================================================
     REMOVE GROUP
  ===================================================== */

  function handleGroupRemoved(conversationId) {
    const id = Number(conversationId);

    if (!id) {
      return;
    }

    /* ===============================================
       REMOVE FROM GROUP LIST
    =============================================== */

    setGroups((current) =>
      current.filter(
        (group) => Number(group.conversationId ?? group.id) !== id,
      ),
    );

    /* ===============================================
       REMOVE GROUP UNREAD
    =============================================== */

    setGroupUnreadCounts((current) => {
      const copy = { ...current };

      delete copy[id];

      return copy;
    });

    /* ===============================================
       REMOVE SELECTED GROUP
    =============================================== */

    setSelectedGroup((current) => {
      if (!current) {
        return null;
      }

      const currentId = Number(current.conversationId ?? current.id ?? 0);

      if (currentId === id) {
        return null;
      }

      return current;
    });

    /* ===============================================
       RESET ACTIVE CONVERSATION
    =============================================== */

    if (Number(activeConversationRef.current) === id) {
      activeConversationRef.current = null;
    }
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

    /* PRIVATE */
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
