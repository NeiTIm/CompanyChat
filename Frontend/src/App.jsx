import { useState } from "react";

import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";

import useWebSocket from "./hooks/useWebSocket";

// import "./style.css";
import "./styles/index.css";

/* =========================================================
   ROOT APP
========================================================= */

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  const [currentPage, setCurrentPage] = useState(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      return "login";
    }

    try {
      const user = JSON.parse(savedUser);

      if (user.role === "Admin") {
        return "admin";
      }

      return "chat";
    } catch {
      return "login";
    }
  });

  /* =========================================================
     GLOBAL WEBSOCKET
  ========================================================= */

  const {
    websocket,
    websocketConnected,
    socketEvent,
    closeWebSocket,
  } = useWebSocket(currentUser);

  /* =========================================================
     LOGOUT
  ========================================================= */

  function handleLogout() {
    closeWebSocket();

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setCurrentUser(null);
    setCurrentPage("login");
  }

  /* =========================================================
     LOGIN
  ========================================================= */

  if (!currentUser) {
    return (
      <LoginPage
        onLogin={(user) => {
          setCurrentUser(user);

          if (user.role === "Admin") {
            setCurrentPage("admin");
          } else {
            setCurrentPage("chat");
          }
        }}
      />
    );
  }

  /* =========================================================
     ADMIN
  ========================================================= */

  if (
    currentUser.role === "Admin" &&
    currentPage === "admin"
  ) {
    return (
      <AdminDashboardPage
        currentUser={currentUser}
        socketEvent={socketEvent}
        websocketConnected={websocketConnected}
        onBackToChat={() => {
          setCurrentPage("chat");
        }}
        onLogout={handleLogout}
      />
    );
  }

  /* =========================================================
     CHAT
  ========================================================= */

  return (
    <ChatPage
      currentUser={currentUser}
      websocket={websocket}
      websocketConnected={websocketConnected}
      socketEvent={socketEvent}
      closeWebSocket={closeWebSocket}
      onGoToAdmin={() => {
        setCurrentPage("admin");
      }}
      onLogout={handleLogout}
    />
  );
}

export default App;