import {
  useEffect,
  useState,
} from "react";

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


  const [currentPage, setCurrentPage] =
    useState(() => {
      const savedUser =
        localStorage.getItem("user");

      if (!savedUser) {
        return "login";
      }

      try {
        const user =
          JSON.parse(savedUser);

        if (user.role === "Admin") {
          return "admin";
        }

        return "chat";
      } catch {
        return "login";
      }
    });


  /* =========================================================
     LOGIN ERROR / ACCOUNT DISABLED MESSAGE
  ========================================================= */

  const [loginError, setLoginError] =
    useState("");


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
     ACCOUNT DISABLED
  ========================================================= */

  useEffect(() => {
    if (
      !currentUser ||
      !socketEvent
    ) {
      return;
    }


    /*
     * Chỉ xử lý event đặc biệt
     * khi tài khoản bị khóa / xóa.
     */
    if (
      socketEvent.type !==
      "account_disabled"
    ) {
      return;
    }


    console.log(
      "Account disabled:",
      socketEvent
    );


    /* =====================================================
       XÁC ĐỊNH THÔNG BÁO
    ===================================================== */

    let message =
      socketEvent.message;


    if (!message) {
      if (
        socketEvent.reason ===
        "locked"
      ) {
        message =
          "⚠️ Tài khoản của bạn đã bị khóa.";
      } else if (
        socketEvent.reason ===
        "deleted"
      ) {
        message =
          "⚠️ Tài khoản của bạn đã bị xóa.";
      } else {
        message =
          "⚠️ Tài khoản của bạn không còn hoạt động.";
      }
    }


    /* =====================================================
       ĐÓNG WEBSOCKET
    ===================================================== */

    closeWebSocket();


    /* =====================================================
       XÓA LOGIN DATA
    ===================================================== */

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );


    /* =====================================================
       CHUYỂN VỀ LOGIN
    ===================================================== */

    setLoginError(message);

    setCurrentUser(null);

    setCurrentPage("login");

  }, [
    socketEvent,
    currentUser,
    closeWebSocket,
  ]);


  /* =========================================================
     LOGOUT
  ========================================================= */

  function handleLogout() {
    closeWebSocket();

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    setLoginError("");

    setCurrentUser(null);
    setCurrentPage("login");
  }


  /* =========================================================
     LOGIN
  ========================================================= */

  function handleLogin(user) {
    setLoginError("");

    setCurrentUser(user);

    if (user.role === "Admin") {
      setCurrentPage("admin");
    } else {
      setCurrentPage("chat");
    }
  }


  /* =========================================================
     LOGIN PAGE
  ========================================================= */

  if (!currentUser) {
    return (
      <LoginPage
        onLogin={handleLogin}
        initialError={loginError}
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
        websocketConnected={
          websocketConnected
        }
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
      websocketConnected={
        websocketConnected
      }
      socketEvent={socketEvent}
      closeWebSocket={
        closeWebSocket
      }
      onGoToAdmin={() => {
        setCurrentPage("admin");
      }}
      onLogout={handleLogout}
    />
  );
}


export default App;