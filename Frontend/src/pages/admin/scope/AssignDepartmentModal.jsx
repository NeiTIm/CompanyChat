import {
  useEffect,
  useMemo,
  useState,
} from "react";

/* =========================================================
   ASSIGN DEPARTMENT MODAL
========================================================= */

function AssignDepartmentModal({
  open = false,
  user = null,
  departments = [],
  currentDepartmentIds = [],
  loading = false,
  saving = false,
  onClose,
  onSave,
}) {
  /* =======================================================
     SELECTED DEPARTMENT IDS
  ======================================================= */

  const [
    selectedIds,
    setSelectedIds,
  ] = useState([]);

  /* =======================================================
     USER INFO
  ======================================================= */

  const userName =
    user?.fullName ||
    user?.FullName ||
    user?.name ||
    user?.Name ||
    "Người dùng";

  /* =======================================================
     DEPARTMENT HELPERS
  ======================================================= */

  const getDepartmentId = (
    department
  ) => {
    const rawId =
      department?.departmentId ??
      department?.DepartmentId ??
      department?.id ??
      department?.Id;

    const id = Number(rawId);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return null;
    }

    return id;
  };

  const getDepartmentName = (
    department
  ) =>
    department?.departmentName ||
    department?.DepartmentName ||
    department?.name ||
    department?.Name ||
    "Department";

  /* =======================================================
     NORMALIZE DEPARTMENTS

     Đảm bảo:
     - ID hợp lệ
     - Không có NaN
     - Không duplicate department
  ======================================================= */

  const normalizedDepartments =
    useMemo(() => {
      if (
        !Array.isArray(
          departments
        )
      ) {
        return [];
      }

      const seenIds =
        new Set();

      return departments
        .map(
          (department) => {
            const id =
              getDepartmentId(
                department
              );

            if (
              id === null ||
              seenIds.has(id)
            ) {
              return null;
            }

            seenIds.add(id);

            return {
              ...department,
              departmentId:
                id,
              departmentName:
                getDepartmentName(
                  department
                ),
            };
          }
        )
        .filter(Boolean);
    }, [
      departments,
    ]);

  /* =======================================================
     SYNC CURRENT SCOPE
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    if (
      !Array.isArray(
        currentDepartmentIds
      )
    ) {
      setSelectedIds([]);
      return;
    }

    const ids =
      currentDepartmentIds
        .map(Number)
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        );

    setSelectedIds([
      ...new Set(ids),
    ]);
  }, [
    open,
    currentDepartmentIds,
  ]);

  /* =======================================================
     TOGGLE DEPARTMENT
  ======================================================= */

  const handleToggle = (
    departmentId
  ) => {
    const id =
      Number(departmentId);

    /*
     * Không cho phép NaN / ID không hợp lệ
     */

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return;
    }

    setSelectedIds(
      (current) => {
        /*
         * REMOVE
         */

        if (
          current.includes(id)
        ) {
          return current.filter(
            (item) =>
              item !== id
          );
        }

        /*
         * ADD
         */

        return [
          ...current,
          id,
        ];
      }
    );
  };

  /* =======================================================
     SELECT ALL
  ======================================================= */

  const handleSelectAll = () => {
    if (
      normalizedDepartments.length ===
      0
    ) {
      setSelectedIds([]);
      return;
    }

    const ids =
      normalizedDepartments
        .map(
          (department) =>
            department.departmentId
        )
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        );

    setSelectedIds([
      ...new Set(ids),
    ]);
  };

  /* =======================================================
     CLEAR ALL
  ======================================================= */

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave = () => {
    if (saving) {
      return;
    }

    /*
     * Final validation trước khi gửi
     */

    const validIds =
      selectedIds
        .map(Number)
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        );

    const uniqueIds = [
      ...new Set(validIds),
    ];

    onSave?.(
      uniqueIds
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
      className="scope-modal-overlay"
      onMouseDown={(event) => {
        /*
         * Chỉ đóng khi click vào background
         */

        if (
          event.target ===
          event.currentTarget
        ) {
          if (!saving) {
            onClose?.();
          }
        }
      }}
    >
      <div
        className="scope-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-scope-title"
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="scope-modal-header">
          <div>
            <h3 id="assign-scope-title">
              Gán Department Scope
            </h3>

            <p>
              {userName}
            </p>
          </div>

          <button
            type="button"
            className="scope-modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="scope-modal-toolbar">
          <div className="scope-modal-selection-info">
            Đã chọn{" "}
            <strong>
              {selectedIds.length}
            </strong>{" "}
            Department
          </div>

          <div className="scope-modal-selection-actions">
            {/* =============================================
                SELECT ALL
            ============================================= */}

            <button
              type="button"
              onClick={
                handleSelectAll
              }
              disabled={
                loading ||
                saving ||
                normalizedDepartments.length ===
                  0
              }
            >
              Chọn tất cả
            </button>

            {/* =============================================
                CLEAR ALL
            ============================================= */}

            <button
              type="button"
              onClick={
                handleClearAll
              }
              disabled={
                loading ||
                saving ||
                selectedIds.length ===
                  0
              }
            >
              Bỏ chọn
            </button>
          </div>
        </div>

        {/* =================================================
            DEPARTMENT LIST
        ================================================= */}

        <div className="scope-department-selector">
          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="scope-modal-loading">
              Đang tải Department...
            </div>
          ) : normalizedDepartments.length ===
            0 ? (
            /* =================================================
                EMPTY
            ================================================= */

            <div className="scope-modal-empty">
              Không có Department khả dụng.
            </div>
          ) : (
            /* =================================================
                DEPARTMENTS
            ================================================= */

            normalizedDepartments.map(
              (department) => {
                const id =
                  department.departmentId;

                const name =
                  department.departmentName;

                const checked =
                  selectedIds.includes(
                    id
                  );

                return (
                  <label
                    key={`scope-department-${id}`}
                    className={
                      checked
                        ? "scope-department-option selected"
                        : "scope-department-option"
                    }
                  >
                    <input
                      type="checkbox"
                      checked={
                        checked
                      }
                      onChange={() =>
                        handleToggle(
                          id
                        )
                      }
                      disabled={
                        saving
                      }
                    />

                    <span className="scope-department-option-name">
                      {name}
                    </span>
                  </label>
                );
              }
            )
          )}
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="scope-modal-footer">
          {/* =================================================
              CANCEL
          ================================================= */}

          <button
            type="button"
            className="scope-modal-cancel"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </button>

          {/* =================================================
              SAVE
          ================================================= */}

          <button
            type="button"
            className="scope-modal-save"
            onClick={handleSave}
            disabled={
              loading ||
              saving
            }
          >
            {saving
              ? "Đang lưu..."
              : "Lưu Scope"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignDepartmentModal;