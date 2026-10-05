import { useState } from "react";

import {
  resetEmployeePassword,
} from "../../../services/admin/adminUserService";

export default function ResetPasswordModal({
  user,
  onClose,
  onReset,
}) {
  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!newPassword) {
      setError(
        "Mật khẩu mới không được để trống."
      );
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "Mật khẩu phải có ít nhất 6 ký tự."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "Mật khẩu xác nhận không khớp."
      );
      return;
    }

    try {
      setLoading(true);

      await resetEmployeePassword(
        user.id,
        newPassword
      );

      onReset();
    } catch (error) {
      console.error(
        "Không thể reset mật khẩu:",
        error
      );

      const message =
        error?.response?.data?.message ||
        "Không thể reset mật khẩu.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="admin-modal-overlay"
      onClick={() => {
        if (!loading) {
          onClose();
        }
      }}
    >
      <div
        className="admin-user-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="admin-modal-header">
          <div>
            <h2>Reset Password</h2>

            <p>
              Đặt lại mật khẩu cho{" "}
              <strong>
                {user.fullName}
              </strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
        >
          <div className="admin-create-form">

            <div className="admin-form-group">
              <label>
                Username
              </label>

              <input
                type="text"
                value={
                  user.username
                }
                disabled
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="reset-password">
                Mật khẩu mới
              </label>

              <input
                id="reset-password"
                type="password"
                value={
                  newPassword
                }
                onChange={(event) =>
                  setNewPassword(
                    event.target.value
                  )
                }
                placeholder="Tối thiểu 6 ký tự"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="reset-confirm-password">
                Xác nhận mật khẩu
              </label>

              <input
                id="reset-confirm-password"
                type="password"
                value={
                  confirmPassword
                }
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Nhập lại mật khẩu"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="admin-form-error">
                {error}
              </div>
            )}

          </div>

          <div className="admin-modal-actions">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>

            <button
              type="submit"
              className="admin-create-button"
              disabled={loading}
            >
              {loading
                ? "Đang reset..."
                : "Reset mật khẩu"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}