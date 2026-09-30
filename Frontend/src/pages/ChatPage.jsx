import {
  useEffect,
  useRef,
  useState,
} from "react";

import api, { API_URL } from "../api";

import UserList from "../components/user/UserList";
import ChatWindow from "../components/chat/ChatWindow";

/* =========================================================
   CHAT APP
========================================================= */

function ChatPage({
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

export default ChatPage;