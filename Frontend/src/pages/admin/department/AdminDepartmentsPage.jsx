import {
  useEffect,
  useState,
} from "react";

import {
  getDepartments,
  updateDepartmentStatus,
} from "../../../services/admin/departmentService";

import CreateDepartmentModal from "./CreateDepartmentModal";
import EditDepartmentModal from "./EditDepartmentModal";
import DepartmentMembersModal from "./DepartmentMembersModal";
import DepartmentDetailModal from "./DepartmentDetailModal";

import Toast from "../../../components/common/Toast";
import { hasPermission } from "../../../utils/permissionUtils";


/* =========================================================
   ICONS
========================================================= */

function SearchIcon() {
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
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m20 20-3.5-3.5" />
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


function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}


function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}


function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}


function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
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


function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}


function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />

      <circle
        cx="12"
        cy="12"
        r="2.5"
      />
    </svg>
  );
}


function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="10"
        width="16"
        height="10"
        rx="2"
      />

      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}


function UnlockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="10"
        width="16"
        height="10"
        rx="2"
      />

      <path d="M8 10V7a4 4 0 0 1 7.5-2" />
    </svg>
  );
}


function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
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


/* =========================================================
   PAGE
========================================================= */

export default function AdminDepartmentsPage() {

  /* =======================================================
     PERMISSIONS
  ======================================================= */

  const canView = hasPermission(
    "Department.View"
  );

  const canCreate = hasPermission(
    "Department.Create"
  );

  const canUpdate = hasPermission(
    "Department.Update"
  );

  const canEnable = hasPermission(
    "Department.Enable"
  );

  const canDisable = hasPermission(
    "Department.Disable"
  );

  const canManageMembers = hasPermission(
    "Department.ManageMembers"
  );

  const canViewStatistics = hasPermission(
    "Department.ViewStatistics"
  );


  /* =======================================================
     DATA
  ======================================================= */

  const [departments, setDepartments] =
    useState([]);

  const [selectedDepartment, setSelectedDepartment] =
    useState(null);


  /* =======================================================
     LOADING / ERROR
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  /* =======================================================
     FILTERS
  ======================================================= */

  const [search, setSearch] =
    useState("");

  const [isActive, setIsActive] =
    useState("");


  /* =======================================================
     PAGINATION
  ======================================================= */

  const [page, setPage] =
    useState(1);

  const [pageSize] =
    useState(10);

  const [total, setTotal] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(1);


  /* =======================================================
     MODALS
  ======================================================= */

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [showMembersModal, setShowMembersModal] =
    useState(false);

  const [showDetailModal, setShowDetailModal] =
    useState(false);


  /* =======================================================
     CONFIRM
  ======================================================= */

  const [confirmModal, setConfirmModal] =
    useState(null);


  /* =======================================================
     TOAST
  ======================================================= */

  const [toast, setToast] =
    useState(null);


  /* =======================================================
     SHOW TOAST
  ======================================================= */

  function showToast(
    type,
    message,
    duration = 3000
  ) {
    setToast({
      id: Date.now(),
      type,
      message,
      duration,
    });
  }


  /* =======================================================
     CLOSE TOAST
  ======================================================= */

  function closeToast() {
    setToast(null);
  }


  /* =======================================================
     LOAD DEPARTMENTS
  ======================================================= */

  async function loadDepartments(
    customPage = page,
    customSearch = search,
    customIsActive = isActive
  ) {
    if (!canView) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      let activeFilter = null;

      if (
        customIsActive === "true"
      ) {
        activeFilter = true;
      }

      if (
        customIsActive === "false"
      ) {
        activeFilter = false;
      }

      const data =
        await getDepartments({
          search:
            customSearch.trim(),

          isActive:
            activeFilter,

          page:
            customPage,

          pageSize,
        });

      setDepartments(
        data?.items || []
      );

      setTotal(
        data?.total || 0
      );

      setTotalPages(
        Math.max(
          data?.totalPages || 1,
          1
        )
      );

    } catch (error) {
      console.error(
        "Không thể tải danh sách phòng ban:",
        error
      );

      const message =
        error?.response?.data?.message ||
        "Không thể tải danh sách phòng ban.";

      setError(message);

      showToast(
        "error",
        message
      );

    } finally {
      setLoading(false);
    }
  }


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    loadDepartments(
      page,
      search,
      isActive
    );
  }, [
    page,
    isActive,
    canView,
  ]);


  /* =======================================================
     SEARCH
  ======================================================= */

  function handleSearchSubmit(
    event
  ) {
    event.preventDefault();

    if (!canView) {
      return;
    }

    setPage(1);

    loadDepartments(
      1,
      search,
      isActive
    );
  }


  function handleClearSearch() {
    if (!canView) {
      return;
    }

    setSearch("");

    setPage(1);

    loadDepartments(
      1,
      "",
      isActive
    );
  }


  /* =======================================================
     STATUS FILTER
  ======================================================= */

  function handleStatusChange(
    event
  ) {
    if (!canView) {
      return;
    }

    setIsActive(
      event.target.value
    );

    setPage(1);
  }


  /* =======================================================
     REFRESH
  ======================================================= */

  function handleRefresh() {
    if (!canView) {
      return;
    }

    loadDepartments(
      page,
      search,
      isActive
    );
  }


  /* =======================================================
     CREATE
  ======================================================= */

  function handleCreate() {
    if (!canCreate) {
      return;
    }

    setSelectedDepartment(
      null
    );

    setShowCreateModal(
      true
    );
  }


  /* =======================================================
     EDIT
  ======================================================= */

  function handleEdit(
    department
  ) {
    if (!canUpdate) {
      return;
    }

    setSelectedDepartment(
      department
    );

    setShowEditModal(
      true
    );
  }


  /* =======================================================
     MEMBERS
  ======================================================= */

  function handleMembers(
    department
  ) {
    if (!canManageMembers) {
      return;
    }

    setSelectedDepartment(
      department
    );

    setShowMembersModal(
      true
    );
  }


  /* =======================================================
     DETAIL
  ======================================================= */

  function handleView(
    department
  ) {
    if (!canView) {
      return;
    }

    setSelectedDepartment(
      department
    );

    setShowDetailModal(
      true
    );
  }


  /* =======================================================
     TOGGLE ACTIVE
  ======================================================= */

  function handleToggleActive(
    department
  ) {
    const nextActive =
      !department.isActive;

    const canChangeStatus =
      nextActive
        ? canEnable
        : canDisable;

    if (!canChangeStatus) {
      return;
    }

    const actionText =
      nextActive
        ? "mở"
        : "khóa";

    setConfirmModal({
      title:
        nextActive
          ? "Xác nhận mở phòng ban"
          : "Xác nhận khóa phòng ban",

      message:
        `Bạn có chắc muốn ${actionText} phòng ban ` +
        `"${department.name}"?`,

      confirmText:
        nextActive
          ? "Mở phòng ban"
          : "Khóa phòng ban",

      cancelText:
        "Hủy",

      danger:
        !nextActive,

      onConfirm:
        async () => {
          try {
            setActionLoading(
              true
            );

            await updateDepartmentStatus(
              department.id,
              nextActive
            );


            /* =============================================
               UPDATE TABLE
            ============================================= */

            setDepartments(
              (current) =>
                current.map(
                  (item) =>
                    item.id ===
                    department.id
                      ? {
                          ...item,
                          isActive:
                            nextActive,
                        }
                      : item
                )
            );


            /* =============================================
               UPDATE SELECTED DEPARTMENT
            ============================================= */

            setSelectedDepartment(
              (current) =>
                current?.id ===
                department.id
                  ? {
                      ...current,
                      isActive:
                        nextActive,
                    }
                  : current
            );


            /* =============================================
               CLOSE CONFIRM
            ============================================= */

            setConfirmModal(
              null
            );


            /* =============================================
               SUCCESS TOAST
            ============================================= */

            showToast(
              "success",
              nextActive
                ? `Đã mở phòng ban "${department.name}".`
                : `Đã khóa phòng ban "${department.name}".`
            );

          } catch (error) {
            console.error(
              "Không thể cập nhật trạng thái phòng ban:",
              error
            );

            const message =
              error?.response?.data?.message ||
              "Không thể cập nhật trạng thái phòng ban.";

            showToast(
              "error",
              message
            );

          } finally {
            setActionLoading(
              false
            );
          }
        },
    });
  }


  /* =======================================================
     CREATE SUCCESS
  ======================================================= */

  async function handleDepartmentCreated(
    createdDepartment
  ) {
    setShowCreateModal(
      false
    );

    setPage(1);

    await loadDepartments(
      1,
      search,
      isActive
    );

    showToast(
      "success",
      createdDepartment?.name
        ? `Đã tạo phòng ban "${createdDepartment.name}" thành công.`
        : "Đã tạo phòng ban thành công."
    );
  }


  /* =======================================================
     UPDATE SUCCESS
  ======================================================= */

  async function handleDepartmentUpdated(
    updatedDepartment
  ) {
    setShowEditModal(
      false
    );

    if (
      updatedDepartment
    ) {
      setDepartments(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              updatedDepartment.id
                ? {
                    ...item,
                    ...updatedDepartment,
                  }
                : item
          )
      );

      setSelectedDepartment(
        (current) =>
          current?.id ===
          updatedDepartment.id
            ? {
                ...current,
                ...updatedDepartment,
              }
            : current
      );

      showToast(
        "success",
        updatedDepartment.name
          ? `Đã cập nhật phòng ban "${updatedDepartment.name}" thành công.`
          : "Đã cập nhật phòng ban thành công."
      );

      return;
    }

    await loadDepartments(
      page,
      search,
      isActive
    );

    showToast(
      "success",
      "Đã cập nhật phòng ban thành công."
    );
  }


  /* =======================================================
     CLOSE CONFIRM
  ======================================================= */

  function closeConfirmModal() {
    if (
      actionLoading
    ) {
      return;
    }

    setConfirmModal(
      null
    );
  }


  /* =======================================================
     CLOSE MODALS
  ======================================================= */

  function closeAllModals() {
    if (
      actionLoading
    ) {
      return;
    }

    setShowCreateModal(
      false
    );

    setShowEditModal(
      false
    );

    setShowMembersModal(
      false
    );

    setShowDetailModal(
      false
    );
  }


  /* =======================================================
     PAGINATION
  ======================================================= */

  function goToPreviousPage() {
    if (
      page <= 1
    ) {
      return;
    }

    setPage(
      (current) =>
        current - 1
    );
  }


  function goToNextPage() {
    if (
      page >=
      totalPages
    ) {
      return;
    }

    setPage(
      (current) =>
        current + 1
    );
  }


  /* =======================================================
     PAGE RANGE
  ======================================================= */

  function getPageNumbers() {
    const pages = [];

    const maxVisible = 5;

    let start =
      Math.max(
        page - 2,
        1
      );

    let end =
      Math.min(
        start +
          maxVisible -
          1,
        totalPages
      );

    if (
      end - start + 1 <
      maxVisible
    ) {
      start =
        Math.max(
          end -
            maxVisible +
            1,
          1
        );
    }

    for (
      let index = start;
      index <= end;
      index += 1
    ) {
      pages.push(
        index
      );
    }

    return pages;
  }


  /* =======================================================
     NO VIEW PERMISSION
  ======================================================= */

  if (!canView) {
    return (
      <div className="admin-departments-page">

        <div className="admin-departments-empty">

          <div className="admin-empty-icon">
            <BuildingIcon />
          </div>

          <strong>
            Không có quyền truy cập
          </strong>

          <span>
            Bạn không có quyền xem danh sách phòng ban.
          </span>

        </div>

      </div>
    );
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="admin-departments-page">

      {/* =================================================
          TOAST
      ================================================= */}

      {toast && (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={closeToast}
        />
      )}


      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="admin-departments-header">

        <div className="admin-departments-heading">

          <div className="admin-departments-title-row">

            <div className="admin-departments-title-icon">
              <BuildingIcon />
            </div>

            <div>

              <h1>
                Departments
              </h1>

              <p>
                Quản lý phòng ban và thành viên
                trong hệ thống
              </p>

            </div>

          </div>

        </div>


        <div className="admin-departments-header-actions">

          <button
            type="button"
            className="admin-refresh-button"
            onClick={
              handleRefresh
            }
            disabled={
              loading
            }
          >

            <RefreshIcon />

            <span>
              {loading
                ? "Đang tải..."
                : "Làm mới"}
            </span>

          </button>


          {/* =============================================
              CREATE
          ============================================= */}

          {canCreate && (
            <button
              type="button"
              className="admin-create-button"
              onClick={
                handleCreate
              }
            >

              <PlusIcon />

              <span>
                Thêm phòng ban
              </span>

            </button>
          )}

        </div>

      </div>


      {/* =================================================
          MAIN CARD
      ================================================= */}

      <section className="admin-departments-card">

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="admin-departments-toolbar">

          <form
            className="admin-departments-search"
            onSubmit={
              handleSearchSubmit
            }
          >

            <SearchIcon />

            <input
              type="search"
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Tìm theo tên hoặc mô tả..."
              aria-label="Tìm kiếm phòng ban"
            />

            {search && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={
                  handleClearSearch
                }
                aria-label="Xóa tìm kiếm"
              >
                ×
              </button>
            )}

          </form>


          <div className="admin-departments-filters">

            <select
              value={
                isActive
              }
              onChange={
                handleStatusChange
              }
              aria-label="Lọc theo trạng thái"
            >

              <option value="">
                Tất cả trạng thái
              </option>

              <option value="true">
                Hoạt động
              </option>

              <option value="false">
                Bị khóa
              </option>

            </select>

          </div>

        </div>


        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="admin-departments-summary">

          <div className="admin-departments-summary-left">

            <span className="admin-departments-summary-label">
              Phòng ban
            </span>

            <span className="admin-departments-summary-count">
              {total}
            </span>

            <span className="admin-departments-summary-text">
              phòng ban
            </span>

          </div>


          <div className="admin-departments-summary-right">

            <span>
              Trang{" "}
              <strong>
                {page}
              </strong>
              {" "} / {totalPages}
            </span>

            <span className="admin-summary-divider">
              |
            </span>

            <span>
              {pageSize} / trang
            </span>

          </div>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="admin-departments-error">

            <span className="admin-error-icon">
              !
            </span>

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={
                handleRefresh
              }
            >
              Thử lại
            </button>

          </div>
        )}


        {/* =================================================
            TABLE
        ================================================= */}

        <div className="admin-departments-table-wrapper">

          {loading ? (

            <div className="admin-departments-loading">

              <div className="admin-loading-spinner" />

              <span>
                Đang tải danh sách phòng ban...
              </span>

            </div>

          ) : departments.length === 0 ? (

            <div className="admin-departments-empty">

              <div className="admin-empty-icon">

                <BuildingIcon />

              </div>

              <strong>
                Không tìm thấy phòng ban
              </strong>

              <span>
                Thử thay đổi từ khóa hoặc bộ lọc.
              </span>

            </div>

          ) : (

            <table className="admin-departments-table">

              <thead>

                <tr>

                  <th>
                    Department
                  </th>

                  <th>
                    Description
                  </th>

                  <th>
                    Members
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Created
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {departments.map(
                  (department) => (

                    <tr
                      key={
                        department.id
                      }
                    >

                      {/* =================================
                          DEPARTMENT
                      ================================= */}

                      <td>

                        <div className="admin-department-main-cell">

                          <div className="admin-department-avatar">

                            <BuildingIcon />

                          </div>


                          <div className="admin-department-info">

                            <strong>
                              {
                                department.name
                              }
                            </strong>

                            <span>
                              #{department.id}
                            </span>

                          </div>

                        </div>

                      </td>


                      {/* =================================
                          DESCRIPTION
                      ================================= */}

                      <td>

                        <span className="admin-department-description">

                          {
                            department.description ||
                            "Chưa có mô tả"
                          }

                        </span>

                      </td>


                      {/* =================================
                          MEMBERS
                      ================================= */}

                      <td>

                        <div className="admin-department-member-count">

                          <span className="admin-department-member-icon">

                            <UsersIcon />

                          </span>

                          <strong>
                            {
                              department.userCount ??
                              0
                            }
                          </strong>

                          <span>
                            thành viên
                          </span>

                        </div>

                      </td>


                      {/* =================================
                          STATUS
                      ================================= */}

                      <td>

                        <span
                          className={`admin-user-status ${
                            department.isActive
                              ? "active"
                              : "inactive"
                          }`}
                        >

                          <span className="admin-status-dot" />

                          {department.isActive
                            ? "Hoạt động"
                            : "Bị khóa"}

                        </span>

                      </td>


                      {/* =================================
                          CREATED
                      ================================= */}

                      <td>

                        <span className="admin-department-created">

                          {department.createdAt
                            ? new Date(
                                department.createdAt
                              ).toLocaleDateString(
                                "vi-VN"
                              )
                            : "—"}

                        </span>

                      </td>


                      {/* =================================
                          ACTIONS
                      ================================= */}

                      <td>

                        <div className="admin-department-actions">

                          {/* VIEW */}

                          {canView && (
                            <button
                              type="button"
                              className="action-view"
                              onClick={() =>
                                handleView(
                                  department
                                )
                              }
                              title="Xem phòng ban"
                            >

                              <EyeIcon />

                              <span>
                                Xem
                              </span>

                            </button>
                          )}


                          {/* MEMBERS */}

                          {canManageMembers && (
                            <button
                              type="button"
                              className="action-members"
                              onClick={() =>
                                handleMembers(
                                  department
                                )
                              }
                              title="Quản lý thành viên"
                            >

                              <UsersIcon />

                              <span>
                                Thành viên
                              </span>

                            </button>
                          )}


                          {/* EDIT */}

                          {canUpdate && (
                            <button
                              type="button"
                              className="action-edit"
                              onClick={() =>
                                handleEdit(
                                  department
                                )
                              }
                              title="Chỉnh sửa phòng ban"
                            >

                              <EditIcon />

                              <span>
                                Sửa
                              </span>

                            </button>
                          )}


                          {/* ACTIVE / INACTIVE */}

                          {(
                            department.isActive
                              ? canDisable
                              : canEnable
                          ) && (
                            <button
                              type="button"
                              className={`action-active ${
                                department.isActive
                                  ? "lock"
                                  : "unlock"
                              }`}
                              onClick={() =>
                                handleToggleActive(
                                  department
                                )
                              }
                              disabled={
                                actionLoading
                              }
                              title={
                                department.isActive
                                  ? "Khóa phòng ban"
                                  : "Mở phòng ban"
                              }
                            >

                              {department.isActive ? (
                                <LockIcon />
                              ) : (
                                <UnlockIcon />
                              )}

                              <span>
                                {department.isActive
                                  ? "Khóa"
                                  : "Mở"}
                              </span>

                            </button>
                          )}

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          )}

        </div>


        {/* =================================================
            PAGINATION
        ================================================= */}

        {!loading &&
          departments.length > 0 && (

            <div className="admin-departments-pagination">

              <div className="admin-pagination-info">

                Hiển thị{" "}

                <strong>
                  {(page - 1) *
                    pageSize +
                    1}
                </strong>

                {" – "}

                <strong>
                  {Math.min(
                    page *
                      pageSize,
                    total
                  )}
                </strong>

                {" "}trong{" "}

                <strong>
                  {total}
                </strong>

                {" "}phòng ban

              </div>


              <div className="admin-pagination-controls">

                <button
                  type="button"
                  className="admin-pagination-arrow"
                  onClick={
                    goToPreviousPage
                  }
                  disabled={
                    page <= 1
                  }
                  aria-label="Trang trước"
                >

                  <ChevronLeftIcon />

                </button>


                {getPageNumbers().map(
                  (
                    pageNumber
                  ) => (

                    <button
                      type="button"
                      key={
                        pageNumber
                      }
                      className={
                        pageNumber ===
                        page
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setPage(
                          pageNumber
                        )
                      }
                    >
                      {
                        pageNumber
                      }
                    </button>

                  )
                )}


                <button
                  type="button"
                  className="admin-pagination-arrow"
                  onClick={
                    goToNextPage
                  }
                  disabled={
                    page >=
                    totalPages
                  }
                  aria-label="Trang sau"
                >

                  <ChevronRightIcon />

                </button>

              </div>

            </div>

          )}

      </section>


      {/* =================================================
          CREATE DEPARTMENT MODAL
      ================================================= */}

      {showCreateModal && (
        <CreateDepartmentModal
          onClose={() =>
            setShowCreateModal(
              false
            )
          }
          onCreated={
            handleDepartmentCreated
          }
        />
      )}


      {/* =================================================
          EDIT DEPARTMENT MODAL
      ================================================= */}

      {showEditModal &&
        selectedDepartment && (

          <EditDepartmentModal
            department={
              selectedDepartment
            }
            onClose={() =>
              setShowEditModal(
                false
              )
            }
            onUpdated={
              handleDepartmentUpdated
            }
          />

        )}


      {/* =================================================
          DEPARTMENT MEMBERS MODAL
      ================================================= */}

      {showMembersModal &&
        selectedDepartment && (

          <DepartmentMembersModal
            department={
              selectedDepartment
            }
            onClose={() =>
              setShowMembersModal(
                false
              )
            }
          />

        )}


      {/* =================================================
          DEPARTMENT DETAIL MODAL
      ================================================= */}

      {showDetailModal &&
        selectedDepartment && (

          <DepartmentDetailModal
            department={
              selectedDepartment
            }
            onClose={() =>
              setShowDetailModal(
                false
              )
            }
          />

        )}


      {/* =================================================
          CONFIRM MODAL
      ================================================= */}

      {confirmModal && (

        <div className="admin-confirm-overlay">

          <div className="admin-confirm-modal">

            <div className="admin-confirm-content">

              <h3>
                {
                  confirmModal.title
                }
              </h3>

              <p>
                {
                  confirmModal.message
                }
              </p>

            </div>


            <div className="admin-confirm-actions">

              <button
                type="button"
                className="admin-confirm-cancel"
                onClick={
                  closeConfirmModal
                }
                disabled={
                  actionLoading
                }
              >
                {
                  confirmModal.cancelText ||
                  "Hủy"
                }
              </button>


              <button
                type="button"
                className={
                  confirmModal.danger
                    ? "admin-confirm-danger"
                    : "admin-confirm-primary"
                }
                onClick={
                  confirmModal.onConfirm
                }
                disabled={
                  actionLoading
                }
              >

                {actionLoading
                  ? "Đang xử lý..."
                  : confirmModal.confirmText}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}