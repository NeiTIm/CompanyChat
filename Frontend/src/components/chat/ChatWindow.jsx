import {
  useEffect,
  useRef,
  useState,
} from "react";

import ChatModals from "./ChatModals";
import PrivateChatView from "./PrivateChatView";
import DepartmentChatView from "./DepartmentChatView";
import GroupChatView from "./GroupChatView";

import {
  getPrivateConversation,
  getConversationMessages,
  markConversationAsRead,
  deleteConversationHistory as deleteConversationHistoryService,
} from "../../services/conversationService";

import {
  deleteMessageForMe,
  deleteMessageForEveryone,
} from "../../services/messageService";

/* =========================================================
   CHAT WINDOW
========================================================= */

function ChatWindow({
  selectedUser,
  departmentConversation,
  selectedGroup,
  currentUser,
  websocket,
  websocketConnected,
  socketEvent,
  onConversationRead,
  onConversationChange,

  /* =========================
     GROUP
  ========================= */

  onGroupUpdated,
  onGroupRemoved,
}) {
  /* =======================================================
     STATE
  ======================================================= */

  const [conversation, setConversation] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [isTyping, setIsTyping] =
    useState(false);

  const [text, setText] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  /* =======================================================
     REPLY
  ======================================================= */

  const [replyingTo, setReplyingTo] =
    useState(null);

  /* =======================================================
     DELETE HISTORY
  ======================================================= */

  const [
    showDeleteHistoryModal,
    setShowDeleteHistoryModal,
  ] = useState(false);

  const [
    deletingHistory,
    setDeletingHistory,
  ] = useState(false);

  /* =======================================================
     DELETE MESSAGE
  ======================================================= */

  const [deleteMessage, setDeleteMessage] =
    useState(null);

  /* =======================================================
     GROUP DETAILS
  ======================================================= */

  const [
    showGroupDetails,
    setShowGroupDetails,
  ] = useState(false);

  /* =======================================================
     REFS
  ======================================================= */

  const conversationRef =
    useRef(null);

  const messagesEndRef =
    useRef(null);

  /* =======================================================
     CONVERSATION REF
  ======================================================= */

  useEffect(() => {
    conversationRef.current =
      conversation;
  }, [conversation]);

  /* =======================================================
     RESET GROUP DETAILS
  ======================================================= */

  useEffect(() => {
    if (!selectedGroup) {
      setShowGroupDetails(false);
    }
  }, [selectedGroup]);

  /* =======================================================
     RESET WHEN CHAT TARGET CHANGES
  ======================================================= */

  useEffect(() => {
    setIsTyping(false);
    setReplyingTo(null);
    setText("");

    /* =====================================================
       NO CHAT
    ===================================================== */

    if (
      !selectedUser &&
      !departmentConversation &&
      !selectedGroup
    ) {
      setConversation(null);

      conversationRef.current =
        null;

      setMessages([]);

      return;
    }

    /* =====================================================
       GROUP
    ===================================================== */

    if (
      selectedGroup &&
      !selectedUser &&
      !departmentConversation
    ) {
      loadGroupConversation(
        selectedGroup,
      );

      return;
    }

    /* =====================================================
       DEPARTMENT
    ===================================================== */

    if (
      departmentConversation &&
      !selectedUser &&
      !selectedGroup
    ) {
      loadDepartmentConversation(
        departmentConversation,
      );

      return;
    }

    /* =====================================================
       PRIVATE
    ===================================================== */

    if (selectedUser) {
      loadPrivateConversation(
        selectedUser.id,
      );
    }
  }, [
    selectedUser,
    departmentConversation,
    selectedGroup,
  ]);

  /* =======================================================
     LOAD PRIVATE
  ======================================================= */

  async function loadPrivateConversation(
    userId,
  ) {
    try {
      setLoading(true);

      const currentConversation =
        await getPrivateConversation(
          userId,
        );

      setConversation(
        currentConversation,
      );

      conversationRef.current =
        currentConversation;

      onConversationChange?.(
        currentConversation.id,
      );

      const loadedMessages =
        await getConversationMessages(
          currentConversation.id,
        );

      setMessages(
        loadedMessages,
      );

      await markConversationRead(
        currentConversation.id,
      );
    } catch (error) {
      console.error(
        "Load private conversation error:",
        error,
      );

      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     LOAD DEPARTMENT
  ======================================================= */

  async function loadDepartmentConversation(
    department,
  ) {
    if (!department) {
      return;
    }

    const conversationId =
      Number(
        department.conversationId ??
          department.id,
      );

    if (!conversationId) {
      console.error(
        "Invalid department conversation:",
        department,
      );

      setConversation(null);
      setMessages([]);

      return;
    }

    try {
      setLoading(true);

      const currentConversation = {
        id: conversationId,

        type:
          department.type ||
          "Department",

        departmentId:
          department.departmentId ??
          department.id,

        departmentName:
          department.departmentName ||
          department.name ||
          "Phòng ban",

        createdAt:
          department.createdAt,
      };

      setConversation(
        currentConversation,
      );

      conversationRef.current =
        currentConversation;

      onConversationChange?.(
        conversationId,
      );

      const loadedMessages =
        await getConversationMessages(
          conversationId,
        );

      setMessages(
        loadedMessages,
      );

      await markConversationRead(
        conversationId,
      );
    } catch (error) {
      console.error(
        "Load department conversation error:",
        error,
      );

      setConversation(null);

      conversationRef.current =
        null;

      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     LOAD GROUP
  ======================================================= */

  async function loadGroupConversation(
    group,
  ) {
    const conversationId =
      Number(
        group?.conversationId ??
          group?.id,
      );

    if (!conversationId) {
      return;
    }

    try {
      setLoading(true);

      const currentConversation = {
        id: conversationId,

        type:
          group.type ||
          "Group",

        name:
          group.name ||
          "Nhóm",

        createdBy:
          group.createdBy,

        createdAt:
          group.createdAt,

        memberCount:
          group.memberCount,
      };

      setConversation(
        currentConversation,
      );

      conversationRef.current =
        currentConversation;

      onConversationChange?.(
        conversationId,
      );

      const loadedMessages =
        await getConversationMessages(
          conversationId,
        );

      setMessages(
        loadedMessages,
      );

      await markConversationRead(
        conversationId,
      );
    } catch (error) {
      console.error(
        "Load group conversation error:",
        error,
      );

      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     SOCKET EVENTS
  ======================================================= */

  useEffect(() => {
    if (!socketEvent) {
      return;
    }

    /* =====================================================
       MESSAGE
    ===================================================== */

    if (
      socketEvent.type ===
      "message"
    ) {
      const rawMessage =
        socketEvent.message ||
        socketEvent.data ||
        socketEvent;

      if (!rawMessage) {
        return;
      }

      const rawReply =
        rawMessage.replyTo ??
        rawMessage.ReplyTo ??
        null;

      const incomingMessage = {
        ...rawMessage,

        id:
          rawMessage.id ??
          rawMessage.Id,

        conversationId:
          rawMessage.conversationId ??
          rawMessage.ConversationId,

        conversationType:
          rawMessage.conversationType ??
          rawMessage.ConversationType,

        senderId:
          rawMessage.senderId ??
          rawMessage.SenderId,

        senderName:
          rawMessage.senderName ??
          rawMessage.SenderName,

        content:
          rawMessage.content ??
          rawMessage.Content,

        replyToMessageId:
          rawMessage.replyToMessageId ??
          rawMessage.ReplyToMessageId ??
          null,

        replyTo: rawReply
          ? {
              ...rawReply,

              id:
                rawReply.id ??
                rawReply.Id,

              senderId:
                rawReply.senderId ??
                rawReply.SenderId,

              senderName:
                rawReply.senderName ??
                rawReply.SenderName,

              content:
                rawReply.content ??
                rawReply.Content,
            }
          : null,

        sentAt:
          rawMessage.sentAt ??
          rawMessage.SentAt,

        deliveryStatus:
          rawMessage.deliveryStatus ??
          rawMessage.DeliveryStatus,
      };

      const currentConversation =
        conversationRef.current;

      if (!currentConversation) {
        return;
      }

      /* ===================================================
         CHECK CONVERSATION
      =================================================== */

      if (
        Number(
          incomingMessage.conversationId,
        ) !==
        Number(
          currentConversation.id,
        )
      ) {
        return;
      }

      /* ===================================================
         OWN MESSAGE
      =================================================== */

      if (
        Number(
          incomingMessage.senderId,
        ) ===
        Number(currentUser.id)
      ) {
        setMessages((current) => {
          const pendingIndex =
            current.findIndex(
              (message) =>
                message.pending &&
                message.content ===
                  incomingMessage.content,
            );

          if (
            pendingIndex !==
            -1
          ) {
            const copy = [
              ...current,
            ];

            copy[pendingIndex] = {
              ...incomingMessage,

              pending: false,

              deliveryStatus:
                incomingMessage.deliveryStatus ||
                (incomingMessage.isDelivered
                  ? "delivered"
                  : "sent"),
            };

            return copy;
          }

          if (
            current.some(
              (message) =>
                Number(
                  message.id,
                ) ===
                Number(
                  incomingMessage.id,
                ),
            )
          ) {
            return current;
          }

          return [
            ...current,

            {
              ...incomingMessage,

              pending: false,

              deliveryStatus:
                incomingMessage.deliveryStatus ||
                (incomingMessage.isDelivered
                  ? "delivered"
                  : "sent"),
            },
          ];
        });

        return;
      }

      /* ===================================================
         OTHER USER MESSAGE
      =================================================== */

      setMessages((current) => {
        if (
          current.some(
            (message) =>
              Number(
                message.id,
              ) ===
              Number(
                incomingMessage.id,
              ),
          )
        ) {
          return current;
        }

        return [
          ...current,

          {
            ...incomingMessage,

            pending: false,
          },
        ];
      });

      markConversationRead(
        currentConversation.id,
      );

      return;
    }

    /* =====================================================
       MESSAGE STATUS
    ===================================================== */

    if (
      socketEvent.type ===
      "message_status"
    ) {
      const messageId =
        socketEvent.messageId ??
        socketEvent.MessageId;

      const status =
        socketEvent.status ??
        socketEvent.Status;

      if (
        !messageId ||
        !status
      ) {
        return;
      }

      setMessages((current) =>
        current.map(
          (message) =>
            Number(message.id) ===
            Number(messageId)
              ? {
                  ...message,

                  deliveryStatus:
                    status,

                  pending: false,
                }
              : message,
        ),
      );

      return;
    }

    /* =====================================================
       TYPING
    ===================================================== */

    if (
      socketEvent.type ===
      "typing"
    ) {
      const currentConversation =
        conversationRef.current;

      if (!currentConversation) {
        return;
      }

      if (
        Number(
          socketEvent.conversationId,
        ) !==
        Number(
          currentConversation.id,
        )
      ) {
        return;
      }

      if (
        Number(
          socketEvent.userId,
        ) ===
        Number(currentUser.id)
      ) {
        return;
      }

      setIsTyping(
        socketEvent.isTyping ===
          true,
      );

      return;
    }

    /* =====================================================
       TYPING START
    ===================================================== */

    if (
      socketEvent.type ===
      "typing_start"
    ) {
      const currentConversation =
        conversationRef.current;

      if (!currentConversation) {
        return;
      }

      if (
        Number(
          socketEvent.conversationId,
        ) !==
        Number(
          currentConversation.id,
        )
      ) {
        return;
      }

      if (
        Number(
          socketEvent.userId,
        ) ===
        Number(currentUser.id)
      ) {
        return;
      }

      setIsTyping(true);

      return;
    }

    /* =====================================================
       TYPING STOP
    ===================================================== */

    if (
      socketEvent.type ===
      "typing_stop"
    ) {
      const currentConversation =
        conversationRef.current;

      if (!currentConversation) {
        return;
      }

      if (
        Number(
          socketEvent.conversationId,
        ) !==
        Number(
          currentConversation.id,
        )
      ) {
        return;
      }

      if (
        Number(
          socketEvent.userId,
        ) ===
        Number(currentUser.id)
      ) {
        return;
      }

      setIsTyping(false);

      return;
    }

    /* =====================================================
       MESSAGE DELETED
    ===================================================== */

    if (
      socketEvent.type ===
      "message_deleted"
    ) {
      const messageId =
        socketEvent.messageId ??
        socketEvent.MessageId;

      const mode =
        socketEvent.mode ??
        socketEvent.Mode;

      if (!messageId) {
        return;
      }

      /* ===================================================
         DELETE FOR ME
      =================================================== */

      if (mode === "me") {
        setMessages((current) =>
          current.filter(
            (message) =>
              Number(
                message.id,
              ) !==
              Number(messageId),
          ),
        );

        return;
      }

      /* ===================================================
         DELETE FOR EVERYONE
      =================================================== */

      if (
        mode === "everyone"
      ) {
        setMessages((current) =>
          current.map(
            (message) =>
              Number(
                message.id,
              ) ===
              Number(messageId)
                ? {
                    ...message,

                    isDeleted:
                      true,

                    content:
                      "Tin nhắn đã bị xóa",
                  }
                : message,
          ),
        );
      }
    }
  }, [
    socketEvent,
    currentUser.id,
  ]);

  /* =======================================================
     MARK READ
  ======================================================= */

  async function markConversationRead(
    conversationId,
  ) {
    if (!conversationId) {
      return;
    }

    try {
      await markConversationAsRead(
        conversationId,
      );

      onConversationRead?.();

      /* ===================================================
         SEND READ EVENT
      =================================================== */

      if (
        websocket &&
        websocket.readyState ===
          WebSocket.OPEN
      ) {
        websocket.send(
          JSON.stringify({
            type: "read",

            conversationId,
          }),
        );
      }

      /* ===================================================
         UPDATE LOCAL MESSAGES
      =================================================== */

      setMessages((current) =>
        current.map(
          (message) => {
            if (
              Number(
                message.senderId,
              ) !==
              Number(
                currentUser.id,
              )
            ) {
              return {
                ...message,

                isRead: true,
              };
            }

            return message;
          },
        ),
      );
    } catch (error) {
      console.error(
        "Mark conversation read error:",
        error,
      );
    }
  }

  /* =======================================================
     AUTO SCROLL
  ======================================================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /* =======================================================
     REPLY
  ======================================================= */

  function handleReply(
    message,
  ) {
    if (!message) {
      return;
    }

    if (message.isDeleted) {
      return;
    }

    setReplyingTo(message);
  }

  function cancelReply() {
    setReplyingTo(null);
  }

  /* =======================================================
     SEND MESSAGE
  ======================================================= */

  function sendMessage() {
    const content =
      text.trim();

    if (!content) {
      return;
    }

    if (!conversation) {
      return;
    }

    if (
      !websocket ||
      websocket.readyState !==
        WebSocket.OPEN
    ) {
      return;
    }

    const currentReply =
      replyingTo;

    /* ===================================================
       RECEIVER ID
    =================================================== */

    const receiverId =
      selectedUser
        ? selectedUser.id
        : null;

    /* ===================================================
       OPTIMISTIC MESSAGE
    =================================================== */

    const optimisticMessage = {
      id: `temp-${Date.now()}`,

      conversationId:
        conversation.id,

      senderId:
        currentUser.id,

      senderName:
        currentUser.fullName ||
        currentUser.username,

      receiverId,

      content,

      sentAt:
        new Date().toISOString(),

      pending: true,

      deliveryStatus:
        "pending",

      isDeleted: false,

      replyToMessageId:
        currentReply?.id ||
        null,

      replyTo: currentReply
        ? {
            id:
              currentReply.id,

            senderId:
              currentReply.senderId,

            senderName:
              currentReply.senderName,

            content:
              currentReply.content,
          }
        : null,
    };

    setMessages((current) => [
      ...current,

      optimisticMessage,
    ]);

    setText("");

    setReplyingTo(null);

    /* ===================================================
       SEND THROUGH WEBSOCKET
    =================================================== */

    websocket.send(
      JSON.stringify({
        type: "message",

        conversationId:
          conversation.id,

        receiverId,

        content,

        replyToMessageId:
          currentReply?.id ||
          null,
      }),
    );
  }

  function handleSubmit(e) {
    e.preventDefault();

    sendMessage();
  }

  /* =======================================================
     DELETE MESSAGE FOR ME
  ======================================================= */

  async function handleDeleteForMe() {
    if (!deleteMessage) {
      return;
    }

    if (
      String(
        deleteMessage.id,
      ).startsWith("temp-")
    ) {
      setDeleteMessage(null);

      return;
    }

    try {
      await deleteMessageForMe(
        deleteMessage.id,
      );

      setMessages((current) =>
        current.filter(
          (message) =>
            Number(
              message.id,
            ) !==
            Number(
              deleteMessage.id,
            ),
        ),
      );

      setDeleteMessage(null);
    } catch (error) {
      console.error(
        "Delete message for me error:",
        error,
      );
    }
  }

  /* =======================================================
     DELETE MESSAGE FOR EVERYONE
  ======================================================= */

  async function handleDeleteForEveryone() {
    if (!deleteMessage) {
      return;
    }

    if (
      String(
        deleteMessage.id,
      ).startsWith("temp-")
    ) {
      setDeleteMessage(null);

      return;
    }

    try {
      await deleteMessageForEveryone(
        deleteMessage.id,
      );

      setMessages((current) =>
        current.map(
          (message) =>
            Number(
              message.id,
            ) ===
            Number(
              deleteMessage.id,
            )
              ? {
                  ...message,

                  isDeleted:
                    true,

                  content:
                    "Tin nhắn đã bị xóa",
                }
              : message,
        ),
      );

      setDeleteMessage(null);
    } catch (error) {
      console.error(
        "Delete message for everyone error:",
        error,
      );
    }
  }

  /* =======================================================
     DELETE CONVERSATION HISTORY
  ======================================================= */

  function deleteConversationHistory() {
    if (!conversation) {
      return;
    }

    setShowDeleteHistoryModal(
      true,
    );
  }

  async function confirmDeleteConversation() {
    if (!conversation?.id) {
      return;
    }

    try {
      setDeletingHistory(true);

      await deleteConversationHistoryService(
        conversation.id,
      );

      setMessages([]);

      setShowDeleteHistoryModal(
        false,
      );
    } catch (error) {
      console.error(
        "Delete conversation history error:",
        error,
      );

      alert(
        "Không thể xóa lịch sử cuộc trò chuyện.",
      );
    } finally {
      setDeletingHistory(false);
    }
  }

  /* =======================================================
     GROUP DETAILS
  ======================================================= */

  function handleOpenGroupDetails() {
    if (!selectedGroup) {
      return;
    }

    setShowGroupDetails(true);
  }

  function handleGroupUpdated() {
    onGroupUpdated?.();
  }

  function handleGroupRemoved() {
    const conversationId =
      selectedGroup?.conversationId ??
      selectedGroup?.id ??
      conversation?.id;

    setShowGroupDetails(false);

    onGroupRemoved?.(
      conversationId,
    );

    setConversation(null);

    conversationRef.current =
      null;

    setMessages([]);

    setReplyingTo(null);

    setText("");
  }

  /* =======================================================
     COMMON VIEW PROPS
  ======================================================= */

  const commonViewProps = {
    messages,
    loading,
    isTyping,
    messagesEndRef,
    currentUser,

    text,
    conversation,
    websocket,
    websocketConnected,

    replyingTo,

    onCancelReply:
      cancelReply,

    onChange: (e) =>
      setText(
        e.target.value,
      ),

    onSubmit:
      handleSubmit,

    onDelete:
      setDeleteMessage,

    onReply:
      handleReply,

    onDeleteHistory:
      deleteConversationHistory,
  };

  /* =======================================================
     NO CHAT SELECTED
  ======================================================= */

  if (
    !selectedUser &&
    !departmentConversation &&
    !selectedGroup
  ) {
    return (
      <main className="chat-empty">
        <div className="chat-empty-logo">
          C
        </div>

        <h2>
          Company Chat
        </h2>

        <p>
          Chọn một nhân viên, phòng ban
          hoặc nhóm để bắt đầu trò chuyện.
        </p>
      </main>
    );
  }

  /* =======================================================
     VIEW
  ======================================================= */

  let chatView = null;

  /* =====================================================
     GROUP
  ===================================================== */

  if (
    selectedGroup &&
    !selectedUser &&
    !departmentConversation
  ) {
    chatView = (
      <GroupChatView
        {...commonViewProps}
        selectedGroup={
          selectedGroup
        }
        onOpenGroupDetails={
          handleOpenGroupDetails
        }
      />
    );
  }

  /* =====================================================
     DEPARTMENT
  ===================================================== */

  else if (
    departmentConversation &&
    !selectedUser &&
    !selectedGroup
  ) {
    chatView = (
      <DepartmentChatView
        {...commonViewProps}
        departmentConversation={
          departmentConversation
        }
      />
    );
  }

  /* =====================================================
     PRIVATE
  ===================================================== */

  else if (selectedUser) {
    chatView = (
      <PrivateChatView
        {...commonViewProps}
        selectedUser={
          selectedUser
        }
      />
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {chatView}

      <ChatModals
        deleteMessage={
          deleteMessage
        }
        currentUser={
          currentUser
        }
        onCloseDeleteMessage={() =>
          setDeleteMessage(null)
        }
        onDeleteForMe={
          handleDeleteForMe
        }
        onDeleteForEveryone={
          handleDeleteForEveryone
        }

        showDeleteHistoryModal={
          showDeleteHistoryModal
        }
        onCloseDeleteHistory={() =>
          setShowDeleteHistoryModal(
            false,
          )
        }
        onConfirmDeleteHistory={
          confirmDeleteConversation
        }
        deletingHistory={
          deletingHistory
        }

        showGroupDetails={
          showGroupDetails
        }
        selectedGroup={
          selectedGroup
        }
        onCloseGroupDetails={() =>
          setShowGroupDetails(
            false,
          )
        }
        onGroupUpdated={
          handleGroupUpdated
        }
        onLeaveGroup={
          handleGroupRemoved
        }
        onDeleteGroup={
          handleGroupRemoved
        }
      />
    </>
  );
}

export default ChatWindow;