import api, { API_URL } from "../../api";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import ChatHeader from "./ChatHeader";
import MessageItem from "./MessageItem";
import DeliveryLegend from "./DeliveryLegend";
import DeleteMessageModal from "../modal/DeleteMessageModal";
import DeleteHistoryModal from "../modal/DeleteHistoryModal";
import Avatar from "../common/Avatar";

import { formatTime } from "../../utils/dateUtils";
import { getDeliveryStatus } from "../../utils/messageUtils";
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

  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const [loading, setLoading] = useState(false);

  const [showDeleteHistoryModal, setShowDeleteHistoryModal] =
    useState(false);

  const [deletingHistory, setDeletingHistory] =
    useState(false);

  const [deleteMessage, setDeleteMessage] =
    useState(null);

  const conversationRef = useRef(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  /* =====================================================
     LOAD CONVERSATION
  ===================================================== */

  useEffect(() => {
    if (!selectedUser) {
      setConversation(null);
      conversationRef.current = null;
      setMessages([]);
      return;
    }

    loadConversation(selectedUser.id);
  }, [selectedUser]);

  async function loadConversation(userId) {
    try {
      setLoading(true);

      const conversationResponse =
        await api.post(
          `/conversations/private/${userId}`
        );

      const currentConversation =
        conversationResponse.data;

      setConversation(currentConversation);

        conversationRef.current =
          currentConversation;

        onConversationChange?.(
          currentConversation.id
        );

      const messagesResponse =
        await api.get(
          `/conversations/${currentConversation.id}/messages`
        );

      setMessages(messagesResponse.data);

      await markConversationAsRead(
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

    /* MESSAGE */

    if (socketEvent.type === "message") {
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
    Number(incomingMessage.conversationId) !==
    Number(currentConversation.id)
  ) {
    return;
  }

  // Tin nhắn do chính mình gửi
  if (
    Number(incomingMessage.senderId) ===
    Number(currentUser.id)
  ) {
    setMessages((current) => {
      // Tìm tin nhắn optimistic đang chờ
      const pendingIndex =
        current.findIndex(
          (message) =>
            message.pending &&
            message.content ===
              incomingMessage.content
        );

      // Nếu tìm thấy tin nhắn tạm
      // => thay nó bằng message thật từ server
      if (pendingIndex !== -1) {
        const copy = [...current];

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

      // Nếu message thật đã tồn tại
      // => không thêm lần nữa
      if (
        current.some(
          (message) =>
            Number(message.id) ===
            Number(incomingMessage.id)
        )
      ) {
        return current;
      }

      // Trường hợp không còn optimistic message
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

  // Tin nhắn do người khác gửi
  setMessages((current) => {
    // Nếu đã có message này thì không thêm lại
    if (
      current.some(
        (message) =>
          Number(message.id) ===
          Number(incomingMessage.id)
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

  markConversationAsRead(
    currentConversation.id
  );

  return;
}

    /* MESSAGE STATUS */

    if (
      socketEvent.type === "message_status"
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
                deliveryStatus: status,
                pending: false,
              }
            : message
        )
      );

      return;
    }

    /* MESSAGE DELETED */

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

      if (mode === "everyone") {
        setMessages((current) =>
          current.map((message) =>
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

  async function markConversationAsRead(
    conversationId
  ) {
    if (!conversationId) {
      return;
    }

    try {
      await api.post(
        `/conversations/${conversationId}/read`
      );
      onConversationRead?.();
      if (
        websocket &&
        websocket.readyState === WebSocket.OPEN
      ) {
        websocket.send(
          JSON.stringify({
            type: "read",
            conversationId,
          })
        );
      }

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
    const content = text.trim();

    if (!content) {
      return;
    }

    if (!conversation) {
      return;
    }

    if (
      !websocket ||
      websocket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      conversationId: conversation.id,
      senderId: currentUser.id,
      senderName:
        currentUser.fullName ||
        currentUser.username,
      receiverId: selectedUser.id,
      content,
      sentAt: new Date().toISOString(),
      pending: true,
      deliveryStatus: "pending",
      isDeleted: false,
    };

    setMessages((current) => [
      ...current,
      optimisticMessage,
    ]);

    setText("");

    websocket.send(
      JSON.stringify({
        type: "message",
        conversationId: conversation.id,
        receiverId: selectedUser.id,
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

    if (
      String(deleteMessage.id).startsWith(
        "temp-"
      )
    ) {
      setDeleteMessage(null);
      return;
    }

    try {
      await api.delete(
        `/messages/${deleteMessage.id}/me`
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

    if (
      String(deleteMessage.id).startsWith(
        "temp-"
      )
    ) {
      setDeleteMessage(null);
      return;
    }

    try {
      await api.delete(
        `/messages/${deleteMessage.id}/everyone`
      );

      setMessages((current) =>
        current.map((message) =>
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

    setShowDeleteHistoryModal(true);
  }

  async function confirmDeleteConversation() {
    if (!conversation?.id) {
      return;
    }

    try {
      setDeletingHistory(true);

      await api.delete(
        `/conversations/${conversation.id}/messages`
      );

      setMessages([]);

      setShowDeleteHistoryModal(false);
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

        <h2>Company Chat</h2>

        <p>
          Chọn một nhân viên ở bên trái để bắt đầu
          trò chuyện.
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
          selectedUser={selectedUser}
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
                Gửi tin nhắn đầu tiên để bắt đầu cuộc
                trò chuyện.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                currentUser={currentUser}
                onDelete={setDeleteMessage}
              />
            ))
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="composer-container">
          <DeliveryLegend />

          <form
            className="message-composer"
            onSubmit={handleSubmit}
          >
            <input
              value={text}
              onChange={(e) =>
                setText(e.target.value)
              }
              placeholder={`Nhắn tin cho ${
                selectedUser.fullName ||
                selectedUser.username
              }...`}
              disabled={!websocketConnected}
            />

            <button
              type="submit"
              className="send-button"
              disabled={
                !text.trim() ||
                !websocketConnected
              }
              title="Gửi tin nhắn"
            >
              <span>➤</span>
            </button>
          </form>

          {!websocketConnected && (
            <div className="connection-warning">
              <span className="warning-dot" />
              Mất kết nối realtime. Vui lòng chờ kết
              nối lại.
            </div>
          )}
        </div>
      </main>

      {/* DELETE MESSAGE MODAL */}

     <DeleteMessageModal
        message={deleteMessage}
        currentUser={currentUser}
        onClose={() => setDeleteMessage(null)}
        onDeleteForMe={
          handleDeleteForMe
        }
        onDeleteForEveryone={
          handleDeleteForEveryone
        }
      />

      {/* DELETE HISTORY MODAL */}

      {showDeleteHistoryModal && (
        <DeleteHistoryModal
          onClose={() =>
            setShowDeleteHistoryModal(false)
          }
          onConfirm={
            confirmDeleteConversation
          }
          loading={deletingHistory}
        />
      )}
    </>
  );
}
export default ChatWindow;