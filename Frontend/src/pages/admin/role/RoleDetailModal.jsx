import {
  useEffect,
} from "react";


export default function RoleDetailModal({
  open,
  role,
  loading,
  onClose,
  onEdit,
  onManagePermissions,
  canUpdate,
  canAssign,
}) {

  /* =======================================================
     ESC TO CLOSE
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event) {
      if (
        event.key === "Escape"
      ) {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    onClose,
  ]);


  /* =======================================================
     NO RENDER
  ======================================================= */

  if (
    !open ||
    !role
  ) {
    return null;
  }


  /* =======================================================
     DATA
  ======================================================= */

  const isSystemRole =
    Boolean(
      role.isSystemRole
    );

  const userCount =
    Number(
      role.userCount || 0
    );

  const activeUserCount =
    Number(
      role.activeUserCount || 0
    );

  const onlineUserCount =
    Number(
      role.onlineUserCount || 0
    );

  const permissionCount =
    Number(
      role.permissionCount || 0
    );


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="admin-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div
        className="admin-role-modal admin-role-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-detail-title"
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="admin-role-modal-header">

          <div className="admin-role-detail-heading">

            <div className="admin-role-detail-avatar">
              {role.name
                ?.charAt(0)
                ?.toUpperCase() ||
                "R"}
            </div>

            <div>

              <h2 id="role-detail-title">
                {role.name}
              </h2>

              <div className="admin-role-detail-type">

                {isSystemRole ? (
                  <span className="admin-role-badge system">
                    System Role
                  </span>
                ) : (
                  <span className="admin-role-badge custom">
                    Custom Role
                  </span>
                )}

              </div>

            </div>

          </div>


          <button
            type="button"
            className="admin-role-modal-close"
            onClick={
              onClose
            }
            aria-label="Đóng"
          >
            ×
          </button>

        </div>


        {/* =================================================
            BODY
        ================================================= */}

        <div className="admin-role-modal-body">

          {loading ? (
            <div className="admin-role-detail-loading">

              <div className="admin-role-loading-spinner" />

              <span>
                Đang tải thông tin Role...
              </span>

            </div>
          ) : (
            <>

              {/* ===========================================
                  DESCRIPTION
              =========================================== */}

              <section className="admin-role-detail-section">

                <div className="admin-role-detail-section-title">
                  Mô tả
                </div>

                <div className="admin-role-detail-description">

                  {role.description?.trim()
                    ? role.description
                    : "Role này chưa có mô tả."}

                </div>

              </section>


              {/* ===========================================
                  STATISTICS
              =========================================== */}

              <section className="admin-role-detail-section">

                <div className="admin-role-detail-section-title">
                  Thống kê
                </div>


                <div className="admin-role-detail-stats">

                  {/* USERS */}

                  <div className="admin-role-detail-stat">

                    <div className="admin-role-detail-stat-icon users">

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

                      <strong>
                        {userCount}
                      </strong>

                      <span>
                        Tổng người dùng
                      </span>

                    </div>

                  </div>


                  {/* ACTIVE */}

                  <div className="admin-role-detail-stat">

                    <div className="admin-role-detail-stat-icon active">

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
                        <path d="M20 6 9 17l-5-5" />
                      </svg>

                    </div>

                    <div>

                      <strong>
                        {activeUserCount}
                      </strong>

                      <span>
                        Đang hoạt động
                      </span>

                    </div>

                  </div>


                  {/* ONLINE */}

                  <div className="admin-role-detail-stat">

                    <div className="admin-role-detail-stat-icon online">

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
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                        />
                        <path d="M8 12l2.5 2.5L16 9" />
                      </svg>

                    </div>

                    <div>

                      <strong>
                        {onlineUserCount}
                      </strong>

                      <span>
                        Đang online
                      </span>

                    </div>

                  </div>


                  {/* PERMISSIONS */}

                  <div className="admin-role-detail-stat">

                    <div className="admin-role-detail-stat-icon permission">

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
                        <path d="M12 2v20" />
                        <path d="M2 12h20" />
                        <circle
                          cx="12"
                          cy="12"
                          r="8"
                        />
                      </svg>

                    </div>

                    <div>

                      <strong>
                        {permissionCount}
                      </strong>

                      <span>
                        Permission
                      </span>

                    </div>

                  </div>

                </div>

              </section>


              {/* ===========================================
                  INFORMATION
              =========================================== */}

              <section className="admin-role-detail-section">

                <div className="admin-role-detail-section-title">
                  Thông tin
                </div>


                <div className="admin-role-detail-information">

                  <div className="admin-role-detail-information-row">

                    <span>
                      ID
                    </span>

                    <strong>
                      #{role.id}
                    </strong>

                  </div>


                  <div className="admin-role-detail-information-row">

                    <span>
                      Loại Role
                    </span>

                    <strong>
                      {isSystemRole
                        ? "System Role"
                        : "Custom Role"}
                    </strong>

                  </div>


                  <div className="admin-role-detail-information-row">

                    <span>
                      Ngày tạo
                    </span>

                    <strong>
                      {role.createdAt
                        ? new Date(
                            role.createdAt
                          ).toLocaleString(
                            "vi-VN"
                          )
                        : "—"}
                    </strong>

                  </div>

                </div>

              </section>

            </>
          )}

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

        {!loading && (
          <div className="admin-role-modal-footer">

            <button
              type="button"
              className="admin-role-modal-cancel"
              onClick={
                onClose
              }
            >
              Đóng
            </button>


            {canAssign && (
              <button
                type="button"
                className="admin-role-permission-button"
                onClick={() =>
                  onManagePermissions(
                    role.id
                  )
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  width="17"
                  height="17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v20" />
                  <path d="M2 12h20" />
                  <circle
                    cx="12"
                    cy="12"
                    r="8"
                  />
                </svg>

                <span>
                  Quản lý Permission
                </span>
              </button>
            )}


            {canUpdate && (
              <button
                type="button"
                className="admin-role-modal-submit"
                onClick={() =>
                  onEdit(
                    role.id
                  )
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  width="17"
                  height="17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                </svg>

                <span>
                  Chỉnh sửa
                </span>
              </button>
            )}

          </div>
        )}

      </div>

    </div>
  );
}