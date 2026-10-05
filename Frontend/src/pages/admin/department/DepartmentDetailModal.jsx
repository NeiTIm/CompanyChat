import {
  useEffect,
  useState,
} from "react";

import {
  getDepartment,
  getDepartmentStatistics,
  getDepartmentActivity,
} from "../../../services/admin/departmentService";


/* =========================================================
   ICONS
========================================================= */

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 21h18" />
      <path d="M5 21V5l7-3v19" />
      <path d="M12 8h7v13" />
      <path d="M8 7h1" />
      <path d="M8 11h1" />
      <path d="M8 15h1" />
      <path d="M15 11h1" />
      <path d="M15 15h1" />
    </svg>
  );
}


function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}


function UsersIcon() {
  return (
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle
        cx="9"
        cy="7"
        r="4"
      />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}


function ActivityIcon() {
  return (
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
      <path d="M3 12h4l3-8 4 16 3-8h4" />
    </svg>
  );
}


function CalendarIcon() {
  return (
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
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="2"
      />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </svg>
  );
}


function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11a8.1 8.1 0 0 0-14.8-4.5L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 14.8 4.5L20 16" />
      <path d="M20 20v-4h-4" />
    </svg>
  );
}


/* =========================================================
   HELPERS
========================================================= */

function formatDate(
  value
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "vi-VN"
  );
}


function formatNumber(
  value
) {
  return Number(
    value || 0
  ).toLocaleString(
    "vi-VN"
  );
}


/* =========================================================
   COMPONENT
========================================================= */

export default function DepartmentDetailModal({
  department,
  onClose,
}) {

  /* =======================================================
     DATA
  ======================================================= */

  const [detail, setDetail] =
    useState(
      department || null
    );

  const [statistics, setStatistics] =
    useState(null);

  const [activity, setActivity] =
    useState([]);


  /* =======================================================
     STATE
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");


  /* =======================================================
     LOAD DATA
  ======================================================= */

  async function loadDetail(
    showLoading = true
  ) {

    if (!department?.id) {
      return;
    }


    try {

      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");


      const [
        departmentData,
        statisticsData,
        activityData,
      ] = await Promise.all([
        getDepartment(
          department.id
        ),

        getDepartmentStatistics(
          department.id
        ),

        getDepartmentActivity(
          department.id,
          30
        ),
      ]);


      setDetail(
        departmentData
      );

      setStatistics(
        statisticsData
      );


      if (
        Array.isArray(
          activityData
        )
      ) {

        setActivity(
          activityData
        );

      } else if (
        Array.isArray(
          activityData?.items
        )
      ) {

        setActivity(
          activityData.items
        );

      } else {

        setActivity(
          []
        );

      }

    } catch (error) {

      console.error(
        "Không thể tải chi tiết phòng ban:",
        error
      );


      setError(
        error?.response?.data?.message ||
          "Không thể tải thông tin phòng ban."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  }


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {

    loadDetail(
      true
    );

  }, [
    department?.id,
  ]);


  /* =======================================================
     CLOSE
  ======================================================= */

  function handleClose() {
    if (refreshing) {
      return;
    }

    onClose?.();
  }


  /* =======================================================
     OVERLAY
  ======================================================= */

  function handleOverlayMouseDown(
    event
  ) {

    if (
      event.target ===
      event.currentTarget
    ) {

      handleClose();

    }

  }


  /* =======================================================
     RENDER
  ======================================================= */

  if (!department) {
    return null;
  }


  return (
    <div
      className="admin-department-detail-overlay"
      onMouseDown={
        handleOverlayMouseDown
      }
    >

      <div
        className="admin-department-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="department-detail-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="admin-department-detail-header">

          <div className="admin-department-detail-heading">

            <div className="admin-department-detail-icon">
              <BuildingIcon />
            </div>


            <div>

              <div className="admin-department-detail-title-row">

                <h2
                  id="department-detail-title"
                >
                  {detail?.name ||
                    department.name}
                </h2>


                <span
                  className={`admin-user-status ${
                    detail?.isActive ??
                    department.isActive
                      ? "active"
                      : "inactive"
                  }`}
                >

                  <span className="admin-status-dot" />

                  {detail?.isActive ??
                  department.isActive
                    ? "Hoạt động"
                    : "Bị khóa"}

                </span>

              </div>


              <p>
                Chi tiết phòng ban
                {" · "}
                #{detail?.id ||
                  department.id}
              </p>

            </div>

          </div>


          <div className="admin-department-detail-header-actions">

            <button
              type="button"
              className="admin-refresh-button"
              onClick={() =>
                loadDetail(false)
              }
              disabled={
                loading ||
                refreshing
              }
            >
              <RefreshIcon />

              <span>
                {refreshing
                  ? "Đang tải..."
                  : "Làm mới"}
              </span>
            </button>


            <button
              type="button"
              className="admin-department-modal-close"
              onClick={
                handleClose
              }
              disabled={
                refreshing
              }
              aria-label="Đóng"
            >
              <CloseIcon />
            </button>

          </div>

        </div>


        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="admin-department-detail-content">

          {loading ? (

            <div className="admin-department-detail-loading">

              <div className="admin-loading-spinner" />

              <span>
                Đang tải thông tin phòng ban...
              </span>

            </div>

          ) : error ? (

            <div className="admin-department-detail-error">

              <div className="admin-error-icon">
                !
              </div>

              <strong>
                Không thể tải dữ liệu
              </strong>

              <p>
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  loadDetail(true)
                }
              >
                Thử lại
              </button>

            </div>

          ) : (

            <>

              {/* =========================================
                  BASIC INFORMATION
              ========================================= */}

              <section className="admin-department-detail-section">

                <div className="admin-department-detail-section-header">

                  <div>

                    <h3>
                      Thông tin phòng ban
                    </h3>

                    <p>
                      Thông tin cơ bản của phòng ban
                    </p>

                  </div>

                </div>


                <div className="admin-department-detail-info-grid">

                  <div className="admin-department-detail-info-item">

                    <span>
                      Tên phòng ban
                    </span>

                    <strong>
                      {detail?.name ||
                        "—"}
                    </strong>

                  </div>


                  <div className="admin-department-detail-info-item">

                    <span>
                      Mã phòng ban
                    </span>

                    <strong>
                      #{detail?.id ||
                        department.id}
                    </strong>

                  </div>


                  <div className="admin-department-detail-info-item">

                    <span>
                      Ngày tạo
                    </span>

                    <strong>
                      {formatDate(
                        detail?.createdAt
                      )}
                    </strong>

                  </div>


                  <div className="admin-department-detail-info-item">

                    <span>
                      Trạng thái
                    </span>

                    <strong
                      className={
                        detail?.isActive
                          ? "text-active"
                          : "text-inactive"
                      }
                    >
                      {detail?.isActive
                        ? "Hoạt động"
                        : "Bị khóa"}
                    </strong>

                  </div>


                  <div className="admin-department-detail-info-item full">

                    <span>
                      Mô tả
                    </span>

                    <strong>
                      {detail?.description ||
                        "Chưa có mô tả"}
                    </strong>

                  </div>

                </div>

              </section>


              {/* =========================================
                  STATISTICS
              ========================================= */}

              <section className="admin-department-detail-section">

                <div className="admin-department-detail-section-header">

                  <div>

                    <h3>
                      Thống kê
                    </h3>

                    <p>
                      Tổng quan hoạt động của phòng ban
                    </p>

                  </div>

                </div>


                <div className="admin-department-statistics-grid">

                  <div className="admin-department-stat-card">

                    <div className="admin-department-stat-icon">
                      <UsersIcon />
                    </div>

                    <div>

                      <span>
                        Thành viên
                      </span>

                      <strong>
                        {formatNumber(
                          statistics?.userCount ??
                            detail?.userCount
                        )}
                      </strong>

                    </div>

                  </div>


                  <div className="admin-department-stat-card">

                    <div className="admin-department-stat-icon">
                      <ActivityIcon />
                    </div>

                    <div>

                      <span>
                        Tin nhắn
                      </span>

                      <strong>
                        {formatNumber(
                          statistics?.messageCount
                        )}
                      </strong>

                    </div>

                  </div>


                  <div className="admin-department-stat-card">

                    <div className="admin-department-stat-icon">
                      <ActivityIcon />
                    </div>

                    <div>

                      <span>
                        Người hoạt động
                      </span>

                      <strong>
                        {formatNumber(
                          statistics?.activeUsers
                        )}
                      </strong>

                    </div>

                  </div>


                  <div className="admin-department-stat-card">

                    <div className="admin-department-stat-icon">
                      <CalendarIcon />
                    </div>

                    <div>

                      <span>
                        Hoạt động
                      </span>

                      <strong>
                        30 ngày
                      </strong>

                    </div>

                  </div>

                </div>

              </section>


              {/* =========================================
                  ACTIVITY
              ========================================= */}

              <section className="admin-department-detail-section">

                <div className="admin-department-detail-section-header">

                  <div>

                    <h3>
                      Hoạt động gần đây
                    </h3>

                    <p>
                      Dữ liệu hoạt động trong 30 ngày gần nhất
                    </p>

                  </div>

                </div>


                {activity.length === 0 ? (

                  <div className="admin-department-activity-empty">

                    <ActivityIcon />

                    <span>
                      Chưa có dữ liệu hoạt động.
                    </span>

                  </div>

                ) : (

                  <div className="admin-department-activity-list">

                    {activity.map(
                      (
                        item,
                        index
                      ) => {

                        const date =
                          item.date ||
                          item.day ||
                          item.createdAt;

                        const messageCount =
                          item.messageCount ??
                          item.messages ??
                          0;

                        const activeUsers =
                          item.activeUsers ??
                          item.userCount ??
                          item.users ??
                          0;


                        return (
                          <div
                            key={
                              item.id ??
                              date ??
                              index
                            }
                            className="admin-department-activity-row"
                          >

                            <div className="admin-department-activity-date">

                              <CalendarIcon />

                              <span>
                                {formatDate(
                                  date
                                )}
                              </span>

                            </div>


                            <div className="admin-department-activity-value">

                              <span>
                                Tin nhắn
                              </span>

                              <strong>
                                {formatNumber(
                                  messageCount
                                )}
                              </strong>

                            </div>


                            <div className="admin-department-activity-value">

                              <span>
                                Người hoạt động
                              </span>

                              <strong>
                                {formatNumber(
                                  activeUsers
                                )}
                              </strong>

                            </div>

                          </div>
                        );

                      }
                    )}

                  </div>

                )}

              </section>


              {/* =========================================
                  MEMBERS PLACEHOLDER
              ========================================= */}

              <section className="admin-department-detail-section">

                <div className="admin-department-detail-section-header">

                  <div>

                    <h3>
                      Thành viên
                    </h3>

                    <p>
                      Quản lý thành viên của phòng ban
                    </p>

                  </div>


                  <span className="admin-department-members-count">

                    {formatNumber(
                      detail?.userCount ??
                        department.userCount
                    )}

                    {" "}thành viên

                  </span>

                </div>


                <div className="admin-department-members-placeholder">

                  <UsersIcon />

                  <strong>
                    Quản lý thành viên
                  </strong>

                  <span>
                    Danh sách thêm, xóa và phân quyền
                    thành viên sẽ được thực hiện ở phần
                    quản lý thành viên.
                  </span>

                </div>

              </section>

            </>

          )}

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="admin-department-detail-footer">

          <button
            type="button"
            className="admin-department-modal-cancel"
            onClick={
              handleClose
            }
            disabled={
              refreshing
            }
          >
            Đóng
          </button>

        </div>

      </div>

    </div>
  );
}