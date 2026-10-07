import { useCallback, useEffect, useState } from "react";

import {
  createGroupScope,
  deleteGroupScope,
  getGroupScopes,
  updateGroupScope,
} from "../../../services/admin/scopeService";

import CreateGroupScopeModal from "./group/CreateGroupScopeModal";
import EditGroupScopeModal from "./group/EditGroupScopeModal";
import GroupScopeDetailModal from "./group/GroupScopeDetailModal";

/* =========================================================
   TOAST ICONS
========================================================= */

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 8v4" />

      <path d="M12 16h.01" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.3 3.8 2.5 17.5A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.5L13.7 3.8a2 2 0 0 0-3.4 0Z" />

      <path d="M12 9v4" />

      <path d="M12 16h.01" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 11v5" />

      <path d="M12 8h.01" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />

      <path d="m18 6-12 12" />
    </svg>
  );
}


/* =========================================================
   DEFAULT TOAST TITLES
========================================================= */

const DEFAULT_TOAST_TITLES = {
  success: "Thành công",
  error: "Có lỗi xảy ra",
  warning: "Cảnh báo",
  info: "Thông báo",
};


/* =========================================================
   GROUP SCOPE TOAST
========================================================= */

function GroupScopeToast({
  type = "success",
  message = "",
  title,
  duration = 3000,
  onClose,
}) {
  /* =========================================================
     AUTO CLOSE
  ========================================================= */

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    if (duration <= 0) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [message, duration, onClose]);

  /* =========================================================
     NORMALIZE TYPE
  ========================================================= */

  const normalizedType = [
    "success",
    "error",
    "warning",
    "info",
  ].includes(type)
    ? type
    : "info";

  /* =========================================================
     RENDER ICON
  ========================================================= */

  function renderIcon() {
    switch (normalizedType) {
      case "success":
        return <CheckIcon />;

      case "error":
        return <ErrorIcon />;

      case "warning":
        return <WarningIcon />;

      case "info":
        return <InfoIcon />;

      default:
        return <InfoIcon />;
    }
  }

  /* =========================================================
     EMPTY
  ========================================================= */

  if (!message) {
    return null;
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className={`admin-toast admin-toast-${normalizedType}`}
      role={
        normalizedType === "error"
          ? "alert"
          : "status"
      }
      aria-live={
        normalizedType === "error"
          ? "assertive"
          : "polite"
      }
    >
      {/* =====================================================
          ICON
      ===================================================== */}

      <div className="admin-toast-icon">
        {renderIcon()}
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="admin-toast-content">
        <strong>
          {title ||
            DEFAULT_TOAST_TITLES[normalizedType]}
        </strong>

        <span>
          {message}
        </span>
      </div>

      {/* =====================================================
          CLOSE
      ===================================================== */}

      <button
        type="button"
        className="admin-toast-close"
        onClick={onClose}
        aria-label="Đóng thông báo"
      >
        <CloseIcon />
      </button>
    </div>
  );
}


/* =========================================================
   GROUP SCOPE SECTION
========================================================= */

function GroupScopeSection() {
  /* =========================================================
     STATE
  ========================================================= */

  const [groupScopes, setGroupScopes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");

  /* =========================================================
     TOAST STATE
  ========================================================= */

  const [toast, setToast] = useState({
    type: "info",
    message: "",
    title: "",
  });

  const showToast = (
    type,
    message,
    title = ""
  ) => {
    setToast({
      type,
      message,
      title,
    });
  };

  const closeToast = () => {
    setToast({
      type: "info",
      message: "",
      title: "",
    });
  };

  /* =========================================================
     CREATE MODAL
  ========================================================= */

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  /* =========================================================
     EDIT MODAL
  ========================================================= */

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [editingGroupScope, setEditingGroupScope] =
    useState(null);

  /* =========================================================
     DETAIL MODAL
  ========================================================= */

  const [showDetailModal, setShowDetailModal] =
    useState(false);

  const [detailGroupScopeId, setDetailGroupScopeId] =
    useState(null);

  /* =========================================================
     LOAD GROUP SCOPES
  ========================================================= */

  const loadGroupScopes = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getGroupScopes();

      /*
       * Backend có thể trả:
       * - array trực tiếp
       * - { data: [...] }
       */

      const data = Array.isArray(response)
        ? response
        : response?.data ?? [];

      setGroupScopes(data);
    } catch (err) {
      console.error(
        "Failed to load group scopes:",
        err
      );

      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.title ||
        "Không thể tải danh sách Group Scope.";

      setError(errorMessage);

      showToast(
        "error",
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadGroupScopes();
  }, [loadGroupScopes]);

  /* =========================================================
     OPEN CREATE MODAL
  ========================================================= */

  const handleOpenCreate = () => {
    setError("");
    setShowCreateModal(true);
  };

  /* =========================================================
     CLOSE CREATE MODAL
  ========================================================= */

  const handleCloseCreate = () => {
    if (creating) {
      return;
    }

    setShowCreateModal(false);
  };

  /* =========================================================
     CREATE GROUP SCOPE
  ========================================================= */

  const handleCreateGroupScope = async ({
    name,
    description,
  }) => {
    try {
      setCreating(true);
      setError("");

      await createGroupScope(
        name,
        description
      );

      /*
       * Đóng modal sau khi API thành công.
       */

      setShowCreateModal(false);

      /*
       * Hiển thị Toast thành công.
       */

      showToast(
        "success",
        "Group Scope đã được tạo thành công."
      );

      /*
       * Reload danh sách.
       */

      await loadGroupScopes();
    } catch (err) {
      console.error(
        "Failed to create group scope:",
        err
      );

      /*
       * Giữ modal mở khi API lỗi.
       */

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.response?.data?.title ||
          "Không thể tạo Group Scope."
      );
    } finally {
      setCreating(false);
    }
  };

  /* =========================================================
     OPEN EDIT MODAL
  ========================================================= */

  const handleOpenEdit = (groupScope) => {
    setEditingGroupScope(groupScope);
    setEditError("");
    setShowEditModal(true);
  };

  /* =========================================================
     CLOSE EDIT MODAL
  ========================================================= */

  const handleCloseEdit = () => {
    if (updating) {
      return;
    }

    setShowEditModal(false);
    setEditingGroupScope(null);
    setEditError("");
  };

  /* =========================================================
     UPDATE GROUP SCOPE
  ========================================================= */

  const handleUpdateGroupScope = async ({
    id,
    name,
    description,
  }) => {
    if (!id) {
      setEditError(
        "Không xác định được Group Scope cần cập nhật."
      );

      return;
    }

    try {
      setUpdating(true);
      setEditError("");

      await updateGroupScope(
        id,
        name,
        description
      );

      /*
       * Đóng modal sau khi cập nhật thành công.
       */

      setShowEditModal(false);
      setEditingGroupScope(null);

      /*
       * Hiển thị Toast thành công.
       */

      showToast(
        "success",
        "Group Scope đã được cập nhật thành công."
      );

      /*
       * Reload danh sách.
       */

      await loadGroupScopes();
    } catch (err) {
      console.error(
        "Failed to update group scope:",
        err
      );

      /*
       * Giữ modal mở để người dùng sửa lại.
       */

      setEditError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.response?.data?.title ||
          "Không thể cập nhật Group Scope."
      );
    } finally {
      setUpdating(false);
    }
  };

  /* =========================================================
     OPEN DETAIL MODAL
  ========================================================= */

  const handleOpenDetail = (groupScope) => {
    if (!groupScope?.id) {
      return;
    }

    setDetailGroupScopeId(groupScope.id);
    setShowDetailModal(true);
  };

  /* =========================================================
     CLOSE DETAIL MODAL
  ========================================================= */

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setDetailGroupScopeId(null);
  };

  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh = () => {
    loadGroupScopes();
  };

  /* =========================================================
     DELETE
     
     Chưa triển khai UI Delete ở bước này.
     Giữ service để chuẩn bị cho bước Delete sau.
  ========================================================= */

  const handleDelete = async (scopeGroupId) => {
    if (!scopeGroupId) {
      return;
    }

    try {
      setError("");

      await deleteGroupScope(scopeGroupId);

      showToast(
        "success",
        "Group Scope đã được xóa thành công."
      );

      await loadGroupScopes();
    } catch (err) {
      console.error(
        "Failed to delete group scope:",
        err
      );

      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.title ||
        "Không thể xóa Group Scope.";

      setError(errorMessage);

      showToast(
        "error",
        errorMessage
      );
    }
  };

  /* =========================================================
     SUMMARY
  ========================================================= */

  const totalGroupScopes =
    groupScopes.length;

  const totalUsers = groupScopes.reduce(
    (total, group) =>
      total +
      (group.userCount ??
        group.usersCount ??
        group.membersCount ??
        group.users?.length ??
        group.members?.length ??
        0),
    0
  );

  const totalDepartments = groupScopes.reduce(
    (total, group) =>
      total +
      (group.departmentCount ??
        group.departmentsCount ??
        group.departments?.length ??
        0),
    0
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <section className="group-scope-section">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="group-scope-header">
          <div className="group-scope-header-content">
            <div className="group-scope-title-wrapper">
              <div className="group-scope-title-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />

                  <circle
                    cx="9"
                    cy="7"
                    r="4"
                  />

                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />

                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>

              <div>
                <h2>Group Scope</h2>

                <p>
                  Quản lý các nhóm người dùng và
                  Department được phép quản lý.
                </p>
              </div>
            </div>

            {/* =================================================
                HEADER ACTIONS
            ================================================= */}

            <div className="group-scope-header-actions">
              <button
                type="button"
                className="group-scope-refresh-button"
                onClick={handleRefresh}
                disabled={loading}
                title="Làm mới"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="17"
                  height="17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 4 23 10 17 10" />

                  <polyline points="1 20 1 14 7 14" />

                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />

                  <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
                </svg>

                Làm mới
              </button>

              <button
                type="button"
                className="group-scope-create-button"
                onClick={handleOpenCreate}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="17"
                  height="17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line
                    x1="12"
                    y1="5"
                    x2="12"
                    y2="19"
                  />

                  <line
                    x1="5"
                    y1="12"
                    x2="19"
                    y2="12"
                  />
                </svg>

                Tạo Group Scope
              </button>
            </div>
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="group-scope-error">
            <div className="group-scope-error-content">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                />

                <line
                  x1="12"
                  y1="8"
                  x2="12"
                  y2="12"
                />

                <line
                  x1="12"
                  y1="16"
                  x2="12.01"
                  y2="16"
                />
              </svg>

              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Đóng thông báo lỗi"
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="group-scope-summary">
          <div className="group-scope-summary-card">
            <div className="group-scope-summary-icon">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                />

                <line
                  x1="8"
                  y1="8"
                  x2="16"
                  y2="8"
                />

                <line
                  x1="8"
                  y1="12"
                  x2="16"
                  y2="12"
                />

                <line
                  x1="8"
                  y1="16"
                  x2="13"
                  y2="16"
                />
              </svg>
            </div>

            <div>
              <span>Tổng Group Scope</span>

              <strong>
                {totalGroupScopes}
              </strong>
            </div>
          </div>

          <div className="group-scope-summary-card">
            <div className="group-scope-summary-icon">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />

                <circle
                  cx="9"
                  cy="7"
                  r="4"
                />

                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />

                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>

            <div>
              <span>Tổng Users</span>

              <strong>
                {totalUsers}
              </strong>
            </div>
          </div>

          <div className="group-scope-summary-card">
            <div className="group-scope-summary-icon">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21h18" />

                <path d="M5 21V7l7-4 7 4v14" />

                <path d="M9 21v-6h6v6" />

                <path d="M9 10h.01" />

                <path d="M15 10h.01" />
              </svg>
            </div>

            <div>
              <span>Tổng Departments</span>

              <strong>
                {totalDepartments}
              </strong>
            </div>
          </div>
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        {loading ? (
          <div className="group-scope-empty">
            <div className="group-scope-loading-spinner" />

            <p>
              Đang tải danh sách Group Scope...
            </p>
          </div>
        ) : groupScopes.length === 0 ? (
          <div className="group-scope-empty">
            <div className="group-scope-empty-icon">
              <svg
                viewBox="0 0 24 24"
                width="42"
                height="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />

                <circle
                  cx="9"
                  cy="7"
                  r="4"
                />

                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />

                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>

            <h3>
              Chưa có Group Scope
            </h3>

            <p>
              Tạo Group Scope đầu tiên để bắt đầu
              quản lý phạm vi Department.
            </p>

            <button
              type="button"
              className="group-scope-create-button"
              onClick={handleOpenCreate}
            >
              <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line
                  x1="12"
                  y1="5"
                  x2="12"
                  y2="19"
                />

                <line
                  x1="5"
                  y1="12"
                  x2="19"
                  y2="12"
                />
              </svg>

              Tạo Group Scope
            </button>
          </div>
        ) : (
          <div className="group-scope-table-wrapper">
            <table className="group-scope-table">
              <thead>
                <tr>
                  <th>ID</th>

                  <th>Group Scope</th>

                  <th>Mô tả</th>

                  <th>Users</th>

                  <th>Departments</th>

                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {groupScopes.map((group) => {
                  const userCount =
                    group.userCount ??
                    group.usersCount ??
                    group.membersCount ??
                    group.users?.length ??
                    group.members?.length ??
                    0;

                  const departmentCount =
                    group.departmentCount ??
                    group.departmentsCount ??
                    group.departments?.length ??
                    0;

                  return (
                    <tr key={group.id}>
                      {/* =================================================
                          ID
                      ================================================= */}

                      <td>
                        <span className="group-scope-id">
                          #{group.id}
                        </span>
                      </td>

                      {/* =================================================
                          GROUP SCOPE
                      ================================================= */}

                      <td>
                        <div className="group-scope-name-cell">
                          <div className="group-scope-row-icon">
                            <svg
                              viewBox="0 0 24 24"
                              width="18"
                              height="18"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />

                              <circle
                                cx="9"
                                cy="7"
                                r="4"
                              />

                              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />

                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          </div>

                          <strong>
                            {group.name ||
                              "Unnamed Group Scope"}
                          </strong>
                        </div>
                      </td>

                      {/* =================================================
                          DESCRIPTION
                      ================================================= */}

                      <td>
                        <span className="group-scope-description">
                          {group.description ||
                            "Không có mô tả"}
                        </span>
                      </td>

                      {/* =================================================
                          USERS
                      ================================================= */}

                      <td>
                        <span className="group-scope-count">
                          {userCount}
                        </span>
                      </td>

                      {/* =================================================
                          DEPARTMENTS
                      ================================================= */}

                      <td>
                        <span className="group-scope-count">
                          {departmentCount}
                        </span>
                      </td>

                      {/* =================================================
                          ACTIONS
                      ================================================= */}

                      <td>
                        <div className="group-scope-row-actions">
                          {/* =============================================
                              VIEW
                          ============================================= */}

                          <button
                            type="button"
                            className="group-scope-action-button"
                            title="Xem chi tiết"
                            onClick={() =>
                              handleOpenDetail(group)
                            }
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="16"
                              height="16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />

                              <circle
                                cx="12"
                                cy="12"
                                r="3"
                              />
                            </svg>
                          </button>

                          {/* =============================================
                              EDIT
                          ============================================= */}

                          <button
                            type="button"
                            className="group-scope-action-button"
                            title="Chỉnh sửa"
                            onClick={() =>
                              handleOpenEdit(group)
                            }
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="16"
                              height="16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 20h9" />

                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </button>

                          {/* =============================================
                              DELETE
                          ============================================= */}

                          <button
                            type="button"
                            className="group-scope-action-button danger"
                            title="Xóa"
                            disabled
                            onClick={() =>
                              handleDelete(group.id)
                            }
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="16"
                              height="16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6" />

                              <path d="M19 6l-1 14H6L5 6" />

                              <path d="M10 11v6" />

                              <path d="M14 11v6" />

                              <path d="M9 6V4h6v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =====================================================
          CREATE GROUP SCOPE MODAL
      ===================================================== */}

      <CreateGroupScopeModal
        open={showCreateModal}
        loading={creating}
        error={error}
        onClose={handleCloseCreate}
        onSubmit={handleCreateGroupScope}
      />

      {/* =====================================================
          EDIT GROUP SCOPE MODAL
      ===================================================== */}

      <EditGroupScopeModal
        open={showEditModal}
        groupScope={editingGroupScope}
        loading={updating}
        error={editError}
        onClose={handleCloseEdit}
        onSubmit={handleUpdateGroupScope}
      />

      {/* =====================================================
          GROUP SCOPE DETAIL MODAL
      ===================================================== */}

      <GroupScopeDetailModal
        open={showDetailModal}
        groupScopeId={detailGroupScopeId}
        onClose={handleCloseDetail}
      />

      {/* =====================================================
          TOAST
      ===================================================== */}

      <GroupScopeToast
        type={toast.type}
        message={toast.message}
        title={toast.title}
        onClose={closeToast}
      />
    </>
  );
}

export default GroupScopeSection;