import { useState } from "react";

import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";

import "./style.css";

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
      <LoginPage
        onLogin={setCurrentUser}
      />
    );
  }

  return (
    <ChatPage
  currentUser={currentUser}
  onLogout={() =>
    setCurrentUser(null)
  }
/>
  );
}

export default App;