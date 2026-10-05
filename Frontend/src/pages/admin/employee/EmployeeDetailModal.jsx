export default function EmployeeDetailModal({
  user,
  loading,
  onClose,
}) {
  return (
    <div
      className="admin-modal-overlay"
      onClick={onClose}
    >
      <div
        className="admin-user-modal admin-employee-detail-modal"
        onClick={(event) => event.stopPropagation()}
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
            <span>Đang tải thông tin...</span>
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

              {/* DEPARTMENT */}
              <div className="admin-detail-item">
                <span>Department</span>

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
          </div>
        )}
      </div>
    </div>
  );
}