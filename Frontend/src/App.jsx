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


        /* =================================================
           LOAD PERMISSIONS
        ================================================= */

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


        /* =================================================
           RESTORE USER
        ================================================= */

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

        const user =
          JSON.parse(savedUser);


        /* =================================================
           LOAD PERMISSIONS
        ================================================= */

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


        /* =================================================
           EMPLOYEE
           
           Employee không có quyền quản trị
           → đi thẳng vào Chat.
        ================================================= */

        const isEmployee =
          user?.role === "Employee";


        if (isEmployee) {

          return "chat";

        }


        /* =================================================
           MANAGEMENT ACCESS
           
           Không kiểm tra riêng Dashboard.View
           vì các role khác có thể chỉ có:
           
           Employee.View
           Department.View
           Role.View
           Scope.View
           ...
           
           Nếu có ít nhất một quyền quản trị
           → mở AdminDashboardPage.
           
           AdminDashboardPage sẽ tự chọn menu
           đầu tiên mà user có quyền.
        ================================================= */

        const hasManagementAccess =
          permissions.includes(
            "Dashboard.View"
          ) ||
          permissions.includes(
            "Employee.View"
          ) ||
          permissions.includes(
            "Department.View"
          ) ||
          permissions.includes(
            "Role.View"
          ) ||
          permissions.includes(
            "Scope.View"
          ) ||
          permissions.includes(
            "System.Security"
          );


        if (hasManagementAccess) {

          return "admin";

        }


        /* =================================================
           KHÔNG CÓ QUYỀN QUẢN TRỊ
           
           → Chat
        ================================================= */

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


    /* =====================================================
       CHỈ XỬ LÝ ACCOUNT DISABLED
    ===================================================== */

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


    /* =====================================================
       CLEAR LOGIN DATA
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
       RESET STATE
    ===================================================== */

    setLoginError("");

    setCurrentUser(null);

    setCurrentPage("login");

  }


  /* =========================================================
     LOGIN
  ========================================================= */

  function handleLogin(user) {

    setLoginError("");


    /* =====================================================
       SAVE CURRENT USER
    ===================================================== */

    setCurrentUser(user);


    /* =====================================================
       EMPLOYEE
       
       Employee không vào Management.
       → Chat.
    ===================================================== */

    if (
      user?.role === "Employee"
    ) {

      setCurrentPage("chat");

      return;

    }


    /* =====================================================
       LOAD PERMISSIONS
    ===================================================== */

    const permissions =
      Array.isArray(
        user?.permissions
      )
        ? user.permissions
        : [];


    /* =====================================================
       MANAGEMENT ACCESS
       
       Không bắt buộc Dashboard.View.
       
       Các quyền sau đều có thể đưa user
       vào Management:
       
       Dashboard.View
       Employee.View
       Department.View
       Role.View
       Scope.View
       System.Security
    ===================================================== */

    const hasManagementAccess =
      permissions.includes(
        "Dashboard.View"
      ) ||
      permissions.includes(
        "Employee.View"
      ) ||
      permissions.includes(
        "Department.View"
      ) ||
      permissions.includes(
        "Role.View"
      ) ||
      permissions.includes(
        "Scope.View"
      ) ||
      permissions.includes(
        "System.Security"
      );


    /* =====================================================
       CHỌN PAGE
    ===================================================== */

    if (hasManagementAccess) {

      setCurrentPage("admin");

      return;

    }


    /* =====================================================
       USER KHÔNG CÓ MANAGEMENT ACCESS
       
       → Chat
    ===================================================== */

    setCurrentPage("chat");

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
        currentUser={
          currentUser
        }

        socketEvent={
          socketEvent
        }

        websocketConnected={
          websocketConnected
        }

        onBackToChat={() => {

          setCurrentPage(
            "chat"
          );

        }}

        onLogout={
          handleLogout
        }
      />

    );

  }


  /* =========================================================
     CHAT
  ========================================================= */

  return (

    <ChatPage
      currentUser={
        currentUser
      }

      websocket={
        websocket
      }

      websocketConnected={
        websocketConnected
      }

      socketEvent={
        socketEvent
      }

      closeWebSocket={
        closeWebSocket
      }

      onGoToAdmin={() => {

        /* =================================================
           CHỈ CHO USER CÓ QUYỀN MANAGEMENT
           ĐI VÀO ADMIN DASHBOARD
        ================================================= */

        const permissions =
          Array.isArray(
            currentUser?.permissions
          )
            ? currentUser.permissions
            : [];


        const hasManagementAccess =
          currentUser?.role !==
            "Employee" &&
          (
            permissions.includes(
              "Dashboard.View"
            ) ||
            permissions.includes(
              "Employee.View"
            ) ||
            permissions.includes(
              "Department.View"
            ) ||
            permissions.includes(
              "Role.View"
            ) ||
            permissions.includes(
              "Scope.View"
            ) ||
            permissions.includes(
              "System.Security"
            )
          );


        if (
          hasManagementAccess
        ) {

          setCurrentPage(
            "admin"
          );

        }

      }}

      onLogout={
        handleLogout
      }
    />

  );

}


export default App;