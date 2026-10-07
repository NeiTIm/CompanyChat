import { useEffect, useState } from "react";
import {
  getGroupScope,
  getGroupScopeUsers,
  getGroupScopeDepartments,
} from "../../../../services/admin/scopeService";

/* =========================================================
   GROUP SCOPE DETAIL MODAL
========================================================= */

function GroupScopeDetailModal({
  open = false,
  groupScopeId = null,
  onClose,
}) {
  const [groupScope, setGroupScope] = useState(null);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =======================================================
     LOAD DETAIL
  ======================================================= */

  useEffect(() => {
    if (!open || !groupScopeId) {
      return;
    }

    let cancelled = false;

    const loadDetail = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          groupScopeResponse,
          usersResponse,
          departmentsResponse,
        ] = await Promise.all([
          getGroupScope(groupScopeId),
          getGroupScopeUsers(groupScopeId),
          getGroupScopeDepartments(groupScopeId),
        ]);

        if (cancelled) {
          return;
        }

        /* =================================================
           GROUP SCOPE
        ================================================= */

        const groupScopeData =
          groupScopeResponse?.data ??
          groupScopeResponse ??
          null;

        setGroupScope(groupScopeData);

        /* =================================================
           USERS

           Backend:
           GET /api/admin/group-scopes/{id}/users

           Response:
           [
             {
               id,
               fullName,
               email
             }
           ]
        ================================================= */

        const usersData =
          usersResponse?.data ??
          usersResponse ??
          [];

        setUsers(
          Array.isArray(usersData)
            ? usersData
            : []
        );

        /* =================================================
           DEPARTMENTS

           Backend:
           GET /api/admin/group-scopes/{id}/departments

           Response:
           [
             {
               id,
               name
             }
           ]
        ================================================= */

        const departmentsData =
          departmentsResponse?.data ??
          departmentsResponse ??
          [];

        setDepartments(
          Array.isArray(departmentsData)
            ? departmentsData
            : []
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Load Group Scope detail error:",
          err
        );

        setGroupScope(null);
        setUsers([]);
        setDepartments([]);

        setError(
          err?.response?.data?.message ||
            err?.response?.data?.title ||
            "Không thể tải thông tin Group Scope."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [open, groupScopeId]);

  /* =======================================================
     CLOSE
  ======================================================= */

  const handleClose = () => {
    if (loading) {
      return;
    }

    onClose?.();
  };

  /* =======================================================
     HELPERS
  ======================================================= */

  const getUserName = (user) => {
    return (
      user?.fullName ||
      user?.email ||
      `User #${user?.id ?? ""}`
    );
  };

  const getDepartmentName = (department) => {
    return (
      department?.name ||
      `Department #${department?.id ?? ""}`
    );
  };

  /* =======================================================
     CLOSED
  ======================================================= */

  if (!open) {
    return null;
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="modal-dialog scope-group-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-scope-detail-title"
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-header-icon">
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
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>

            <div>
              <h2 id="group-scope-detail-title">
                Chi tiết Group Scope
              </h2>

              <p>
                Xem thông tin và phạm vi quản lý của Group
                Scope.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Đóng"
          >
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
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <div className="modal-body group-scope-detail-body">
          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="scope-group-modal-error">
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
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>

              <span>{error}</span>
            </div>
          )}

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="group-scope-detail-loading">
              <span className="group-scope-loading-spinner" />

              <span>
                Đang tải thông tin...
              </span>
            </div>
          ) : (
            <>
              {/* =================================================
                  BASIC INFO
              ================================================= */}

              <section className="group-scope-detail-section">
                <div className="group-scope-detail-section-header">
                  <div>
                    <h3>
                      Thông tin Group Scope
                    </h3>

                    <p>
                      Thông tin cơ bản của phạm vi quản lý.
                    </p>
                  </div>
                </div>

                <div className="group-scope-detail-info-grid">
                  <div className="group-scope-detail-info-item">
                    <span>ID</span>

                    <strong>
                      #{groupScope?.id ?? groupScopeId}
                    </strong>
                  </div>

                  <div className="group-scope-detail-info-item">
                    <span>Tên</span>

                    <strong>
                      {groupScope?.name || "—"}
                    </strong>
                  </div>

                  <div className="group-scope-detail-info-item group-scope-detail-info-full">
                    <span>Mô tả</span>

                    <strong>
                      {groupScope?.description ||
                        "Chưa có mô tả"}
                    </strong>
                  </div>
                </div>
              </section>

              {/* =================================================
                  SUMMARY
              ================================================= */}

              <section className="group-scope-detail-summary">
                {/* USERS */}

                <div className="group-scope-detail-summary-card">
                  <div className="group-scope-detail-summary-icon">
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
                    <span>
                      Users
                    </span>

                    <strong>
                      {users.length}
                    </strong>
                  </div>
                </div>

                {/* DEPARTMENTS */}

                <div className="group-scope-detail-summary-card">
                  <div className="group-scope-detail-summary-icon">
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

                      <path d="M9 21v-4h6v4" />

                      <path d="M9 9h.01" />

                      <path d="M12 9h.01" />

                      <path d="M15 9h.01" />
                    </svg>
                  </div>

                  <div>
                    <span>
                      Departments
                    </span>

                    <strong>
                      {departments.length}
                    </strong>
                  </div>
                </div>
              </section>

              {/* =================================================
                  USERS
              ================================================= */}

              <section className="group-scope-detail-section">
                <div className="group-scope-detail-section-header">
                  <div>
                    <h3>
                      Users
                    </h3>

                    <p>
                      Người dùng được gán trực tiếp vào Group
                      Scope.
                    </p>
                  </div>
                </div>

                {users.length === 0 ? (
                  <div className="group-scope-detail-empty">
                    Chưa có User nào được gán trực tiếp.
                  </div>
                ) : (
                  <div className="group-scope-detail-list">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="group-scope-detail-list-item"
                      >
                        <div className="group-scope-detail-list-icon">
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
                            <path d="M20 21a8 8 0 0 0-16 0" />

                            <circle
                              cx="12"
                              cy="7"
                              r="4"
                            />
                          </svg>
                        </div>

                        <div className="group-scope-detail-list-content">
                          <strong>
                            {getUserName(user)}
                          </strong>

                          {user.email && (
                            <span>
                              {user.email}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* =================================================
                  DEPARTMENTS
              ================================================= */}

              <section className="group-scope-detail-section">
                <div className="group-scope-detail-section-header">
                  <div>
                    <h3>
                      Departments
                    </h3>

                    <p>
                      Các Department thuộc phạm vi quản lý.
                    </p>
                  </div>
                </div>

                {departments.length === 0 ? (
                  <div className="group-scope-detail-empty">
                    Chưa có Department nào được gán.
                  </div>
                ) : (
                  <div className="group-scope-detail-list">
                    {departments.map((department) => (
                      <div
                        key={department.id}
                        className="group-scope-detail-list-item"
                      >
                        <div className="group-scope-detail-list-icon">
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
                            <path d="M3 21h18" />

                            <path d="M5 21V7l7-4 7 4v14" />

                            <path d="M9 21v-4h6v4" />
                          </svg>
                        </div>

                        <div className="group-scope-detail-list-content">
                          <strong>
                            {getDepartmentName(
                              department
                            )}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="modal-footer">
          <button
            type="button"
            className="modal-button modal-button-secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroupScopeDetailModal;