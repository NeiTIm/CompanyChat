import {
  useEffect,
  useRef,
  useState,
} from "react";

import ChatHeader from "./ChatHeader";
import MessageItem from "./MessageItem";
import MessageComposer from "./MessageComposer";

import DeleteMessageModal from "../modal/DeleteMessageModal";
import DeleteHistoryModal from "../modal/DeleteHistoryModal";
import GroupDetailsModal from "../modal/GroupDetailsModal";

import Avatar from "../common/Avatar";
import TypingIndicator from "./TypingIndicator";

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

  /* =====================================================
     REPLY
  ===================================================== */

  const [replyingTo, setReplyingTo] =
    useState(null);

  /* =====================================================
     DELETE HISTORY
  ===================================================== */

  const [
    showDeleteHistoryModal,
    setShowDeleteHistoryModal,
  ] = useState(false);

  const [
    deletingHistory,
    setDeletingHistory,
  ] = useState(false);

  /* =====================================================
     DELETE MESSAGE
  ===================================================== */

  const [deleteMessage, setDeleteMessage] =
    useState(null);

  /* =====================================================
     GROUP DETAILS
  ===================================================== */

  const [
    showGroupDetails,
    setShowGroupDetails,
  ] = useState(false);

  /* =====================================================
     REFS
  ===================================================== */

  const conversationRef =
    useRef(null);

  const messagesEndRef =
    useRef(null);

  /* =====================================================
     CONVERSATION REF
  ===================================================== */

  useEffect(() => {
    conversationRef.current =
      conversation;
  }, [conversation]);

  /* =====================================================
     RESET GROUP DETAILS
  ===================================================== */

  useEffect(() => {
    if (!selectedGroup) {
      setShowGroupDetails(false);
    }
  }, [selectedGroup]);

  /* =====================================================
     RESET WHEN CHAT TARGET CHANGES
  ===================================================== */

  useEffect(() => {
    setIsTyping(false);
    setReplyingTo(null);
    setText("");

    /*
     * Không có chat nào được chọn.
     */

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

    /* ===================================================
       GROUP
    =================================================== */

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

    /* ===================================================
       DEPARTMENT
    =================================================== */

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

    /* ===================================================
       PRIVATE
    =================================================== */

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

  /* =====================================================
     LOAD PRIVATE CONVERSATION
  ===================================================== */

  async function loadPrivateConversation(
    userId,
  ) {
    try {
      setLoading(true);

      /* =================================================
         GET / CREATE PRIVATE CONVERSATION
      ================================================= */

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

      /* =================================================
         LOAD MESSAGES
      ================================================= */

      const messages =
        await getConversationMessages(
          currentConversation.id,
        );

      setMessages(messages);

      /* =================================================
         MARK READ
      ================================================= */

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

  /* =====================================================
     LOAD DEPARTMENT CONVERSATION
  ===================================================== */

  async function loadDepartmentConversation(
    department,
  ) {
    if (!department?.id) {
      return;
    }

    try {
      setLoading(true);

      /*
       * Department Conversation đã được
       * tạo/lấy từ useChat.
       */

      const currentConversation = {
        id: department.id,

        type:
          department.type ||
          "Department",

        departmentId:
          department.departmentId,

        departmentName:
          department.departmentName,

        createdAt:
          department.createdAt,
      };

      setConversation(
        currentConversation,
      );

      conversationRef.current =
        currentConversation;

      onConversationChange?.(
        currentConversation.id,
      );

      /* =================================================
         LOAD MESSAGES
      ================================================= */

      const messages =
        await getConversationMessages(
          currentConversation.id,
        );

      setMessages(messages);

      /* =================================================
         MARK READ
      ================================================= */

      await markConversationRead(
        currentConversation.id,
      );
    } catch (error) {
      console.error(
        "Load department conversation error:",
        error,
      );

      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     LOAD GROUP CONVERSATION
  ===================================================== */

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

      /*
       * Group đã được lấy từ useChat.
       *
       * Không cần gọi API tạo group.
       */

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

      /* =================================================
         LOAD MESSAGES
      ================================================= */

      const messages =
        await getConversationMessages(
          conversationId,
        );

      setMessages(messages);

      /* =================================================
         MARK READ
      ================================================= */

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

  /* =====================================================
     SOCKET EVENTS
  ===================================================== */

  useEffect(() => {
    if (!socketEvent) {
      return;
    }

    /* ===================================================
       MESSAGE
    =================================================== */

    if (
      socketEvent.type ===
      "message"
    ) {
      const incomingMessage =
        socketEvent.message ||
        socketEvent.data ||
        socketEvent;

      if (!incomingMessage) {
        return;
      }

      const currentConversation =
        conversationRef.current;

      if (!currentConversation) {
        return;
      }

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

      /* ================================================
         MESSAGE DO CHÍNH MÌNH GỬI
      ================================================ */

      if (
        Number(
          incomingMessage.senderId,
        ) ===
        Number(currentUser.id)
      ) {
        setMessages((current) => {
          /* --------------------------------------------
             TÌM OPTIMISTIC MESSAGE
          -------------------------------------------- */

          const pendingIndex =
            current.findIndex(
              (message) =>
                message.pending &&
                message.content ===
                  incomingMessage.content,
            );

          /* --------------------------------------------
             THAY OPTIMISTIC BẰNG MESSAGE THẬT
          -------------------------------------------- */

          if (pendingIndex !== -1) {
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

          /* --------------------------------------------
             MESSAGE ĐÃ TỒN TẠI
          -------------------------------------------- */

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

          /* --------------------------------------------
             KHÔNG CÒN OPTIMISTIC
          -------------------------------------------- */

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

      /* =================================================
         MESSAGE DO NGƯỜI KHÁC GỬI
      ================================================= */

      setMessages((current) => {
        /* ----------------------------------------------
           CHỐNG DUPLICATE
        ---------------------------------------------- */

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

      /* ----------------------------------------------
         MARK READ
      ---------------------------------------------- */

      markConversationRead(
        currentConversation.id,
      );

      return;
    }

    /* ===================================================
       MESSAGE STATUS
    =================================================== */

    if (
      socketEvent.type ===
      "message_status"
    ) {
      const messageId =
        socketEvent.messageId;

      const status =
        socketEvent.status;

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

    /* ===================================================
       TYPING
    =================================================== */

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

    /* ===================================================
       MESSAGE DELETED
    =================================================== */

    if (
      socketEvent.type ===
      "message_deleted"
    ) {
      const messageId =
        socketEvent.messageId;

      const mode =
        socketEvent.mode;

      if (!messageId) {
        return;
      }

      /* ----------------------------------------------
         DELETE FOR ME
      ---------------------------------------------- */

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

      /* ----------------------------------------------
         DELETE FOR EVERYONE
      ---------------------------------------------- */

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

  /* =====================================================
     MARK READ
  ===================================================== */

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

      /* ----------------------------------------------
         SEND READ EVENT
      ---------------------------------------------- */

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

      /* ----------------------------------------------
         UPDATE LOCAL MESSAGES
      ---------------------------------------------- */

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

  /* =====================================================
     AUTO SCROLL
  ===================================================== */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /* =====================================================
     REPLY
  ===================================================== */

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

  /* =====================================================
     SEND MESSAGE
  ===================================================== */

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

    /* ===================================================
       LƯU REPLY HIỆN TẠI
    =================================================== */

    const currentReply =
      replyingTo;

    /* ===================================================
       RECEIVER ID
    =================================================== */

    /*
     * Private:
     * receiverId = selectedUser.id
     *
     * Department:
     * receiverId = null
     *
     * Group:
     * receiverId = null
     */

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

    /* ===================================================
       THOÁT REPLY MODE
    =================================================== */

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

  /* =====================================================
     DELETE MESSAGE FOR ME
  ===================================================== */

  async function handleDeleteForMe() {
    if (!deleteMessage) {
      return;
    }

    /* ----------------------------------------------
       OPTIMISTIC MESSAGE
    ---------------------------------------------- */

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

  /* =====================================================
     DELETE MESSAGE FOR EVERYONE
  ===================================================== */

  async function handleDeleteForEveryone() {
    if (!deleteMessage) {
      return;
    }

    /* ----------------------------------------------
       OPTIMISTIC MESSAGE
    ---------------------------------------------- */

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

                  isDeleted: true,

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

  /* =====================================================
     DELETE CONVERSATION HISTORY
  ===================================================== */

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

  /* =====================================================
     GROUP DETAILS
  ===================================================== */

  function handleOpenGroupDetails() {
    if (!selectedGroup) {
      return;
    }

    setShowGroupDetails(true);
  }

  function handleGroupUpdated() {
    /*
     * GroupDetailsModal đã xử lý API.
     *
     * Báo cho ChatPage/useChat reload
     * danh sách group và memberCount.
     */

    onGroupUpdated?.();
  }

  function handleGroupRemoved() {
    /*
     * Lấy conversationId trước khi
     * selectedGroup bị xóa.
     */

    const conversationId =
      selectedGroup?.conversationId ??
      selectedGroup?.id ??
      conversation?.id;

    /* ----------------------------------------------
       ĐÓNG MODAL
    ---------------------------------------------- */

    setShowGroupDetails(false);

    /* ----------------------------------------------
       BÁO PARENT XÓA GROUP
    ---------------------------------------------- */

    onGroupRemoved?.(
      conversationId,
    );

    /* ----------------------------------------------
       XÓA LOCAL DATA
    ---------------------------------------------- */

    setConversation(null);

    conversationRef.current =
      null;

    setMessages([]);

    setReplyingTo(null);

    setText("");
  }

  /* =====================================================
     NO CHAT SELECTED
  ===================================================== */

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

  /* =====================================================
     GROUP CHAT
  ===================================================== */

  if (
    selectedGroup &&
    !selectedUser &&
    !departmentConversation
  ) {
    return (
      <>
        <main className="chat-container">

          {/* =================================================
              GROUP HEADER
          ================================================= */}

          <div className="chat-header group-chat-header">

            <div
              className="chat-header-user group-header-clickable"
              onClick={
                handleOpenGroupDetails
              }
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" ||
                  e.key === " "
                ) {
                  handleOpenGroupDetails();
                }
              }}
            >
              <div className="group-header-icon">

                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle
                    cx="9"
                    cy="8"
                    r="3"
                  />

                  <circle
                    cx="17"
                    cy="9"
                    r="2.5"
                  />

                  <path d="M3.5 20c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" />

                  <path d="M14 15c.8-.55 1.78-.87 2.83-.87 2.58 0 4.67 1.88 4.67 4.2" />
                </svg>

              </div>

              <div className="chat-header-info">

                <div className="chat-header-name">
                  {selectedGroup.name ||
                    "Nhóm"}
                </div>

                <div className="group-header-status">

                  <span className="group-status-dot" />

                  {selectedGroup.memberCount
                    ? `${selectedGroup.memberCount} thành viên`
                    : "Nhóm chat nội bộ"}

                </div>

              </div>

            </div>

            <div className="chat-header-actions">

              <div className="group-header-label">
                Group
              </div>

              <button
                type="button"
                className="header-delete-button"
                onClick={
                  deleteConversationHistory
                }
                title="Xóa lịch sử trò chuyện"
                aria-label="Xóa lịch sử trò chuyện"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 7h16" />

                  <path d="M9 7V4h6v3" />

                  <path d="M6.5 7 7 20h10l.5-13" />

                  <path d="M10 11v5" />

                  <path d="M14 11v5" />
                </svg>
              </button>

            </div>

          </div>

          {/* =================================================
              MESSAGES
          ================================================= */}

          <div className="messages-container">

            {loading ? (
              <div className="messages-loading">

                <span className="loading-spinner" />

                Đang tải tin nhắn...

              </div>
            ) : messages.length === 0 ? (
              <div className="no-messages">

                <div className="no-message-avatar group-empty-icon">

                  <svg
                    viewBox="0 0 24 24"
                    width="26"
                    height="26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle
                      cx="9"
                      cy="8"
                      r="3"
                    />

                    <circle
                      cx="17"
                      cy="9"
                      r="2.5"
                    />

                    <path d="M3.5 20c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" />

                    <path d="M14 15c.8-.55 1.78-.87 2.83-.87 2.58 0 4.67 1.88 4.67 4.2" />
                  </svg>

                </div>

                <h3>
                  {selectedGroup.name ||
                    "Nhóm"}
                </h3>

                <p>
                  Gửi tin nhắn đầu tiên
                  cho nhóm.
                </p>

              </div>
            ) : (
              messages.map(
                (message) => (
                  <MessageItem
                    key={
                      message.id
                    }
                    message={
                      message
                    }
                    currentUser={
                      currentUser
                    }
                    onDelete={
                      setDeleteMessage
                    }
                    onReply={
                      handleReply
                    }
                  />
                ),
              )
            )}

            {isTyping && (
              <TypingIndicator />
            )}

            <div
              ref={
                messagesEndRef
              }
            />

          </div>

          {/* =================================================
              GROUP COMPOSER
          ================================================= */}

          <MessageComposer
            text={text}
            selectedUser={{
              id: null,

              fullName:
                selectedGroup.name ||
                "Nhóm",

              username:
                selectedGroup.name ||
                "Nhóm",

              isOnline: true,
            }}
            conversation={
              conversation
            }
            websocket={
              websocket
            }
            websocketConnected={
              websocketConnected
            }
            replyingTo={
              replyingTo
            }
            onCancelReply={
              cancelReply
            }
            onChange={(e) =>
              setText(
                e.target.value,
              )
            }
            onSubmit={
              handleSubmit
            }
          />

        </main>

        {/* ===================================================
            DELETE MESSAGE MODAL
        =================================================== */}

        <DeleteMessageModal
          message={
            deleteMessage
          }
          currentUser={
            currentUser
          }
          onClose={() =>
            setDeleteMessage(null)
          }
          onDeleteForMe={
            handleDeleteForMe
          }
          onDeleteForEveryone={
            handleDeleteForEveryone
          }
        />

        {/* ===================================================
            DELETE HISTORY MODAL
        =================================================== */}

        {showDeleteHistoryModal && (
          <DeleteHistoryModal
            onClose={() =>
              setShowDeleteHistoryModal(
                false,
              )
            }
            onConfirm={
              confirmDeleteConversation
            }
            loading={
              deletingHistory
            }
          />
        )}

        {/* ===================================================
            GROUP DETAILS MODAL
        =================================================== */}

        {showGroupDetails &&
          selectedGroup && (
            <GroupDetailsModal
              group={
                selectedGroup
              }
              currentUser={
                currentUser
              }
              onClose={() =>
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
          )}

      </>
    );
  }

  /* =====================================================
     DEPARTMENT CHAT
  ===================================================== */

  if (
    departmentConversation &&
    !selectedUser &&
    !selectedGroup
  ) {
    return (
      <>
        <main className="chat-container">

          {/* =================================================
              DEPARTMENT HEADER
          ================================================= */}

          <div className="chat-header department-chat-header">

            <div className="chat-header-user">

              <div className="department-header-icon">

                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 21V5.5C4 4.67 4.67 4 5.5 4h8c.83 0 1.5.67 1.5 1.5V21" />

                  <path d="M15 9h3.5c.83 0 1.5.67 1.5 1.5V21" />

                  <path d="M8 8h3" />

                  <path d="M8 12h3" />

                  <path d="M8 16h3" />

                  <path d="M18 13h.01" />

                  <path d="M18 17h.01" />

                  <path d="M2.5 21h19" />
                </svg>

              </div>

              <div className="chat-header-info">

                <div className="chat-header-name">
                  {departmentConversation.departmentName ||
                    "Phòng ban"}
                </div>

                <div className="department-header-status">

                  <span className="department-status-dot" />

                  Phòng chat nội bộ

                </div>

              </div>

            </div>

            <div className="chat-header-actions">

              <div className="department-header-label">
                Internal
              </div>

              <button
                type="button"
                className="header-delete-button"
                onClick={
                  deleteConversationHistory
                }
                title="Xóa lịch sử trò chuyện"
                aria-label="Xóa lịch sử trò chuyện"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 7h16" />

                  <path d="M9 7V4h6v3" />

                  <path d="M6.5 7 7 20h10l.5-13" />

                  <path d="M10 11v5" />

                  <path d="M14 11v5" />
                </svg>
              </button>

            </div>

          </div>

          {/* =================================================
              MESSAGES
          ================================================= */}

          <div className="messages-container">

            {loading ? (
              <div className="messages-loading">

                <span className="loading-spinner" />

                Đang tải tin nhắn...

              </div>
            ) : messages.length === 0 ? (
              <div className="no-messages">

                <div className="no-message-avatar department-empty-icon">

                  <svg
                    viewBox="0 0 24 24"
                    width="26"
                    height="26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 21V5.5C4 4.67 4.67 4 5.5 4h8c.83 0 1.5.67 1.5 1.5V21" />

                    <path d="M15 9h3.5c.83 0 1.5.67 1.5 1.5V21" />

                    <path d="M8 8h3" />

                    <path d="M8 12h3" />

                    <path d="M8 16h3" />

                    <path d="M18 13h.01" />

                    <path d="M18 17h.01" />

                    <path d="M2.5 21h19" />
                  </svg>

                </div>

                <h3>
                  {departmentConversation.departmentName ||
                    "Phòng ban"}
                </h3>

                <p>
                  Gửi tin nhắn đầu tiên
                  cho phòng ban.
                </p>

              </div>
            ) : (
              messages.map(
                (message) => (
                  <MessageItem
                    key={
                      message.id
                    }
                    message={
                      message
                    }
                    currentUser={
                      currentUser
                    }
                    onDelete={
                      setDeleteMessage
                    }
                    onReply={
                      handleReply
                    }
                  />
                ),
              )
            )}

            {isTyping && (
              <TypingIndicator />
            )}

            <div
              ref={
                messagesEndRef
              }
            />

          </div>

          {/* =================================================
              DEPARTMENT COMPOSER
          ================================================= */}

          <MessageComposer
            text={text}
            selectedUser={{
              id: null,

              fullName:
                departmentConversation.departmentName ||
                "Phòng ban",

              username:
                departmentConversation.departmentName ||
                "Phòng ban",

              isOnline: true,
            }}
            conversation={
              conversation
            }
            websocket={
              websocket
            }
            websocketConnected={
              websocketConnected
            }
            replyingTo={
              replyingTo
            }
            onCancelReply={
              cancelReply
            }
            onChange={(e) =>
              setText(
                e.target.value,
              )
            }
            onSubmit={
              handleSubmit
            }
          />

        </main>

        {/* ===================================================
            DELETE MESSAGE MODAL
        =================================================== */}

        <DeleteMessageModal
          message={
            deleteMessage
          }
          currentUser={
            currentUser
          }
          onClose={() =>
            setDeleteMessage(null)
          }
          onDeleteForMe={
            handleDeleteForMe
          }
          onDeleteForEveryone={
            handleDeleteForEveryone
          }
        />

        {/* ===================================================
            DELETE HISTORY MODAL
        =================================================== */}

        {showDeleteHistoryModal && (
          <DeleteHistoryModal
            onClose={() =>
              setShowDeleteHistoryModal(
                false,
              )
            }
            onConfirm={
              confirmDeleteConversation
            }
            loading={
              deletingHistory
            }
          />
        )}

      </>
    );
  }

  /* =====================================================
     PRIVATE CHAT
  ===================================================== */

  return (
    <>
      <main className="chat-container">

        <ChatHeader
          selectedUser={
            selectedUser
          }
          websocketConnected={
            websocketConnected
          }
          onDeleteHistory={
            deleteConversationHistory
          }
        />

        <div className="messages-container">

          {loading ? (
            <div className="messages-loading">

              <span className="loading-spinner" />

              Đang tải tin nhắn...

            </div>
          ) : messages.length === 0 ? (
            <div className="no-messages">

              <div className="no-message-avatar">

                <Avatar
                  user={
                    selectedUser
                  }
                  size="large"
                  showStatus
                />

              </div>

              <h3>
                Bắt đầu trò chuyện với{" "}
                {selectedUser.fullName ||
                  selectedUser.username}
              </h3>

              <p>
                Gửi tin nhắn đầu tiên để
                bắt đầu cuộc trò chuyện.
              </p>

            </div>
          ) : (
            messages.map(
              (message) => (
                <MessageItem
                  key={
                    message.id
                  }
                  message={
                    message
                  }
                  currentUser={
                    currentUser
                  }
                  onDelete={
                    setDeleteMessage
                  }
                  onReply={
                    handleReply
                  }
                />
              ),
            )
          )}

          {isTyping && (
            <TypingIndicator />
          )}

          <div
            ref={
              messagesEndRef
            }
          />

        </div>

        {/* =================================================
            PRIVATE COMPOSER
        ================================================= */}

        <MessageComposer
          text={text}
          selectedUser={
            selectedUser
          }
          conversation={
            conversation
          }
          websocket={
            websocket
          }
          websocketConnected={
            websocketConnected
          }
          replyingTo={
            replyingTo
          }
          onCancelReply={
            cancelReply
          }
          onChange={(e) =>
            setText(
              e.target.value,
            )
          }
          onSubmit={
            handleSubmit
          }
        />

      </main>

      {/* ===================================================
          DELETE MESSAGE MODAL
      =================================================== */}

      <DeleteMessageModal
        message={
          deleteMessage
        }
        currentUser={
          currentUser
        }
        onClose={() =>
          setDeleteMessage(null)
        }
        onDeleteForMe={
          handleDeleteForMe
        }
        onDeleteForEveryone={
          handleDeleteForEveryone
        }
      />

      {/* ===================================================
          DELETE HISTORY MODAL
      =================================================== */}

      {showDeleteHistoryModal && (
        <DeleteHistoryModal
          onClose={() =>
            setShowDeleteHistoryModal(
              false,
            )
          }
          onConfirm={
            confirmDeleteConversation
          }
          loading={
            deletingHistory
          }
        />
      )}

    </>
  );
}

export default ChatWindow;