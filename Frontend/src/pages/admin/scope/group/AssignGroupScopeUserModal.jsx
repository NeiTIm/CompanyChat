import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getScopeUsers,
  getGroupScopeUsers,
  assignGroupScopeUser,
  removeGroupScopeUser,
} from "../../../../services/admin/scopeService";

/* =========================================================
   ASSIGN GROUP SCOPE USER MODAL
========================================================= */

function AssignGroupScopeUserModal({
  open = false,
  groupScope = null,
  onClose,
  onSuccess,
  showToast,
}) {
  /* =======================================================
     STATE
  ======================================================= */

  const [users, setUsers] = useState([]);

  const [assignedUserIds, setAssignedUserIds] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [actionUserId, setActionUserId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  /* =======================================================
     LOAD USERS
  ======================================================= */

  useEffect(() => {
    if (!open || !groupScope?.id) {
      return;
    }

    let cancelled = false;

    const loadUsers = async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * Load toàn bộ User có thể assign.
         */
        const usersResponse =
          await getScopeUsers();

        /*
         * Load User hiện đang thuộc Group Scope.
         */
        const assignedResponse =
          await getGroupScopeUsers(
            groupScope.id
          );

        if (cancelled) {
          return;
        }

        const usersData =
          usersResponse?.data ??
          usersResponse ??
          [];

        const assignedData =
          assignedResponse?.data ??
          assignedResponse ??
          [];

        /*
         * Chuẩn hóa dữ liệu User.
         */
        const normalizedUsers =
          Array.isArray(usersData)
            ? usersData
            : [];

        /*
         * Backend Group Scope trả:
         *
         * [
         *   {
         *     id,
         *     fullName,
         *     email
         *   }
         * ]
         *
         * hoặc có thể trả object dạng User.
         */
        const normalizedAssignedIds =
          Array.isArray(assignedData)
            ? assignedData
                .map(
                  (user) =>
                    user?.id ??
                    user?.Id ??
                    user?.userId ??
                    user?.UserId
                )
                .filter(
                  (id) =>
                    id !== undefined &&
                    id !== null
                )
            : [];

        setUsers(
          normalizedUsers
        );

        setAssignedUserIds(
          normalizedAssignedIds
        );
      } catch (err) {
        console.error(
          "Failed to load Group Scope users:",
          err
        );

        const errorMessage =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.response?.data?.title ||
          "Không thể tải danh sách User.";

        if (!cancelled) {
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    groupScope?.id,
  ]);

  /* =======================================================
     RESET SEARCH
  ======================================================= */

  useEffect(() => {
    if (!open) {
      setSearch("");
      setError("");
      setActionUserId(null);
    }
  }, [open]);

  /* =======================================================
     USER HELPERS
  ======================================================= */

  const getUserId = (user) =>
    user?.id ??
    user?.Id;

  const getUserName = (user) =>
    user?.fullName ||
    user?.FullName ||
    user?.name ||
    user?.Name ||
    user?.email ||
    user?.Email ||
    `User #${getUserId(user) ?? ""}`;

  const getUserEmail = (user) =>
    user?.email ||
    user?.Email ||
    "—";

  /* =======================================================
     FILTER USERS
  ======================================================= */

  const filteredUsers = useMemo(() => {
    const keyword =
      search
        .trim()
        .toLowerCase();

    if (!keyword) {
      return users;
    }

    return users.filter(
      (user) => {
        const name =
          getUserName(user)
            .toLowerCase();

        const email =
          getUserEmail(user)
            .toLowerCase();

        return (
          name.includes(keyword) ||
          email.includes(keyword)
        );
      }
    );
  }, [
    users,
    search,
  ]);

  /* =======================================================
     ASSIGNED CHECK
  ======================================================= */

  const isAssigned = (userId) =>
    assignedUserIds.includes(
      userId
    );

  /* =======================================================
     ASSIGN USER
  ======================================================= */

  const handleAssign = async (
    user
  ) => {
    const userId =
      getUserId(user);

    if (!groupScope?.id || !userId) {
      return;
    }

    try {
      setActionUserId(userId);
      setError("");

      await assignGroupScopeUser(
        groupScope.id,
        userId
      );

      setAssignedUserIds(
        (current) => [
          ...current,
          userId,
        ]
      );

      showToast?.(
        "success",
        `${getUserName(user)} đã được thêm vào Group Scope.`
      );

      onSuccess?.();
    } catch (err) {
      console.error(
        "Failed to assign Group Scope user:",
        err
      );

      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.title ||
        "Không thể thêm User vào Group Scope.";

      setError(errorMessage);

      showToast?.(
        "error",
        errorMessage
      );
    } finally {
      setActionUserId(null);
    }
  };

  /* =======================================================
     REMOVE USER
  ======================================================= */

  const handleRemove = async (
    user
  ) => {
    const userId =
      getUserId(user);

    if (!groupScope?.id || !userId) {
      return;
    }

    try {
      setActionUserId(userId);
      setError("");

      await removeGroupScopeUser(
        groupScope.id,
        userId
      );

      setAssignedUserIds(
        (current) =>
          current.filter(
            (id) =>
              id !== userId
          )
      );

      showToast?.(
        "success",
        `${getUserName(user)} đã được xóa khỏi Group Scope.`
      );

      onSuccess?.();
    } catch (err) {
      console.error(
        "Failed to remove Group Scope user:",
        err
      );

      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.title ||
        "Không thể xóa User khỏi Group Scope.";

      setError(errorMessage);

      showToast?.(
        "error",
        errorMessage
      );
    } finally {
      setActionUserId(null);
    }
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
      className="scope-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose?.();
        }
      }}
    >
      <div
        className="scope-modal scope-group-user-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-scope-user-title"
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="scope-modal-header">
          <div>
            <h3 id="group-scope-user-title">
              Quản lý Users
            </h3>

            <p>
              {groupScope?.name ||
                "Group Scope"}
            </p>
          </div>

          <button
            type="button"
            className="scope-modal-close"
            onClick={onClose}
            disabled={
              actionUserId !== null
            }
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <div className="scope-group-user-body">
          {/* ===============================================
              SEARCH
          =============================================== */}

          <div className="scope-group-user-search">
            <svg
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
              />

              <path d="m20 20-4-4" />
            </svg>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Tìm theo tên hoặc email..."
              disabled={loading}
            />
          </div>

          {/* ===============================================
              ERROR
          =============================================== */}

          {error && (
            <div className="scope-group-user-error">
              {error}
            </div>
          )}

          {/* ===============================================
              LOADING
          =============================================== */}

          {loading ? (
            <div className="scope-group-user-loading">
              <div className="group-scope-loading-spinner" />

              <span>
                Đang tải danh sách User...
              </span>
            </div>
          ) : filteredUsers.length ===
            0 ? (
            /* =============================================
                EMPTY
            ============================================= */

            <div className="scope-group-user-empty">
              <strong>
                Không tìm thấy User
              </strong>

              <span>
                Không có User phù hợp với
                từ khóa tìm kiếm.
              </span>
            </div>
          ) : (
            /* =============================================
                USER LIST
            ============================================= */

            <div className="scope-group-user-list">
              {filteredUsers.map(
                (user) => {
                  const userId =
                    getUserId(user);

                  const assigned =
                    isAssigned(
                      userId
                    );

                  const processing =
                    actionUserId ===
                    userId;

                  return (
                    <div
                      key={userId}
                      className={`scope-group-user-item ${
                        assigned
                          ? "assigned"
                          : ""
                      }`}
                    >
                      {/* =================================
                          USER INFO
                      ================================= */}

                      <div className="scope-group-user-info">
                        <div className="scope-group-user-avatar">
                          {getUserName(
                            user
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="scope-group-user-content">
                          <strong>
                            {getUserName(
                              user
                            )}
                          </strong>

                          <span>
                            {getUserEmail(
                              user
                            )}
                          </span>
                        </div>
                      </div>

                      {/* =================================
                          ACTION
                      ================================= */}

                      <button
                        type="button"
                        className={`scope-group-user-action ${
                          assigned
                            ? "remove"
                            : "assign"
                        }`}
                        onClick={() =>
                          assigned
                            ? handleRemove(
                                user
                              )
                            : handleAssign(
                                user
                              )
                        }
                        disabled={
                          processing ||
                          actionUserId !==
                            null
                        }
                      >
                        {processing ? (
                          <span className="button-spinner" />
                        ) : assigned ? (
                          "Remove"
                        ) : (
                          "Assign"
                        )}
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="scope-modal-footer">
          <button
            type="button"
            className="scope-modal-cancel"
            onClick={onClose}
            disabled={
              actionUserId !== null
            }
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignGroupScopeUserModal;