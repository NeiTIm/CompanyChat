/* =========================================================
   SCOPE USER MODAL
========================================================= */

function ScopeUserModal({
  open = false,
  user = null,
  departments = [],
  loading = false,
  onClose,
}) {
  /* =======================================================
     CLOSED
  ======================================================= */

  if (!open) {
    return null;
  }

  /* =======================================================
     USER INFO
  ======================================================= */

  const userName =
    user?.fullName ||
    user?.FullName ||
    user?.name ||
    user?.Name ||
    "Không xác định";

  const email =
    user?.email ||
    user?.Email ||
    "—";

  const role =
    user?.role ||
    user?.Role ||
    "—";

  /* =======================================================
     DEPARTMENT HELPERS
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
    "Department";

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
        className="scope-modal scope-user-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scope-user-title"
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="scope-modal-header">
          <div>
            <h3 id="scope-user-title">
              Chi tiết Scope
            </h3>

            <p>
              {userName}
            </p>
          </div>

          <button
            type="button"
            className="scope-modal-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        {/* =================================================
            USER INFORMATION
        ================================================= */}

        <div className="scope-user-detail">
          <div className="scope-user-detail-row">
            <span>
              Họ tên
            </span>

            <strong>
              {userName}
            </strong>
          </div>

          <div className="scope-user-detail-row">
            <span>
              Email
            </span>

            <strong>
              {email}
            </strong>
          </div>

          <div className="scope-user-detail-row">
            <span>
              Role
            </span>

            <strong>
              {role}
            </strong>
          </div>
        </div>

        {/* =================================================
            MANAGED DEPARTMENTS
        ================================================= */}

        <div className="scope-user-departments">
          <div className="scope-user-departments-title">
            Managed Departments
          </div>

          {loading ? (
            <div className="scope-modal-loading">
              Đang tải Scope...
            </div>
          ) : departments.length ===
            0 ? (
            <div className="scope-modal-empty">
              Người dùng chưa có Department
              Scope.
            </div>
          ) : (
            <div className="scope-department-list">
              {departments.map(
                (department) => (
                  <span
                    key={getDepartmentId(
                      department
                    )}
                    className="scope-department-badge"
                  >
                    {getDepartmentName(
                      department
                    )}
                  </span>
                )
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
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScopeUserModal;