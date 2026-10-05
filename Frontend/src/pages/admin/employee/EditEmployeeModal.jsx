import { useEffect, useState } from "react";

import { updateEmployee } from "../../../services/admin/adminUserService";

export default function EditEmployeeModal({
  user,
  onClose,
  onUpdated,
}) {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      fullName: user.fullName || "",
      email: user.email || "",
    });

    setError("");
  }, [user]);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!form.fullName.trim()) {
      setError(
        "Họ tên không được để trống."
      );
      return;
    }

    if (!form.email.trim()) {
      setError(
        "Email không được để trống."
      );
      return;
    }

    try {
      setLoading(true);

      const updatedUser =
        await updateEmployee(
          user.id,
          {
            fullName:
              form.fullName.trim(),

            email:
              form.email.trim(),
          }
        );

      onUpdated(
        updatedUser
      );
    } catch (error) {
      console.error(
        "Không thể cập nhật nhân viên:",
        error
      );

      const message =
        error?.response?.data?.message ||
        "Không thể cập nhật nhân viên.";

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
        {/* HEADER */}

        <div className="admin-modal-header">
          <div>
            <h2>
              Sửa nhân viên
            </h2>

            <p>
              Cập nhật thông tin nhân viên
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

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
        >
          <div className="admin-create-form">

            {/* USERNAME - READ ONLY */}

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

            {/* FULL NAME */}

            <div className="admin-form-group">
              <label htmlFor="edit-full-name">
                Họ và tên
              </label>

              <input
                id="edit-full-name"
                name="fullName"
                type="text"
                value={
                  form.fullName
                }
                onChange={
                  handleChange
                }
                disabled={loading}
              />
            </div>

            {/* EMAIL */}

            <div className="admin-form-group">
              <label htmlFor="edit-email">
                Email
              </label>

              <input
                id="edit-email"
                name="email"
                type="email"
                value={
                  form.email
                }
                onChange={
                  handleChange
                }
                disabled={loading}
              />
            </div>

            {/* ERROR */}

            {error && (
              <div className="admin-form-error">
                {error}
              </div>
            )}

          </div>

          {/* ACTIONS */}

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
                ? "Đang lưu..."
                : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}