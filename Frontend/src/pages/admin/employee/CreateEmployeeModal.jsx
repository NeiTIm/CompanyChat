import { useState } from "react";

import { createEmployee } from "../../../services/admin/adminUserService";

export default function CreateEmployeeModal({
  departments,
  departmentLoading,
  onClose,
  onCreated,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    role: "Employee",
    departmentId: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!form.username.trim()) {
      setError("Username không được để trống.");
      return;
    }

    if (!form.fullName.trim()) {
      setError("Họ tên không được để trống.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email không được để trống.");
      return;
    }

    if (!form.password) {
      setError("Mật khẩu không được để trống.");
      return;
    }

    if (form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    try {
      setLoading(true);

      await createEmployee({
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        departmentId:
          form.departmentId !== ""
            ? Number(form.departmentId)
            : null,
      });

      onCreated();
    } catch (error) {
      console.error(
        "Không thể tạo nhân viên:",
        error
      );

      const message =
        error?.response?.data?.message ||
        "Không thể tạo nhân viên.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleOverlayClick() {
    if (loading) {
      return;
    }

    onClose();
  }

  return (
    <div
      className="admin-modal-overlay"
      onClick={handleOverlayClick}
    >
      <div
        className="admin-user-modal admin-create-employee-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="admin-modal-header">
          <div>
            <h2>Thêm nhân viên</h2>

            <p>
              Tạo tài khoản nhân viên mới
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

        {/* =====================================================
            FORM
        ===================================================== */}

        <form onSubmit={handleSubmit}>
          <div className="admin-create-form">

            {/* USERNAME */}

            <div className="admin-form-group">
              <label htmlFor="create-username">
                Username
              </label>

              <input
                id="create-username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="Nhập username"
                disabled={loading}
                autoComplete="off"
              />
            </div>

            {/* FULL NAME */}

            <div className="admin-form-group">
              <label htmlFor="create-full-name">
                Họ và tên
              </label>

              <input
                id="create-full-name"
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Nhập họ và tên"
                disabled={loading}
              />
            </div>

            {/* EMAIL */}

            <div className="admin-form-group">
              <label htmlFor="create-email">
                Email
              </label>

              <input
                id="create-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@company.com"
                disabled={loading}
                autoComplete="off"
              />
            </div>

            {/* PASSWORD */}

            <div className="admin-form-group">
              <label htmlFor="create-password">
                Mật khẩu
              </label>

              <input
                id="create-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Tối thiểu 6 ký tự"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            {/* ROLE */}

            <div className="admin-form-group">
              <label htmlFor="create-role">
                Role
              </label>

              <select
                id="create-role"
                name="role"
                value={form.role}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="Employee">
                  Employee
                </option>

                <option value="Admin">
                  Admin
                </option>
              </select>
            </div>

            {/* DEPARTMENT */}

            <div className="admin-form-group">
              <label htmlFor="create-department">
                Phòng ban
              </label>

              <select
                id="create-department"
                name="departmentId"
                value={form.departmentId}
                onChange={handleChange}
                disabled={
                  loading ||
                  departmentLoading
                }
              >
                <option value="">
                  Không phân phòng ban
                </option>

                {departments.map(
                  (department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.name}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* ERROR */}

            {error && (
              <div className="admin-form-error">
                {error}
              </div>
            )}
          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

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
                ? "Đang tạo..."
                : "Tạo nhân viên"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}