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
  currentUser,
  websocket,
  websocketConnected,
  socketEvent,
  onConversationRead,
  onConversationChange,
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

  const [
    showDeleteHistoryModal,
    setShowDeleteHistoryModal,
  ] = useState(false);

  const [
    deletingHistory,
    setDeletingHistory,
  ] = useState(false);

  const [deleteMessage, setDeleteMessage] =
    useState(null);

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
     LOAD CONVERSATION
  ===================================================== */

    useEffect(() => {
    setIsTyping(false);

    if (!selectedUser) {
        setConversation(null);

        conversationRef.current =
        null;

        setMessages([]);

        return;
    }

    loadConversation(
        selectedUser.id
    );
    }, [selectedUser]);

  async function loadConversation(
    userId
  ) {
    try {
      setLoading(true);

      /* =================================================
         GET / CREATE PRIVATE CONVERSATION
      ================================================= */

      const currentConversation =
        await getPrivateConversation(
          userId
        );

      setConversation(
        currentConversation
      );

      conversationRef.current =
        currentConversation;

      onConversationChange?.(
        currentConversation.id
      );

      /* =================================================
         LOAD MESSAGES
      ================================================= */

      const messages =
        await getConversationMessages(
          currentConversation.id
        );

      setMessages(messages);

      /* =================================================
         MARK READ
      ================================================= */

      await markConversationRead(
        currentConversation.id
      );

    } catch (error) {
      console.error(
        "Load conversation error:",
        error
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
      socketEvent.type === "message"
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
          incomingMessage.conversationId
        ) !==
        Number(
          currentConversation.id
        )
      ) {
        return;
      }

      /* ================================================
         MESSAGE DO CHÍNH MÌNH GỬI
      ================================================= */

      if (
        Number(
          incomingMessage.senderId
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
                  incomingMessage.content
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
                Number(message.id) ===
                Number(
                  incomingMessage.id
                )
            )
          ) {
            return current;
          }

          /* --------------------------------------------
             TRƯỜNG HỢP KHÔNG CÒN OPTIMISTIC
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
              Number(message.id) ===
              Number(
                incomingMessage.id
              )
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
        currentConversation.id
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

      if (!messageId || !status) {
        return;
      }

      setMessages((current) =>
        current.map((message) =>
          Number(message.id) ===
          Number(messageId)
            ? {
                ...message,
                deliveryStatus:
                  status,
                pending: false,
              }
            : message
        )
      );

      return;
    }
    if (
  socketEvent.type === "typing"
) {
  const currentConversation =
    conversationRef.current;

  if (!currentConversation) {
    return;
  }

  if (
    Number(
      socketEvent.conversationId
    ) !==
    Number(
      currentConversation.id
    )
  ) {
    return;
  }

  if (
    Number(socketEvent.userId) ===
    Number(currentUser.id)
  ) {
    return;
  }

  setIsTyping(
    socketEvent.isTyping === true
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
              Number(message.id) !==
              Number(messageId)
          )
        );

        return;
      }

      /* ----------------------------------------------
         DELETE FOR EVERYONE
      ---------------------------------------------- */

      if (mode === "everyone") {
        setMessages((current) =>
          current.map(
            (message) =>
              Number(message.id) ===
              Number(messageId)
                ? {
                    ...message,
                    isDeleted: true,
                    content:
                      "Tin nhắn đã bị xóa",
                  }
                : message
          )
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
    conversationId
  ) {
    if (!conversationId) {
      return;
    }

    try {
      await markConversationAsRead(
        conversationId
      );

      onConversationRead?.();

      /* ----------------------------------------------
         SEND READ EVENT THROUGH WEBSOCKET
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
          })
        );
      }

      /* ----------------------------------------------
         UPDATE LOCAL MESSAGES
      ---------------------------------------------- */

      setMessages((current) =>
        current.map((message) => {
          if (
            Number(message.senderId) !==
            Number(currentUser.id)
          ) {
            return {
              ...message,
              isRead: true,
            };
          }

          return message;
        })
      );

    } catch (error) {
      console.error(
        "Mark conversation read error:",
        error
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

      receiverId:
        selectedUser.id,

      content,

      sentAt:
        new Date().toISOString(),

      pending: true,

      deliveryStatus:
        "pending",

      isDeleted: false,
    };

    setMessages((current) => [
      ...current,
      optimisticMessage,
    ]);

    setText("");

    /* ===================================================
       SEND THROUGH WEBSOCKET
    =================================================== */

    websocket.send(
      JSON.stringify({
        type: "message",

        conversationId:
          conversation.id,

        receiverId:
          selectedUser.id,

        content,
      })
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
        deleteMessage.id
      ).startsWith("temp-")
    ) {
      setDeleteMessage(null);

      return;
    }

    try {
      await deleteMessageForMe(
        deleteMessage.id
      );

      setMessages((current) =>
        current.filter(
          (message) =>
            Number(message.id) !==
            Number(deleteMessage.id)
        )
      );

      setDeleteMessage(null);

    } catch (error) {
      console.error(
        "Delete message for me error:",
        error
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
        deleteMessage.id
      ).startsWith("temp-")
    ) {
      setDeleteMessage(null);

      return;
    }

    try {
      await deleteMessageForEveryone(
        deleteMessage.id
      );

      setMessages((current) =>
        current.map(
          (message) =>
            Number(message.id) ===
            Number(deleteMessage.id)
              ? {
                  ...message,
                  isDeleted: true,
                  content:
                    "Tin nhắn đã bị xóa",
                }
              : message
        )
      );

      setDeleteMessage(null);

    } catch (error) {
      console.error(
        "Delete message for everyone error:",
        error
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
      true
    );
  }

  async function confirmDeleteConversation() {
    if (!conversation?.id) {
      return;
    }

    try {
      setDeletingHistory(true);

      await deleteConversationHistoryService(
        conversation.id
      );

      setMessages([]);

      setShowDeleteHistoryModal(
        false
      );

    } catch (error) {
      console.error(
        "Delete conversation history error:",
        error
      );

      alert(
        "Không thể xóa lịch sử cuộc trò chuyện."
      );

    } finally {
      setDeletingHistory(false);
    }
  }

  /* =====================================================
     NO USER SELECTED
  ===================================================== */

  if (!selectedUser) {
    return (
      <main className="chat-empty">

        <div className="chat-empty-logo">
          C
        </div>

        <h2>
          Company Chat
        </h2>

        <p>
          Chọn một nhân viên ở bên trái
          để bắt đầu trò chuyện.
        </p>

      </main>
    );
  }

  /* =====================================================
     MAIN CHAT
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
                  user={selectedUser}
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
                Gửi tin nhắn đầu tiên để bắt đầu
                cuộc trò chuyện.
              </p>

            </div>

          ) : (
            messages.map(
              (message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  currentUser={
                    currentUser
                  }
                  onDelete={
                    setDeleteMessage
                  }
                />
              )
            )
          )}
            {isTyping && (
                <TypingIndicator />
)}
          <div
            ref={messagesEndRef}
          />

        </div>

        {/* =================================================
            COMPOSER
        ================================================= */}

            <MessageComposer
                text={text}
                selectedUser={selectedUser}
                conversation={conversation}
                websocket={websocket}
                websocketConnected={
                    websocketConnected
                }
                onChange={(e) =>
                    setText(e.target.value)
                }
                onSubmit={handleSubmit}
                />

      </main>

      {/* ===================================================
          DELETE MESSAGE MODAL
      =================================================== */}

      <DeleteMessageModal
        message={deleteMessage}
        currentUser={currentUser}
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
              false
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