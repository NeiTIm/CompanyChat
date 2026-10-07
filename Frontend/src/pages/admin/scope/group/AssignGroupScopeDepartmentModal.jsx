import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getScopeDepartments,
  getGroupScopeDepartments,
  assignGroupScopeDepartment,
  removeGroupScopeDepartment,
} from "../../../../services/admin/scopeService";

/* =========================================================
   ASSIGN GROUP SCOPE DEPARTMENT MODAL
========================================================= */

function AssignGroupScopeDepartmentModal({
  open = false,
  groupScope = null,
  onClose,
  onSuccess,
  showToast,
}) {
  const [departments, setDepartments] =
    useState([]);

  const [
    assignedDepartmentIds,
    setAssignedDepartmentIds,
  ] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [
    actionDepartmentId,
    setActionDepartmentId,
  ] = useState(null);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  /* =======================================================
     LOAD DEPARTMENTS
  ======================================================= */

  useEffect(() => {
    if (
      !open ||
      !groupScope?.id
    ) {
      return;
    }

    let cancelled = false;

    const loadDepartments = async () => {
      try {
        setLoading(true);
        setError("");

        const departmentsResponse =
            await getScopeDepartments({
                search: "",
                page: 1,
                pageSize: 100,
            });

            const assignedResponse =
            await getGroupScopeDepartments(
                groupScope.id
            );

        if (cancelled) {
          return;
        }

        const departmentsData =
          departmentsResponse?.data ??
          departmentsResponse ??
          [];

        const assignedData =
          assignedResponse?.data ??
          assignedResponse ??
          [];

        const normalizedDepartments =
          Array.isArray(
            departmentsData
          )
            ? departmentsData
            : [];

        const normalizedAssignedIds =
          Array.isArray(
            assignedData
          )
            ? assignedData
                .map(
                  (department) =>
                    department?.id ??
                    department?.Id ??
                    department?.departmentId ??
                    department?.DepartmentId
                )
                .filter(
                  (id) =>
                    id !== undefined &&
                    id !== null
                )
            : [];

        setDepartments(
          normalizedDepartments
        );

        setAssignedDepartmentIds(
          normalizedAssignedIds
        );
      } catch (err) {
        console.error(
          "Failed to load Group Scope departments:",
          err
        );

        const errorMessage =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.response?.data?.title ||
          "Không thể tải danh sách Department.";

        if (!cancelled) {
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDepartments();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    groupScope?.id,
  ]);

  /* =======================================================
     RESET WHEN CLOSED
  ======================================================= */

  useEffect(() => {
    if (!open) {
      setSearch("");
      setError("");
      setActionDepartmentId(
        null
      );
    }
  }, [open]);

  /* =======================================================
     HELPERS
  ======================================================= */

  const getDepartmentId = (
    department
  ) =>
    department?.id ??
    department?.Id;

  const getDepartmentName = (
    department
  ) =>
    department?.name ||
    department?.Name ||
    department?.departmentName ||
    department?.DepartmentName ||
    `Department #${
      getDepartmentId(
        department
      ) ?? ""
    }`;

  const getDepartmentCode = (
    department
  ) =>
    department?.code ||
    department?.Code ||
    department?.departmentCode ||
    department?.DepartmentCode ||
    "";

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredDepartments =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return departments;
      }

      return departments.filter(
        (department) => {
          const name =
            getDepartmentName(
              department
            ).toLowerCase();

          const code =
            getDepartmentCode(
              department
            ).toLowerCase();

          return (
            name.includes(keyword) ||
            code.includes(keyword)
          );
        }
      );
    }, [
      departments,
      search,
    ]);

  /* =======================================================
     ASSIGNED CHECK
  ======================================================= */

  const isAssigned = (
    departmentId
  ) =>
    assignedDepartmentIds.includes(
      departmentId
    );

  /* =======================================================
     ASSIGN
  ======================================================= */

  const handleAssign = async (
    department
  ) => {
    const departmentId =
      getDepartmentId(
        department
      );

    if (
      !groupScope?.id ||
      !departmentId
    ) {
      return;
    }

    try {
      setActionDepartmentId(
        departmentId
      );

      setError("");

      await assignGroupScopeDepartment(
        groupScope.id,
        departmentId
      );

      setAssignedDepartmentIds(
        (current) => [
          ...current,
          departmentId,
        ]
      );

      showToast?.(
        "success",
        `${getDepartmentName(
          department
        )} đã được thêm vào Group Scope.`
      );

      onSuccess?.();
    } catch (err) {
      console.error(
        "Failed to assign Group Scope department:",
        err
      );

      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.title ||
        "Không thể thêm Department vào Group Scope.";

      setError(errorMessage);

      showToast?.(
        "error",
        errorMessage
      );
    } finally {
      setActionDepartmentId(
        null
      );
    }
  };

  /* =======================================================
     REMOVE
  ======================================================= */

  const handleRemove = async (
    department
  ) => {
    const departmentId =
      getDepartmentId(
        department
      );

    if (
      !groupScope?.id ||
      !departmentId
    ) {
      return;
    }

    try {
      setActionDepartmentId(
        departmentId
      );

      setError("");

      await removeGroupScopeDepartment(
        groupScope.id,
        departmentId
      );

      setAssignedDepartmentIds(
        (current) =>
          current.filter(
            (id) =>
              id !== departmentId
          )
      );

      showToast?.(
        "success",
        `${getDepartmentName(
          department
        )} đã được xóa khỏi Group Scope.`
      );

      onSuccess?.();
    } catch (err) {
      console.error(
        "Failed to remove Group Scope department:",
        err
      );

      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.title ||
        "Không thể xóa Department khỏi Group Scope.";

      setError(errorMessage);

      showToast?.(
        "error",
        errorMessage
      );
    } finally {
      setActionDepartmentId(
        null
      );
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
        className="scope-modal scope-group-department-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-scope-department-title"
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="scope-modal-header">
          <div>
            <h3 id="group-scope-department-title">
              Quản lý Departments
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
              actionDepartmentId !==
              null
            }
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <div className="scope-group-department-body">
          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="scope-group-department-search">
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
              placeholder="Tìm theo tên hoặc mã Department..."
              disabled={loading}
            />
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="scope-group-department-error">
              {error}
            </div>
          )}

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="scope-group-department-loading">
              <div className="group-scope-loading-spinner" />

              <span>
                Đang tải danh sách Department...
              </span>
            </div>
          ) : filteredDepartments.length ===
            0 ? (
            /* =================================================
               EMPTY
            ================================================= */

            <div className="scope-group-department-empty">
              <strong>
                Không tìm thấy Department
              </strong>

              <span>
                Không có Department phù hợp
                với từ khóa tìm kiếm.
              </span>
            </div>
          ) : (
            /* =================================================
               LIST
            ================================================= */

            <div className="scope-group-department-list">
              {filteredDepartments.map(
                (department) => {
                  const departmentId =
                    getDepartmentId(
                      department
                    );

                  const assigned =
                    isAssigned(
                      departmentId
                    );

                  const processing =
                    actionDepartmentId ===
                    departmentId;

                  return (
                    <div
                      key={
                        departmentId
                      }
                      className={`scope-group-department-item ${
                        assigned
                          ? "assigned"
                          : ""
                      }`}
                    >
                      {/* =====================================
                          INFO
                      ===================================== */}

                      <div className="scope-group-department-info">
                        <div className="scope-group-department-icon">
                          <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <rect
                              x="4"
                              y="3"
                              width="16"
                              height="18"
                              rx="2"
                            />

                            <path d="M8 7h8" />

                            <path d="M8 11h8" />

                            <path d="M8 15h5" />
                          </svg>
                        </div>

                        <div className="scope-group-department-content">
                          <strong>
                            {getDepartmentName(
                              department
                            )}
                          </strong>

                          {getDepartmentCode(
                            department
                          ) && (
                            <span>
                              {getDepartmentCode(
                                department
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* =====================================
                          ACTION
                      ===================================== */}

                      <button
                        type="button"
                        className={`scope-group-department-action ${
                          assigned
                            ? "remove"
                            : "assign"
                        }`}
                        onClick={() =>
                          assigned
                            ? handleRemove(
                                department
                              )
                            : handleAssign(
                                department
                              )
                        }
                        disabled={
                          processing ||
                          actionDepartmentId !==
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
              actionDepartmentId !==
              null
            }
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignGroupScopeDepartmentModal;