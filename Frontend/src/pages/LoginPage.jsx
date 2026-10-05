import { useEffect, useState } from "react";

import { login } from "../services/authService";

function LoginPage({
  onLogin,
  initialError = "",
}) {
  const [username, setUsername] =
    useState("tien");

  const [password, setPassword] =
    useState("123456");

  const [error, setError] =
    useState(initialError);

  const [loading, setLoading] =
    useState(false);


  /* =====================================================
     RECEIVE ERROR FROM APP
  ===================================================== */

  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);


  /* =====================================================
     LOGIN
  ===================================================== */

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (
      !username.trim() ||
      !password.trim()
    ) {
      setError(
        "Vui lòng nhập đầy đủ thông tin."
      );

      return;
    }

    try {
      setLoading(true);

      const data = await login(
        username.trim(),
        password
      );

      const {
        token,
        user,
      } = data;

      localStorage.setItem(
        "token",
        token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      onLogin(user);
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

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
      <div className="login-card">

        <div className="login-logo">
          C
        </div>

        <h1>
          Company Chat
        </h1>

        <p className="login-subtitle">
          Đăng nhập để tiếp tục
        </p>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          <div className="login-field">
            <label>
              Tên đăng nhập
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value
                )
              }
              placeholder="Nhập tên đăng nhập"
              disabled={loading}
            />
          </div>


          <div className="login-field">
            <label>
              Mật khẩu
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="Nhập mật khẩu"
              disabled={loading}
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
    </div>
  );
}

export default LoginPage;