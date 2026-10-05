import { useEffect, useState } from "react";

import {
  getEmployeeDepartments,
  addEmployeeDepartment,
  removeEmployeeDepartment,
} from "../../../services/admin/adminUserService";

import {
  getAdminDepartments,
} from "../../../services/admin/departmentService";

export default function EmployeeDetailModal({
  user,
  loading,
  onClose,
}) {
  // =========================================================
  // ADDITIONAL DEPARTMENTS
  // =========================================================

  const [additionalDepartments, setAdditionalDepartments] =
    useState([]);

  const [allDepartments, setAllDepartments] =
    useState([]);

  const [departmentsLoading, setDepartmentsLoading] =
    useState(false);

  const [selectedDepartmentId, setSelectedDepartmentId] =
    useState("");

  const [departmentActionLoading, setDepartmentActionLoading] =
    useState(false);

  const [departmentError, setDepartmentError] =
    useState("");

  // =========================================================
  // LOAD DEPARTMENTS
  // =========================================================

  useEffect(() => {
    if (!user?.id || loading) {
      return;
    }

    loadDepartments();
  }, [user?.id, loading]);

  async function loadDepartments() {
    try {
      setDepartmentsLoading(true);
      setDepartmentError("");

      const [
        employeeDepartments,
        departments,
      ] = await Promise.all([
        getEmployeeDepartments(user.id),
        getAdminDepartments(),
      ]);

      setAdditionalDepartments(
        Array.isArray(employeeDepartments)
          ? employeeDepartments
          : []
      );

      /*
       * Backend Department API có thể trả:
       *
       * 1. Array:
       *    [...]
       *
       * 2. Pagination:
       *    {
       *      items: [...]
       *    }
       *
       * Hỗ trợ cả hai để modal không phụ thuộc
       * cứng vào một response shape.
       */
      const departmentItems =
        Array.isArray(departments)
          ? departments
          : Array.isArray(departments?.items)
            ? departments.items
            : [];

      setAllDepartments(departmentItems);
    } catch (error) {
      console.error(
        "Failed to load employee departments:",
        error
      );

      setDepartmentError(
        error?.response?.data?.message ||
          "Không thể tải thông tin phòng ban."
      );
    } finally {
      setDepartmentsLoading(false);
    }
  }

  // =========================================================
  // ADD ADDITIONAL DEPARTMENT
  // =========================================================

  async function handleAddDepartment() {
    if (!selectedDepartmentId) {
      return;
    }

    try {
      setDepartmentActionLoading(true);
      setDepartmentError("");

      const departmentId =
        Number(selectedDepartmentId);

      await addEmployeeDepartment(
        user.id,
        departmentId
      );

      setSelectedDepartmentId("");

      await loadDepartments();
    } catch (error) {
      console.error(
        "Failed to add employee department:",
        error
      );

      setDepartmentError(
        error?.response?.data?.message ||
          "Không thể thêm phòng ban."
      );
    } finally {
      setDepartmentActionLoading(false);
    }
  }

  // =========================================================
  // REMOVE ADDITIONAL DEPARTMENT
  // =========================================================

  async function handleRemoveDepartment(
    departmentId
  ) {
    try {
      setDepartmentActionLoading(true);
      setDepartmentError("");

      await removeEmployeeDepartment(
        user.id,
        departmentId
      );

      await loadDepartments();
    } catch (error) {
      console.error(
        "Failed to remove employee department:",
        error
      );

      setDepartmentError(
        error?.response?.data?.message ||
          "Không thể xóa phòng ban."
      );
    } finally {
      setDepartmentActionLoading(false);
    }
  }

  // =========================================================
  // AVAILABLE ADDITIONAL DEPARTMENTS
  // =========================================================

  const availableDepartments =
    allDepartments.filter((department) => {
      const departmentId =
        department.id ?? department.Id;

      const isPrimary =
        departmentId === user.departmentId;

      const isAlreadyAdditional =
        additionalDepartments.some(
          (item) =>
            (item.id ?? item.Id) === departmentId
        );

      const isActive =
        department.isActive ??
        department.IsActive ??
        true;

      return (
        isActive &&
        !isPrimary &&
        !isAlreadyAdditional
      );
    });

  return (
    <div
      className="admin-modal-overlay"
      onClick={onClose}
    >
      <div
        className="admin-user-modal admin-employee-detail-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="admin-modal-header">
          <div>
            <h2>Employee Details</h2>

            <p>
              Thông tin tài khoản nhân viên
            </p>
          </div>

          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        {/* =====================================================
            BODY
        ===================================================== */}

        {loading ? (
          <div className="admin-modal-loading">
            <div className="admin-detail-loading-spinner" />

            <span>
              Đang tải thông tin...
            </span>
          </div>
        ) : (
          <div className="admin-user-detail">

            {/* =================================================
                PROFILE
            ================================================= */}

            <div className="admin-detail-profile">
              <div className="admin-detail-avatar">
                {(
                  user.fullName ||
                  user.username ||
                  "U"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <h3>
                {user.fullName}
              </h3>

              <p>
                @{user.username}
              </p>
            </div>

            {/* =================================================
                INFORMATION
            ================================================= */}

            <div className="admin-detail-list">

              {/* ID */}

              <div className="admin-detail-item">
                <span>ID</span>

                <strong>
                  {user.id}
                </strong>
              </div>

              {/* USERNAME */}

              <div className="admin-detail-item">
                <span>Username</span>

                <strong>
                  {user.username}
                </strong>
              </div>

              {/* FULL NAME */}

              <div className="admin-detail-item">
                <span>Full Name</span>

                <strong>
                  {user.fullName}
                </strong>
              </div>

              {/* EMAIL */}

              <div className="admin-detail-item">
                <span>Email</span>

                <strong
                  className="admin-detail-value-email"
                  title={user.email}
                >
                  {user.email}
                </strong>
              </div>

              {/* PRIMARY DEPARTMENT */}

              <div className="admin-detail-item">
                <span>Primary Department</span>

                <strong>
                  {user.departmentName ||
                    "Chưa phân phòng ban"}
                </strong>
              </div>

              {/* ROLE */}

              <div className="admin-detail-item">
                <span>Role</span>

                <strong
                  className="admin-detail-role"
                >
                  {user.role}
                </strong>
              </div>

              {/* STATUS */}

              <div className="admin-detail-item">
                <span>Trạng thái</span>

                <strong
                  className={
                    user.isActive
                      ? "admin-detail-status active"
                      : "admin-detail-status inactive"
                  }
                >
                  <span className="admin-detail-status-dot" />

                  {user.isActive
                    ? "Active"
                    : "Inactive"}
                </strong>
              </div>

              {/* ONLINE */}

              <div className="admin-detail-item">
                <span>Online</span>

                <strong
                  className={
                    user.isOnline
                      ? "admin-detail-status online"
                      : "admin-detail-status offline"
                  }
                >
                  <span className="admin-detail-status-dot" />

                  {user.isOnline
                    ? "Online"
                    : "Offline"}
                </strong>
              </div>

              {/* LAST SEEN */}

              <div className="admin-detail-item admin-detail-item-full">
                <span>Last seen</span>

                <strong>
                  {user.lastSeen
                    ? new Date(
                        user.lastSeen
                      ).toLocaleString("vi-VN")
                    : "Chưa có"}
                </strong>
              </div>
            </div>

            {/* =================================================
                ADDITIONAL DEPARTMENTS
            ================================================= */}

            <div className="admin-detail-departments">

              <div className="admin-detail-section-header">
                <div>
                  <h4>
                    Additional Departments
                  </h4>

                  <p>
                    Các phòng ban phụ mà nhân viên
                    đang tham gia
                  </p>
                </div>

                <span className="admin-detail-count">
                  {additionalDepartments.length}
                </span>
              </div>

              {/* ERROR */}

              {departmentError && (
                <div className="admin-detail-department-error">
                  {departmentError}
                </div>
              )}

              {/* CURRENT ADDITIONAL DEPARTMENTS */}

              {departmentsLoading ? (
                <div className="admin-detail-department-loading">
                  Đang tải phòng ban...
                </div>
              ) : additionalDepartments.length === 0 ? (
                <div className="admin-detail-department-empty">
                  Chưa có phòng ban phụ.
                </div>
              ) : (
                <div className="admin-detail-department-list">
                  {additionalDepartments.map(
                    (department) => {
                      const departmentId =
                        department.id ??
                        department.Id;

                      const departmentName =
                        department.name ??
                        department.Name;

                      const description =
                        department.description ??
                        department.Description;

                      return (
                        <div
                          key={departmentId}
                          className="admin-detail-department-item"
                        >
                          <div className="admin-detail-department-info">
                            <strong>
                              {departmentName}
                            </strong>

                            {description && (
                              <span>
                                {description}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            className="admin-detail-department-remove"
                            onClick={() =>
                              handleRemoveDepartment(
                                departmentId
                              )
                            }
                            disabled={
                              departmentActionLoading
                            }
                          >
                            Xóa
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              {/* =================================================
                  ADD DEPARTMENT
              ================================================= */}

              <div className="admin-detail-department-add">

                <select
                  value={selectedDepartmentId}
                  onChange={(event) =>
                    setSelectedDepartmentId(
                      event.target.value
                    )
                  }
                  disabled={
                    departmentsLoading ||
                    departmentActionLoading ||
                    availableDepartments.length === 0
                  }
                >
                  <option value="">
                    Chọn phòng ban để thêm
                  </option>

                  {availableDepartments.map(
                    (department) => {
                      const departmentId =
                        department.id ??
                        department.Id;

                      const departmentName =
                        department.name ??
                        department.Name;

                      return (
                        <option
                          key={departmentId}
                          value={departmentId}
                        >
                          {departmentName}
                        </option>
                      );
                    }
                  )}
                </select>

                <button
                  type="button"
                  className="admin-detail-department-add-button"
                  onClick={handleAddDepartment}
                  disabled={
                    !selectedDepartmentId ||
                    departmentActionLoading
                  }
                >
                  {departmentActionLoading
                    ? "Đang xử lý..."
                    : "Thêm"}
                </button>
              </div>

              {availableDepartments.length === 0 &&
                !departmentsLoading && (
                  <div className="admin-detail-department-hint">
                    Không còn phòng ban đang hoạt động
                    để thêm.
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}