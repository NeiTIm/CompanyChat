import { useState } from "react";
import api from "../api";

import "../style.css";
/* =========================================================
   LOGIN
========================================================= */

function LoginPage({ onLogin }) {
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

export default LoginPage;