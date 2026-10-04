import { useState } from "react";

import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";

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

  // =========================
  // LOGIN
  // =========================
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

  // =========================
  // ADMIN
  // =========================
  if (
    currentUser.role === "Admin" &&
    currentPage === "admin"
  ) {
    return (
      <AdminDashboardPage
        currentUser={currentUser}
        onBackToChat={() => {
          setCurrentPage("chat");
        }}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          setCurrentUser(null);
          setCurrentPage("login");
        }}
      />
    );
  }

  // =========================
  // CHAT
  // =========================
  return (
  <ChatPage
    currentUser={currentUser}

    onGoToAdmin={() => {
      setCurrentPage("admin");
    }}

    onLogout={() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setCurrentUser(null);
      setCurrentPage("login");
    }}
  />
);
}

export default App;