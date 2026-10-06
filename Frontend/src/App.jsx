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
  /* =========================================================
     CURRENT USER
  ========================================================= */

  const [currentUser, setCurrentUser] =
    useState(() => {
      const savedUser =
        localStorage.getItem("user");

      if (!savedUser) {
        return null;
      }

      try {
        const user =
          JSON.parse(savedUser);

        /*
         * Permissions được lưu riêng
         * trong localStorage.
         *
         * Khi reload trang,
         * ghép permissions trở lại currentUser.
         */

        const savedPermissions =
          localStorage.getItem(
            "permissions"
          );

        let permissions = [];

        if (savedPermissions) {
          try {
            const parsedPermissions =
              JSON.parse(
                savedPermissions
              );

            if (
              Array.isArray(
                parsedPermissions
              )
            ) {
              permissions =
                parsedPermissions;
            }
          } catch {
            permissions = [];
          }
        }

        return {
          ...user,
          permissions,
        };

      } catch {
        return null;
      }
    });


  /* =========================================================
     CURRENT PAGE
  ========================================================= */

  const [currentPage, setCurrentPage] =
    useState(() => {
      const savedUser =
        localStorage.getItem("user");

      if (!savedUser) {
        return "login";
      }

      try {
        JSON.parse(savedUser);

        /*
         * Tất cả authenticated users
         * đều có thể vào Management Dashboard.
         */
        return "admin";

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

    localStorage.removeItem(
      "permissions"
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

    localStorage.removeItem(
      "permissions"
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

    /*
     * LoginPage hiện tại đã truyền:
     *
     * {
     *   ...user,
     *   permissions
     * }
     */

    setCurrentUser(user);

    /*
     * Tất cả Role đều vào Dashboard.
     */
    setCurrentPage("admin");
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
     MANAGEMENT DASHBOARD
  ========================================================= */

  if (
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