import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getAdminUsers,
  getAdminUser,
  updateUserActive,
  updateUserRole,
  deleteAdminUser,
  restoreAdminUser,
} from "../../../services/admin/adminUserService";

import {
  getAdminDepartments,
} from "../../../services/admin/departmentService";

import UsersHeader from "./components/UsersHeader";
import UsersToolbar from "./components/UsersToolbar";
import UsersSummary from "./components/UsersSummary";
import UsersTable from "./components/UsersTable";
import UsersPagination from "./components/UsersPagination";
import UsersModals from "./components/UsersModals";


export default function AdminUsersPage({
  currentUser,
  socketEvent,
}) {
  /* =======================================================
     DATA
  ======================================================= */

  const [users, setUsers] = useState([]);

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [departments, setDepartments] =
    useState([]);


  /* =======================================================
     LOADING / ERROR
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [departmentLoading, setDepartmentLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState(false);


  /* =======================================================
     TOAST
  ======================================================= */

  const [toast, setToast] =
    useState(null);

  function showToast(
    type,
    message
  ) {
    setToast({
      type,
      message,
    });
  }


  /* =======================================================
     FILTERS
  ======================================================= */

  const [search, setSearch] =
    useState("");

  const [role, setRole] =
    useState("");

  const [departmentId, setDepartmentId] =
    useState("");

  const [isActive, setIsActive] =
    useState("");

  const [isDeleted, setIsDeleted] =
    useState(false);


  /* =======================================================
     PAGINATION
  ======================================================= */

  const [page, setPage] =
    useState(1);

  const [pageSize] =
    useState(20);

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

  const [
    showResetPasswordModal,
    setShowResetPasswordModal,
  ] = useState(false);

  const [
    showAssignDepartmentModal,
    setShowAssignDepartmentModal,
  ] = useState(false);

  const [confirmModal, setConfirmModal] =
    useState(null);


  /* =======================================================
     LOAD DEPARTMENTS
  ======================================================= */

  async function loadDepartments() {
    try {
      setDepartmentLoading(true);

      const data =
        await getAdminDepartments();

      const items =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : [];

      setDepartments(items);
    } catch (error) {
      console.error(
        "Không thể tải phòng ban:",
        error
      );

      setDepartments([]);

      showToast(
        "error",
        error?.response?.data?.message ||
          "Không thể tải danh sách phòng ban."
      );
    } finally {
      setDepartmentLoading(false);
    }
  }


  /* =======================================================
     LOAD USERS
  ======================================================= */

  async function loadUsers(
    customPage = page,
    customSearch = search
  ) {
    try {
      setLoading(true);
      setError("");

      const data =
        await getAdminUsers({
          search:
            customSearch.trim(),
          departmentId,
          role,
          isActive,
          isDeleted,
          page: customPage,
          pageSize,
        });

      setUsers(
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
        "Không thể tải danh sách nhân viên:",
        error
      );

      const message =
        error?.response?.data?.message ||
        "Không thể tải danh sách nhân viên.";

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
    loadDepartments();
  }, []);

  useEffect(() => {
    loadUsers(
      page,
      search
    );
  }, [
    page,
    role,
    departmentId,
    isActive,
    isDeleted,
  ]);


  /* =======================================================
     REALTIME USER ONLINE / OFFLINE
  ======================================================= */

  const handleUserStatus =
    useCallback(
      (event) => {
        if (
          !event ||
          event.type !== "user_status"
        ) {
          return;
        }

        const userId =
          Number(event.userId);

        if (!userId) {
          return;
        }

        const isOnline =
          Boolean(event.isOnline);

        const lastSeen =
          event.lastSeen ?? null;


        /* ================================================
           UPDATE USER LIST
        ================================================ */

        setUsers(
          (currentUsers) =>
            currentUsers.map(
              (user) => {
                if (
                  Number(user.id) !==
                  userId
                ) {
                  return user;
                }

                return {
                  ...user,

                  isOnline,

                  lastSeen:
                    isOnline
                      ? user.lastSeen
                      : lastSeen ??
                        user.lastSeen,
                };
              }
            )
        );


        /* ================================================
           UPDATE SELECTED USER
        ================================================ */

        setSelectedUser(
          (currentUser) => {
            if (
              !currentUser ||
              Number(
                currentUser.id
              ) !== userId
            ) {
              return currentUser;
            }

            return {
              ...currentUser,

              isOnline,

              lastSeen:
                isOnline
                  ? currentUser.lastSeen
                  : lastSeen ??
                    currentUser.lastSeen,
            };
          }
        );
      },
      []
    );

  useEffect(() => {
    handleUserStatus(
      socketEvent
    );
  }, [
    socketEvent,
    handleUserStatus,
  ]);


  /* =======================================================
     SEARCH
  ======================================================= */

  function handleSearchSubmit(
    event
  ) {
    event.preventDefault();

    setPage(1);

    loadUsers(
      1,
      search
    );
  }

  function handleSearchChange(
    event
  ) {
    setSearch(
      event.target.value
    );
  }

  function handleClearSearch() {
    setSearch("");

    setPage(1);

    loadUsers(
      1,
      ""
    );
  }


  /* =======================================================
     FILTER
  ======================================================= */

  function handleRoleChange(
    event
  ) {
    setRole(
      event.target.value
    );

    setPage(1);
  }

  function handleDepartmentChange(
    event
  ) {
    setDepartmentId(
      event.target.value
    );

    setPage(1);
  }

  function handleStatusChange(
    event
  ) {
    setIsActive(
      event.target.value
    );

    setPage(1);
  }

  function handleDeletedChange(
    event
  ) {
    const value =
      event.target.value;

    const deleted =
      value === "true";

    setIsDeleted(deleted);

    setIsActive("");

    setPage(1);
  }


  /* =======================================================
     REFRESH
  ======================================================= */

  function handleRefresh() {
    loadUsers(
      page,
      search
    );
  }


  /* =======================================================
     VIEW USER
  ======================================================= */

  async function handleViewUser(
    id
  ) {
    try {
      setDetailLoading(true);

      const user =
        await getAdminUser(id);

      setSelectedUser(user);
    } catch (error) {
      console.error(
        "Không thể tải thông tin nhân viên:",
        error
      );

      showToast(
        "error",
        error?.response?.data?.message ||
          "Không thể tải thông tin nhân viên."
      );
    } finally {
      setDetailLoading(false);
    }
  }


  /* =======================================================
     EDIT USER
  ======================================================= */

  async function handleEditUser(
    id
  ) {
    try {
      setDetailLoading(true);

      const user =
        await getAdminUser(id);

      setSelectedUser(user);

      setShowEditModal(true);
    } catch (error) {
      console.error(
        "Không thể tải nhân viên:",
        error
      );

      showToast(
        "error",
        error?.response?.data?.message ||
          "Không thể tải thông tin nhân viên."
      );
    } finally {
      setDetailLoading(false);
    }
  }


  /* =======================================================
     RESET PASSWORD
  ======================================================= */

  async function handleResetPassword(
    user
  ) {
    try {
      setDetailLoading(true);

      const detail =
        await getAdminUser(
          user.id
        );

      setSelectedUser(detail);

      setShowResetPasswordModal(
        true
      );
    } catch (error) {
      console.error(
        "Không thể tải nhân viên:",
        error
      );

      showToast(
        "error",
        error?.response?.data?.message ||
          "Không thể tải thông tin nhân viên."
      );
    } finally {
      setDetailLoading(false);
    }
  }


  /* =======================================================
     ASSIGN DEPARTMENT
  ======================================================= */

  async function handleAssignDepartment(
    user
  ) {
    try {
      setDetailLoading(true);

      const detail =
        await getAdminUser(
          user.id
        );

      setSelectedUser(detail);

      setShowAssignDepartmentModal(
        true
      );
    } catch (error) {
      console.error(
        "Không thể tải nhân viên:",
        error
      );

      showToast(
        "error",
        error?.response?.data?.message ||
          "Không thể tải thông tin nhân viên."
      );
    } finally {
      setDetailLoading(false);
    }
  }


  /* =======================================================
     TOGGLE ACTIVE
  ======================================================= */

  function handleToggleActive(
    user
  ) {
    const currentUserId =
      Number(currentUser?.id);

    if (
      currentUserId &&
      currentUserId ===
        Number(user.id)
    ) {
      showToast(
        "error",
        "Bạn không thể tự khóa tài khoản của mình."
      );

      return;
    }

    const nextActive =
      !user.isActive;

    const actionText =
      nextActive
        ? "mở khóa"
        : "khóa";

    setConfirmModal({
      title:
        nextActive
          ? "Xác nhận mở khóa tài khoản"
          : "Xác nhận khóa tài khoản",

      message:
        `Bạn có chắc muốn ${actionText} tài khoản ` +
        `"${user.fullName || user.username}"?`,

      confirmText:
        nextActive
          ? "Mở khóa"
          : "Khóa tài khoản",

      cancelText: "Hủy",

      danger:
        !nextActive,

      onConfirm:
        async () => {
          try {
            setActionLoading(
              true
            );

            await updateUserActive(
              user.id,
              nextActive
            );

            setUsers(
              (current) =>
                current.map(
                  (item) =>
                    item.id ===
                    user.id
                      ? {
                          ...item,
                          isActive:
                            nextActive,
                        }
                      : item
                )
            );

            setSelectedUser(
              (current) =>
                current?.id ===
                user.id
                  ? {
                      ...current,
                      isActive:
                        nextActive,
                    }
                  : current
            );

            setConfirmModal(
              null
            );

            showToast(
              "success",
              nextActive
                ? "Đã mở khóa nhân viên."
                : "Đã khóa nhân viên."
            );
          } catch (error) {
            console.error(
              "Không thể cập nhật trạng thái:",
              error
            );

            showToast(
              "error",
              error?.response
                ?.data
                ?.message ||
                "Không thể cập nhật trạng thái."
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
     CHANGE ROLE
  ======================================================= */

  function handleChangeRole(
    user,
    newRole
  ) {
    const currentUserId =
      Number(currentUser?.id);

    if (
      currentUserId &&
      currentUserId ===
        Number(user.id)
    ) {
      showToast(
        "error",
        "Bạn không thể tự thay đổi role của mình."
      );

      return;
    }

    if (
      newRole ===
      user.role
    ) {
      return;
    }

    setConfirmModal({
      title:
        "Xác nhận thay đổi role",

      message:
        `Bạn có chắc muốn đổi role của ` +
        `"${user.fullName || user.username}" ` +
        `từ "${user.role}" thành "${newRole}"?`,

      confirmText:
        "Đổi role",

      cancelText:
        "Hủy",

      danger:
        false,

      onConfirm:
        async () => {
          try {
            setActionLoading(
              true
            );

            await updateUserRole(
              user.id,
              newRole
            );

            setUsers(
              (current) =>
                current.map(
                  (item) =>
                    item.id ===
                    user.id
                      ? {
                          ...item,
                          role:
                            newRole,
                        }
                      : item
                )
            );

            setSelectedUser(
              (current) =>
                current?.id ===
                user.id
                  ? {
                      ...current,
                      role:
                        newRole,
                    }
                  : current
            );

            setConfirmModal(
              null
            );

            showToast(
              "success",
              `Đã đổi role của "${user.fullName || user.username}" thành ${newRole}.`
            );
          } catch (error) {
            console.error(
              "Không thể cập nhật role:",
              error
            );

            showToast(
              "error",
              error?.response
                ?.data
                ?.message ||
                "Không thể cập nhật role."
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
     DELETE USER
  ======================================================= */

  function handleDeleteUser(
    user
  ) {
    const currentUserId =
      Number(currentUser?.id);

    if (
      currentUserId &&
      currentUserId ===
        Number(user.id)
    ) {
      showToast(
        "error",
        "Bạn không thể xóa tài khoản của mình."
      );

      return;
    }

    setConfirmModal({
      title:
        "Xác nhận xóa nhân viên",

      message:
        `Bạn có chắc muốn xóa nhân viên ` +
        `"${user.fullName || user.username}"? ` +
        `Tài khoản sẽ được đánh dấu là đã xóa và ` +
        `không còn xuất hiện trong danh sách nhân viên.`,

      confirmText:
        "Xóa nhân viên",

      cancelText:
        "Hủy",

      danger:
        true,

      onConfirm:
        async () => {
          try {
            setActionLoading(
              true
            );

            await deleteAdminUser(
              user.id
            );

            setUsers(
              (current) =>
                current.filter(
                  (item) =>
                    item.id !==
                    user.id
                )
            );

            setSelectedUser(
              (current) =>
                current?.id ===
                user.id
                  ? null
                  : current
            );

            setTotal(
              (current) =>
                Math.max(
                  current - 1,
                  0
                )
            );

            setConfirmModal(
              null
            );

            showToast(
              "success",
              `Đã xóa nhân viên "${user.fullName || user.username}".`
            );
          } catch (error) {
            console.error(
              "Không thể xóa nhân viên:",
              error
            );

            showToast(
              "error",
              error?.response
                ?.data
                ?.message ||
                "Không thể xóa nhân viên."
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
     RESTORE USER
  ======================================================= */

  function handleRestoreUser(
    user
  ) {
    setConfirmModal({
      title:
        "Xác nhận khôi phục nhân viên",

      message:
        `Bạn có chắc muốn khôi phục nhân viên ` +
        `"${user.fullName || user.username}"? ` +
        `Tài khoản sẽ được đưa trở lại danh sách nhân viên ` +
        `và được mở khóa.`,

      confirmText:
        "Khôi phục",

      cancelText:
        "Hủy",

      danger:
        false,

      onConfirm:
        async () => {
          try {
            setActionLoading(
              true
            );

            await restoreAdminUser(
              user.id
            );

            setUsers(
              (current) =>
                current.filter(
                  (item) =>
                    item.id !==
                    user.id
                )
            );

            setTotal(
              (current) =>
                Math.max(
                  current - 1,
                  0
                )
            );

            setSelectedUser(
              (current) =>
                current?.id ===
                user.id
                  ? null
                  : current
            );

            setConfirmModal(
              null
            );

            showToast(
              "success",
              `Đã khôi phục nhân viên "${user.fullName || user.username}".`
            );
          } catch (error) {
            console.error(
              "Không thể khôi phục nhân viên:",
              error
            );

            showToast(
              "error",
              error?.response
                ?.data
                ?.message ||
                "Không thể khôi phục nhân viên."
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

  async function handleEmployeeCreated() {
    setShowCreateModal(
      false
    );

    setPage(1);

    await loadUsers(
      1,
      search
    );

    showToast(
      "success",
      "Đã tạo nhân viên thành công."
    );
  }


  /* =======================================================
     UPDATE SUCCESS
  ======================================================= */

  async function handleEmployeeUpdated() {
    setShowEditModal(
      false
    );

    if (!selectedUser) {
      return;
    }

    try {
      const refreshedUser =
        await getAdminUser(
          selectedUser.id
        );

      setSelectedUser(
        refreshedUser
      );

      setUsers(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              refreshedUser.id
                ? refreshedUser
                : item
          )
      );

      showToast(
        "success",
        "Đã cập nhật thông tin nhân viên."
      );
    } catch (error) {
      console.error(
        "Không thể refresh nhân viên:",
        error
      );

      showToast(
        "error",
        error?.response?.data?.message ||
          "Cập nhật thành công nhưng không thể làm mới dữ liệu."
      );
    }
  }


  /* =======================================================
     PASSWORD RESET SUCCESS
  ======================================================= */

  function handlePasswordReset() {
    setShowResetPasswordModal(
      false
    );

    showToast(
      "success",
      "Đã reset mật khẩu thành công."
    );
  }


  /* =======================================================
     DEPARTMENT ASSIGNED
  ======================================================= */

  function handleDepartmentAssigned({
    departmentId:
      nextDepartmentId,
    departmentName,
  }) {
    setShowAssignDepartmentModal(
      false
    );

    setUsers(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            selectedUser?.id
              ? {
                  ...item,

                  departmentId:
                    nextDepartmentId,

                  departmentName:
                    departmentName ||
                    null,
                }
              : item
        )
    );

    setSelectedUser(
      (current) =>
        current
          ? {
              ...current,

              departmentId:
                nextDepartmentId,

              departmentName:
                departmentName ||
                null,
            }
          : current
    );

    showToast(
      "success",
      departmentName
        ? `Đã phân phòng ban chính: ${departmentName}.`
        : "Đã bỏ phòng ban chính."
    );
  }


  /* =======================================================
     CONFIRM MODAL
  ======================================================= */

  function closeConfirmModal() {
    if (actionLoading) {
      return;
    }

    setConfirmModal(
      null
    );
  }


  /* =======================================================
     PAGINATION
  ======================================================= */

  function goToPreviousPage() {
    if (page <= 1) {
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
      pages.push(index);
    }

    return pages;
  }


  const pageNumbers =
    getPageNumbers();


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="admin-users-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <UsersHeader
        loading={loading}
        isDeleted={isDeleted}
        onRefresh={handleRefresh}
        onCreate={() =>
          setShowCreateModal(true)
        }
      />


      {/* =================================================
          MAIN CARD
      ================================================= */}

      <section className="admin-users-card">

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <UsersToolbar
          search={search}
          onSearchChange={
            handleSearchChange
          }
          onSearchSubmit={
            handleSearchSubmit
          }
          onClearSearch={
            handleClearSearch
          }
          departmentId={
            departmentId
          }
          onDepartmentChange={
            handleDepartmentChange
          }
          departments={
            departments
          }
          role={role}
          onRoleChange={
            handleRoleChange
          }
          isActive={
            isActive
          }
          onStatusChange={
            handleStatusChange
          }
          isDeleted={
            isDeleted
          }
          onDeletedChange={
            handleDeletedChange
          }
        />


        {/* =================================================
            SUMMARY
        ================================================= */}

        <UsersSummary
          total={total}
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          isDeleted={isDeleted}
        />


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="admin-users-error">
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

        <UsersTable
          users={users}
          loading={loading}
          isDeleted={isDeleted}
          currentUser={currentUser}
          actionLoading={
            actionLoading
          }
          onViewUser={
            handleViewUser
          }
          onEditUser={
            handleEditUser
          }
          onAssignDepartment={
            handleAssignDepartment
          }
          onResetPassword={
            handleResetPassword
          }
          onToggleActive={
            handleToggleActive
          }
          onDeleteUser={
            handleDeleteUser
          }
          onRestoreUser={
            handleRestoreUser
          }
          onChangeRole={
            handleChangeRole
          }
        />


        {/* =================================================
            PAGINATION
        ================================================= */}

        <UsersPagination
          loading={loading}
          users={users}
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={
            totalPages
          }
          isDeleted={
            isDeleted
          }
          pageNumbers={
            pageNumbers
          }
          onPrevious={
            goToPreviousPage
          }
          onNext={
            goToNextPage
          }
          onPageChange={
            setPage
          }
        />

      </section>


      {/* =================================================
          MODALS
      ================================================= */}

      <UsersModals
        showCreateModal={
          showCreateModal
        }
        departments={
          departments
        }
        departmentLoading={
          departmentLoading
        }
        onCloseCreate={() =>
          setShowCreateModal(
            false
          )
        }
        onEmployeeCreated={
          handleEmployeeCreated
        }

        showEditModal={
          showEditModal
        }
        selectedUser={
          selectedUser
        }
        onCloseEdit={() =>
          setShowEditModal(
            false
          )
        }
        onEmployeeUpdated={
          handleEmployeeUpdated
        }

        showResetPasswordModal={
          showResetPasswordModal
        }
        onCloseResetPassword={() =>
          setShowResetPasswordModal(
            false
          )
        }
        onPasswordReset={
          handlePasswordReset
        }

        showAssignDepartmentModal={
          showAssignDepartmentModal
        }
        onCloseAssignDepartment={() =>
          setShowAssignDepartmentModal(
            false
          )
        }
        onDepartmentAssigned={
          handleDepartmentAssigned
        }

        detailLoading={
          detailLoading
        }
        onCloseDetail={() =>
          setSelectedUser(null)
        }

        confirmModal={
          confirmModal
        }
        actionLoading={
          actionLoading
        }
        onConfirm={
          confirmModal?.onConfirm
        }
        onCloseConfirm={
          closeConfirmModal
        }

        toast={toast}
        onCloseToast={() =>
          setToast(null)
        }
      />

    </div>
  );
}