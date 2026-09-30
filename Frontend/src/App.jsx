import { useEffect, useRef, useState } from "react";
import api, { API_URL } from "./api";
import "./style.css";

/* =========================================================
   HELPERS
========================================================= */

function formatTime(date) {
  if (!date) return "";

  return new Date(date).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLastSeen(date) {
  if (!date) return "Offline";

  const utcDate =
    typeof date === "string" &&
    !date.endsWith("Z") &&
    !/[+-]\d{2}:\d{2}$/.test(date)
      ? `${date}Z`
      : date;

  const d = new Date(utcDate);

  return `Hoạt động ${d.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
  })} ${d.toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function getInitial(user) {
  const name = user?.fullName || user?.username || "?";
  return name.charAt(0).toUpperCase();
}

function getDeliveryStatus(message) {
  if (message.pending) {
    return "pending";
  }

  if (message.deliveryStatus) {
    return message.deliveryStatus;
  }

  if (message.isDelivered) {
    return "delivered";
  }

  return "sent";
}

/* =========================================================
   AVATAR
========================================================= */

function Avatar({
  user,
  size = "medium",
  showStatus = false,
}) {
  return (
    <div className={`avatar-wrapper avatar-${size}`}>
      <div className="avatar">
        {getInitial(user)}
      </div>

      {showStatus && (
        <span
          className={`avatar-status ${
            user?.isOnline ? "online" : "offline"
          }`}
        />
      )}
    </div>
  );
}

/* =========================================================
   DELIVERY STATUS
========================================================= */

function DeliveryStatus({ status }) {
  if (status === "pending") {
    return (
      <span
        className="delivery-status pending"
        title="Đang gửi"
      >
        <span className="sending-spinner" />
        <span>Đang gửi</span>
      </span>
    );
  }

  if (status === "read") {
    return (
      <span
        className="delivery-status read"
        title="Đã đọc"
      >
        ✓✓
      </span>
    );
  }

  if (status === "delivered") {
    return (
      <span
        className="delivery-status delivered"
        title="Đã nhận"
      >
        ✓✓
      </span>
    );
  }

  return (
    <span
      className="delivery-status sent"
      title="Đã gửi"
    >
      ✓
    </span>
  );
}

/* =========================================================
   LOGIN
========================================================= */

function Login({ onLogin }) {
  const [username, setUsername] = useState("tien");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        username: username.trim(),
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      onLogin(user);
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error?.response?.data?.message ||
          "Tên đăng nhập hoặc mật khẩu không đúng."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-decoration decoration-1" />
      <div className="login-decoration decoration-2" />

      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">C</div>

        <h1>Company Chat</h1>

        <p className="login-subtitle">
          Hệ thống trò chuyện nội bộ
        </p>

        <div className="login-field">
          <label>Tên đăng nhập</label>

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nhập tên đăng nhập"
            autoComplete="username"
          />
        </div>

        <div className="login-field">
          <label>Mật khẩu</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="login-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="button-spinner" />
              Đang đăng nhập...
            </>
          ) : (
            "Đăng nhập"
          )}
        </button>
      </form>
    </div>
  );
}

/* =========================================================
   USER LIST
========================================================= */

function UserList({
  users,
  selectedUser,
  onSelectUser,
  unreadCounts,
}) {
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((user) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      user.fullName?.toLowerCase().includes(keyword) ||
      user.username?.toLowerCase().includes(keyword)
    );
  });

  const onlineCount = users.filter(
    (user) => user.isOnline
  ).length;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div>
          <h2>Nhân viên</h2>

          <div className="employee-summary">
            <span>{users.length} người</span>

            <span className="online-summary">
              <span className="mini-online-dot" />
              {onlineCount} online
            </span>
          </div>
        </div>
      </div>

      <div className="search-box">
        <span className="search-icon">⌕</span>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm nhân viên..."
        />
      </div>

      <div className="user-list">
        {filteredUsers.map((user) => {
  const selected =
    selectedUser?.id === user.id;

  const unreadCount =
    unreadCounts[user.id] || 0;

          return (
            <button
              key={user.id}
              className={`user-item ${
                selected ? "selected" : ""
              }`}
              onClick={() => onSelectUser(user)}
            >
              <Avatar
                user={user}
                size="medium"
                showStatus
              />

              <div className="user-info">
               <div className="user-name-row">
                <div className="user-name">
                  {user.fullName || user.username}
                </div>

                {unreadCount > 0 && (
                  <span className="unread-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>

                <div className="user-username">
                  @{user.username}
                </div>

                <div
                  className={`user-presence ${
                    user.isOnline
                      ? "online"
                      : "offline"
                  }`}
                >
                  <span className="presence-dot" />

                  {user.isOnline
                    ? "Đang online"
                    : formatLastSeen(user.lastSeen)}
                </div>
              </div>
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="empty-users">
            <div className="empty-users-icon">
              ⌕
            </div>

            <div>
              Không tìm thấy nhân viên
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* =========================================================
   CHAT HEADER
========================================================= */

function ChatHeader({
  selectedUser,
  websocketConnected,
  onDeleteHistory,
}) {
  const showComingSoon = (feature) => {
    alert(`${feature}\n\nTính năng đang phát triển.`);
  };

  if (!selectedUser) {
    return null;
  }

  return (
    <div className="chat-header">
      <div className="chat-header-user">
        <Avatar
          user={selectedUser}
          size="large"
          showStatus
        />

        <div className="chat-header-info">
          <div className="chat-header-name">
            {selectedUser.fullName ||
              selectedUser.username}
          </div>

          <div
            className={`chat-presence ${
              selectedUser.isOnline
                ? "online"
                : "offline"
            }`}
          >
            <span className="presence-dot" />

            {selectedUser.isOnline
              ? "Đang online"
              : formatLastSeen(selectedUser.lastSeen)}
          </div>
        </div>
      </div>

      <div className="chat-header-actions">

        {/* Tìm kiếm */}
        <button
          className="header-action-button"
          onClick={() =>
            showComingSoon("🔍 Tìm kiếm tin nhắn")
          }
          title="Tìm kiếm tin nhắn"
        >
          🔍
        </button>

        {/* Gọi thoại */}
        <button
          className="header-action-button"
          onClick={() =>
            showComingSoon("📞 Gọi thoại")
          }
          title="Gọi thoại"
        >
          📞
        </button>

        {/* Video call */}
        <button
          className="header-action-button"
          onClick={() =>
            showComingSoon("📹 Video call")
          }
          title="Video call"
        >
          📹
        </button>

        {/* Realtime */}
        <div
          className={`realtime-status ${
            websocketConnected
              ? "connected"
              : "disconnected"
          }`}
          title={
            websocketConnected
              ? "WebSocket đang kết nối"
              : "WebSocket đã mất kết nối"
          }
        >
          <span className="realtime-dot" />

          <span>
            {websocketConnected
              ? "Realtime"
              : "Mất kết nối"}
          </span>
        </div>

        {/* Xóa lịch sử */}
        <button
          className="header-delete-button"
          onClick={onDeleteHistory}
          title="Xóa lịch sử cuộc trò chuyện"
        >
          🗑
        </button>

        {/* Thêm */}
        <button
          className="header-action-button"
          onClick={() =>
            showComingSoon("⋮ Tính năng khác")
          }
          title="Tính năng khác"
        >
          ⋮
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   MESSAGE ITEM
========================================================= */

function MessageItem({
  message,
  currentUser,
  onDelete,
}) {
  const isMine =
    Number(message.senderId) ===
    Number(currentUser.id);

  const deliveryStatus = isMine
    ? getDeliveryStatus(message)
    : null;

  const isDeleted =
    message.isDeleted === true;

  return (
    <div
      className={`message-row ${
        isMine ? "mine" : "other"
      }`}
    >
      {!isMine && (
        <Avatar
          user={{
            fullName:
              message.senderName || "?",
          }}
          size="small"
        />
      )}

      <div className="message-column">
        <button
          type="button"
          className={`message-bubble ${
            isMine ? "mine" : "other"
          } ${isDeleted ? "deleted" : ""}`}
          onClick={() => {
            if (!message.pending) {
              onDelete(message);
            }
          }}
          title={
            isDeleted
              ? ""
              : "Nhấn để xem tùy chọn"
          }
        >
          {isDeleted ? (
            <span className="deleted-message">
              Tin nhắn đã bị xóa
            </span>
          ) : (
            message.content
          )}
        </button>

        <div
          className={`message-meta ${
            isMine ? "mine" : "other"
          }`}
        >
          <span className="message-time">
            {formatTime(message.sentAt)}
          </span>

          {isMine && !isDeleted && (
            <DeliveryStatus
              status={deliveryStatus}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DELETE MESSAGE MODAL
========================================================= */

function DeleteModal({
  message,
  currentUser,
  onClose,
  onDeleteForMe,
  onDeleteForEveryone,
}) {
  if (!message) {
    return null;
  }

  const isMine =
    Number(message.senderId) ===
    Number(currentUser.id);

  return (
    <div
      className="modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="delete-modal"
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >
        <div className="delete-modal-header">
          <div>
            <div className="delete-modal-icon">
              🗑
            </div>

            <h3>Xóa tin nhắn</h3>

            <p>
              Bạn muốn xóa tin nhắn này như thế nào?
            </p>
          </div>

          <button
            className="delete-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="delete-message-preview">
          “{message.content}”
        </div>

        <div className="delete-options">
          <button
            className="delete-option"
            onClick={onDeleteForMe}
          >
            <span className="delete-option-icon">
              🗑
            </span>

            <span className="delete-option-text">
              <strong>Xóa ở phía tôi</strong>

              <small>
                Chỉ xóa tin nhắn khỏi phía bạn.
              </small>
            </span>

            <span className="delete-arrow">
              ›
            </span>
          </button>

          {isMine && (
            <button
              className="delete-option danger"
              onClick={onDeleteForEveryone}
            >
              <span className="delete-option-icon">
                ✕
              </span>

              <span className="delete-option-text">
                <strong>
                  Xóa với mọi người
                </strong>

                <small>
                  Xóa tin nhắn khỏi cuộc trò chuyện.
                </small>
              </span>

              <span className="delete-arrow">
                ›
              </span>
            </button>
          )}
        </div>

        <button
          className="delete-cancel-button"
          onClick={onClose}
        >
          Hủy
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   DELETE HISTORY MODAL
========================================================= */

function DeleteHistoryModal({
  onClose,
  onConfirm,
  loading,
}) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="delete-history-modal"
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >
        <div className="delete-history-icon">
          🗑️
        </div>

        <h3>Xóa toàn bộ lịch sử?</h3>

        <p>
          Bạn có chắc muốn xóa toàn bộ lịch sử của
          cuộc trò chuyện này?
        </p>

        <p className="delete-warning">
          ⚠️ Hành động này sẽ xóa toàn bộ tin nhắn
          trong cuộc trò chuyện.
        </p>

        <div className="modal-actions">
          <button
            className="cancel-button"
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </button>

          <button
            className="confirm-delete-button"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? "Đang xóa..."
              : "Xóa lịch sử"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DELIVERY LEGEND
========================================================= */

function DeliveryLegend() {
  return (
    <div className="delivery-legend">
      <span>
        <b className="legend-sent">✓</b>
        Đã gửi
      </span>

      <span>
        <b className="legend-delivered">✓✓</b>
        Đã nhận
      </span>

      <span>
        <b className="legend-read">✓✓</b>
        Đã đọc
      </span>
    </div>
  );
}

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

      /* Message do chính mình */

      if (
        Number(incomingMessage.senderId) ===
        Number(currentUser.id)
      ) {
        setMessages((current) => {
          const pendingIndex =
            current.findIndex(
              (message) =>
                message.pending &&
                message.content ===
                  incomingMessage.content
            );

          if (pendingIndex === -1) {
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
                deliveryStatus:
                  incomingMessage.deliveryStatus ||
                  "sent",
              },
            ];
          }

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
        });

        return;
      }

      /* Tin nhắn từ người khác */

      setMessages((current) => {
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

      <DeleteModal
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

/* =========================================================
   CHAT APP
========================================================= */

function ChatApp({
  currentUser,
  onLogout,
}) {
  const [users, setUsers] = useState([]);

  const [selectedUser, setSelectedUser] =
    useState(null);
  const [unreadCounts, setUnreadCounts] =
    useState({});

  const [websocket, setWebsocket] =
    useState(null);

  const [websocketConnected, setWebsocketConnected] =
    useState(false);

  const [socketEvent, setSocketEvent] =
    useState(null);

  const websocketRef = useRef(null);
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
      const response =
        await api.get("/users");

      setUsers(response.data);
    } catch (error) {
      console.error(
        "Load users error:",
        error
      );
    }
  }
  async function loadUnreadCounts() {
  try {
    const response =
      await api.get("/conversations/unread");

    const counts = {};

    response.data.forEach((item) => {
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
     WEBSOCKET CONNECTION
  ===================================================== */

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      return;
    }

    // const websocketUrl =
    //   API_URL.replace(/^http/, "ws") +
    //   `/ws/chat?access_token=${encodeURIComponent(
    //     token
    //   )}`;
    //sửa vì chuyển sang deploy lên FE vercel và BE ngork

      const websocketProtocol = API_URL.startsWith("https://")
            ? "wss://"
            : "ws://";

          const websocketHost = API_URL
            .replace(/^https?:\/\//, "");

          const websocketUrl =
            websocketProtocol +
            websocketHost +
            `/ws/chat?access_token=${encodeURIComponent(
              token
            )}`;
    
    console.log(
      "Connecting WebSocket:",
      websocketUrl
    );

    const socket =
      new WebSocket(websocketUrl);

    websocketRef.current = socket;

    socket.onopen = () => {
      console.log(
        "WebSocket connected"
      );

      setWebsocket(socket);
      setWebsocketConnected(true);

      setUsers((current) =>
        current.map((user) =>
          Number(user.id) ===
          Number(currentUser.id)
            ? {
                ...user,
                isOnline: true,
                lastSeen: null,
              }
            : user
        )
      );
    };

    socket.onmessage = (event) => {
      try {
        const data =
          JSON.parse(event.data);

        console.log(
          "WebSocket message:",
          data
        );

        if (
          data.type ===
          "user_status"
        ) {
          setUsers((current) =>
            current.map((user) =>
              Number(user.id) ===
              Number(data.userId)
                ? {
                    ...user,
                    isOnline:
                      data.isOnline,
                    lastSeen:
                      data.lastSeen,
                  }
                : user
            )
          );

          setSocketEvent(data);

          return;
        }

        setSocketEvent({
          ...data,
          __receivedAt: Date.now(),
        });
      } catch (error) {
        console.error(
          "Invalid WebSocket message:",
          error
        );
      }
    };

    socket.onerror = (error) => {
      console.error(
        "WebSocket error:",
        error
      );

      setWebsocketConnected(false);
    };

    socket.onclose = () => {
      console.log(
        "WebSocket disconnected"
      );

      setWebsocket(null);
      setWebsocketConnected(false);

      setUsers((current) =>
        current.map((user) =>
          Number(user.id) ===
          Number(currentUser.id)
            ? {
                ...user,
                isOnline: false,
                lastSeen:
                  new Date().toISOString(),
              }
            : user
        )
      );
    };

    return () => {
      socket.close();
      websocketRef.current = null;
    };
  }, [currentUser.id]);

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

    if (socketEvent.type !== "message") {
      return;
    }

    const message =
      socketEvent.message ||
      socketEvent.data ||
      socketEvent;

    if (!message) {
      return;
    }

    // Tin nhắn do chính mình gửi không tính là unread
    if (
      Number(message.senderId) ===
      Number(currentUser.id)
    ) {
      return;
    }

    const conversationId =
      Number(message.conversationId);

    // Nếu đang mở đúng cuộc trò chuyện này
    // thì ChatWindow đã mark read rồi
    if (
      Number(activeConversationRef.current) ===
      conversationId
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
  }, [socketEvent, currentUser.id]);

  /* =====================================================
     SELECT USER
  ===================================================== */

  function handleSelectUser(user) {
    setSelectedUser(user);
  }

  /* =====================================================
     LOGOUT
  ===================================================== */

  function handleLogout() {
    if (websocketRef.current) {
      websocketRef.current.close();
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    onLogout();
  }

  return (
    <div className="app">

      {/* TOPBAR */}

      <header className="topbar">
        <div className="brand">
          <div className="brand-logo">
            C
          </div>

          <div className="brand-name">
            Company Chat
          </div>
        </div>

        <div className="topbar-right">
          <div className="current-user">
            <div className="current-user-name">
              {currentUser.fullName ||
                currentUser.username}
            </div>

            <div className="current-user-role">
              <span
                className={`current-status-dot ${
                  websocketConnected
                    ? "online"
                    : "offline"
                }`}
              />

              {websocketConnected
                ? "Đang online"
                : "Offline"}
            </div>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* BODY */}

      <div className="app-body">
        <UserList
          users={users}
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
          unreadCounts={unreadCounts}
        />

        <ChatWindow
          selectedUser={selectedUser}
          currentUser={currentUser}
          websocket={websocket}
          websocketConnected={
            websocketConnected
          }
          socketEvent={socketEvent}
          onConversationRead={
            handleConversationRead
          }
          onConversationChange={
            handleConversationChange
          }
        />
      </div>
    </div>
  );
}

/* =========================================================
   ROOT APP
========================================================= */

function App() {
  const [currentUser, setCurrentUser] =
    useState(() => {
      const savedUser =
        localStorage.getItem("user");

      if (!savedUser) {
        return null;
      }

      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    });

  if (!currentUser) {
    return (
      <Login
        onLogin={setCurrentUser}
      />
    );
  }

  return (
    <ChatApp
      currentUser={currentUser}
      onLogout={() =>
        setCurrentUser(null)
      }
    />
  );
}

export default App;