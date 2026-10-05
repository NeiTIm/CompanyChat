import { useEffect, useState } from "react";

import {
  updateUserDepartment,
} from "../../../services/admin/adminUserService";

export default function AssignDepartmentModal({
  user,
  departments,
  departmentLoading,
  onClose,
  onAssigned,
}) {
  const [departmentId, setDepartmentId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    setDepartmentId(
      user.departmentId != null
        ? String(user.departmentId)
        : ""
    );

    setError("");
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    try {
      setLoading(true);

      const value =
        departmentId !== ""
          ? Number(departmentId)
          : null;

      await updateUserDepartment(
        user.id,
        value
      );

      const selectedDepartment =
        departments.find(
          (department) =>
            department.id === value
        );

      onAssigned({
        departmentId: value,
        departmentName:
          selectedDepartment?.name ||
          null,
      });
    } catch (error) {
      console.error(
        "Không thể phân phòng ban:",
        error
      );

      const message =
        error?.response?.data?.message ||
        "Không thể cập nhật phòng ban.";

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
            <h2>Phân phòng ban</h2>

            <p>
              Cập nhật phòng ban cho{" "}
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
              <label htmlFor="assign-department">
                Phòng ban
              </label>

              <select
                id="assign-department"
                value={departmentId}
                onChange={(event) =>
                  setDepartmentId(
                    event.target.value
                  )
                }
                disabled={
                  loading ||
                  departmentLoading
                }
              >
                <option value="">
                  Không phân phòng ban
                </option>

                {departments
  .filter(
    (department) =>
      department.isActive
  )
  .map(
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
              disabled={
                loading ||
                departmentLoading
              }
            >
              {loading
                ? "Đang lưu..."
                : "Lưu phòng ban"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}