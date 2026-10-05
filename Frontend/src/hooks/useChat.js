import { useEffect, useRef, useState } from "react";

import { getUsers } from "../services/userService";

import {
  getUnreadCounts,
  getMyDepartments,
  getOrCreateDepartmentConversationById,
  getMyGroups,
} from "../services/conversationService";

function useChat(currentUser, socketEvent, websocket, websocketConnected) {
  /* =====================================================
     USERS
  ===================================================== */

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  /* =====================================================
     DEPARTMENTS
  ===================================================== */

  const [departments, setDepartments] = useState([]);

  const [selectedDepartment, setSelectedDepartment] = useState(null);

  /* =====================================================
     GROUP
  ===================================================== */

  const [groups, setGroups] = useState([]);

  const [selectedGroup, setSelectedGroup] = useState(null);

  /* =====================================================
     UNREAD
  ===================================================== */

  const [unreadCounts, setUnreadCounts] = useState({});

  const [departmentUnreadCounts, setDepartmentUnreadCounts] = useState({});

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
    loadDepartments();
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
     LOAD DEPARTMENTS
  ===================================================== */

  async function loadDepartments() {
    try {
      const data = await getMyDepartments();

      if (!Array.isArray(data)) {
        setDepartments([]);

        return;
      }

      /*
       * Normalize Department.
       *
       * Backend có thể trả camelCase
       * hoặc PascalCase.
       */

      const normalized = data.map((department) => ({
        id: department.id ?? department.Id,

        name: department.name ?? department.Name,

        description: department.description ?? department.Description ?? "",

        isActive: department.isActive ?? department.IsActive ?? true,

        isPrimary: Boolean(department.isPrimary ?? department.IsPrimary),

        conversationId:
          department.conversationId ?? department.ConversationId ?? null,

        type: department.type ?? department.Type ?? "Department",

        createdAt: department.createdAt ?? department.CreatedAt ?? null,
      }));

      setDepartments(normalized);
    } catch (error) {
      console.error("Load departments error:", error);

      setDepartments([]);
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
      const departmentCounts = {};

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
          if (conversationId > 0) {
            departmentCounts[conversationId] = unreadCount;
          }

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

      setDepartmentUnreadCounts(departmentCounts);

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

    if (selectedDepartment && !selectedUser && !selectedGroup) {
      const conversationId = Number(
        selectedDepartment.conversationId ?? selectedDepartment.id ?? 0,
      );

      if (!conversationId) {
        return;
      }

      setDepartmentUnreadCounts((current) => {
        const copy = {
          ...current,
        };

        delete copy[conversationId];

        return copy;
      });

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
        const copy = {
          ...current,
        };

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
        const copy = {
          ...current,
        };

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
      setDepartmentUnreadCounts((current) => ({
        ...current,

        [conversationId]: (current[conversationId] || 0) + 1,
      }));

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

    setSelectedDepartment(null);

    setSelectedGroup(null);
  }

  /* =====================================================
     SELECT DEPARTMENT
  ===================================================== */

  async function handleSelectDepartment(department) {
    if (!department) {
      return;
    }

    const departmentId = Number(department.id);

    if (!departmentId) {
      console.error("Invalid department:", department);

      return;
    }

    try {
      /*
       * =================================================
       * ALWAYS GET / CREATE DEPARTMENT CONVERSATION
       * =================================================
       *
       * Không dùng conversationId có sẵn
       * để bỏ qua API.
       *
       * Backend sẽ đảm bảo:
       *
       * 1. Department tồn tại
       * 2. Department đang active
       * 3. User có quyền truy cập
       * 4. Conversation tồn tại
       * 5. CurrentUser là ConversationMember
       * 6. Các user thuộc Department được đồng bộ
       */

      const conversation =
        await getOrCreateDepartmentConversationById(departmentId);

      /*
       * =================================================
       * GET CONVERSATION ID
       * =================================================
       */

      const conversationId = Number(
        conversation?.conversationId ??
          conversation?.ConversationId ??
          conversation?.id ??
          conversation?.Id ??
          0,
      );

      if (!conversationId) {
        console.error("Invalid department conversation:", conversation);

        return;
      }

      /*
       * =================================================
       * NORMALIZE SELECTED DEPARTMENT
       * =================================================
       */

      const selected = {
        ...department,

        id: conversationId,

        conversationId,

        type: conversation?.type ?? conversation?.Type ?? "Department",

        departmentId: Number(
          conversation?.departmentId ??
            conversation?.DepartmentId ??
            departmentId,
        ),

        departmentName:
          conversation?.departmentName ??
          conversation?.DepartmentName ??
          department.name ??
          department.Name ??
          "Phòng ban",

        createdAt:
          conversation?.createdAt ??
          conversation?.CreatedAt ??
          department.createdAt ??
          null,

        isPrimary: Boolean(department.isPrimary ?? department.IsPrimary),
      };

      /*
       * =================================================
       * UPDATE DEPARTMENT LIST
       * =================================================
       */

      setDepartments((current) =>
        current.map((item) =>
          Number(item.id) === departmentId
            ? {
                ...item,

                conversationId,

                type: selected.type,

                departmentId: selected.departmentId,

                departmentName: selected.departmentName,

                createdAt: selected.createdAt,
              }
            : item,
        ),
      );

      /*
       * =================================================
       * SELECT DEPARTMENT
       * =================================================
       */

      setSelectedDepartment(selected);

      /*
       * =================================================
       * CLEAR OTHER CHAT TYPES
       * =================================================
       */

      setSelectedUser(null);

      setSelectedGroup(null);

      /*
       * =================================================
       * CLEAR UNREAD
       * =================================================
       */

      setDepartmentUnreadCounts((current) => {
        const copy = {
          ...current,
        };

        delete copy[conversationId];

        return copy;
      });

      return selected;
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

    setSelectedDepartment(null);

    /* ===============================================
       CLEAR GROUP UNREAD IMMEDIATELY
    =============================================== */

    const conversationId = Number(group.conversationId ?? group.id ?? 0);

    if (conversationId) {
      setGroupUnreadCounts((current) => {
        const copy = {
          ...current,
        };

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
      const copy = {
        ...current,
      };

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

    /* DEPARTMENTS */

    departments,
    selectedDepartment,

    departmentUnreadCounts,

    /*
     * Backward compatibility:
     *
     * ChatPage cũ vẫn có thể dùng
     * departmentConversation.
     */

    departmentConversation: selectedDepartment,

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

    loadDepartments,
    loadGroups,
    loadUsers,
    loadUnreadCounts,
  };
}

export default useChat;
