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

import { getAdminDepartments } from "../../../services/admin/departmentService";

import CreateEmployeeModal from "./CreateEmployeeModal";
import EditEmployeeModal from "./EditEmployeeModal";
import EmployeeDetailModal from "./EmployeeDetailModal";
import ResetPasswordModal from "./ResetPasswordModal";
import AssignDepartmentModal from "./AssignDepartmentModal";
import ConfirmModal from "../../../components/modal/ConfirmModal";
import Toast from "../../../components/common/Toast";


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
      <circle cx="11" cy="11" r="7" />
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
      <circle cx="12" cy="12" r="2.5" />
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

function BuildingIcon() {
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
      <rect x="4" y="10" width="16" height="10" rx="2" />
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
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 7.5-2" />
    </svg>
  );
}

function KeyIcon() {
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
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8-8" />
      <path d="m17 6 2 2" />
      <path d="m15 8 2 2" />
    </svg>
  );
}

function TrashIcon() {
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
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

function RestoreIcon() {
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
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v6h6" />
    </svg>
  );
}


/* =========================================================
   HELPERS
========================================================= */

function getInitial(user) {
  return (
    user?.fullName?.trim()?.charAt(0) ||
    user?.username?.trim()?.charAt(0) ||
    "U"
  ).toUpperCase();
}

function formatLastSeen(value) {
  if (!value) {
    return "Chưa hoạt động";
  }

  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


/* =========================================================
   PAGE
========================================================= */

export default function AdminUsersPage({
  currentUser,
  socketEvent,
}) {
  /* =======================================================
     DATA
  ======================================================= */

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [departments, setDepartments] = useState([]);


  /* =======================================================
     LOADING / ERROR
  ======================================================= */

  const [loading, setLoading] = useState(true);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [departmentLoading, setDepartmentLoading] =
    useState(false);

  const [error, setError] = useState("");

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

  const [search, setSearch] = useState("");

  const [role, setRole] = useState("");

  const [departmentId, setDepartmentId] =
    useState("");

  const [isActive, setIsActive] = useState("");

  const [isDeleted, setIsDeleted] =
    useState(false);


  /* =======================================================
     PAGINATION
  ======================================================= */

  const [page, setPage] = useState(1);

  const [pageSize] = useState(20);

  const [total, setTotal] = useState(0);

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
          search: customSearch.trim(),
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


        /* =================================================
           UPDATE USER LIST
        ================================================= */

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


        /* =================================================
           UPDATE SELECTED USER / DETAIL MODAL
        ================================================= */

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

    // Khi xem danh sách đã xóa,
    // reset filter Active / Inactive.
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
                          role: newRole,
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
                      role: newRole,
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

    // Không cho admin tự xóa tài khoản của chính mình
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

            // Xóa khỏi danh sách hiện tại
            setUsers(
              (current) =>
                current.filter(
                  (item) =>
                    item.id !==
                    user.id
                )
            );

            // Nếu đang xem detail
            // của user này thì đóng detail
            setSelectedUser(
              (current) =>
                current?.id ===
                user.id
                  ? null
                  : current
            );

            // Cập nhật tổng số nhân viên
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

            // Xóa khỏi danh sách đã xóa
            setUsers(
              (current) =>
                current.filter(
                  (item) =>
                    item.id !==
                    user.id
                )
            );

            // Cập nhật tổng số
            setTotal(
              (current) =>
                Math.max(
                  current - 1,
                  0
                )
            );

            // Đóng detail nếu đang mở
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
     CLOSE ALL MODALS
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

    setShowResetPasswordModal(
      false
    );

    setShowAssignDepartmentModal(
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
     RENDER
  ======================================================= */

  return (
    <div className="admin-users-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="admin-users-header">

        <div className="admin-users-heading">

          <div className="admin-users-title-row">

            <div className="admin-users-title-icon">

              <svg
                viewBox="0 0 24 24"
                width="19"
                height="19"
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

            </div>

            <div>

              <h1>
                Employees
              </h1>

              <p>
                Quản lý tài khoản và nhân sự
                trong hệ thống
              </p>

            </div>

          </div>

        </div>


        <div className="admin-users-header-actions">

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


          {/* Không cho tạo user khi đang xem
              danh sách đã xóa */}

          {!isDeleted && (
            <button
              type="button"
              className="admin-create-button"
              onClick={() =>
                setShowCreateModal(
                  true
                )
              }
            >
              <PlusIcon />

              <span>
                Thêm nhân viên
              </span>

            </button>
          )}

        </div>

      </div>


      {/* =================================================
          MAIN CARD
      ================================================= */}

      <section className="admin-users-card">

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="admin-users-toolbar">

          <form
            className="admin-users-search"
            onSubmit={
              handleSearchSubmit
            }
          >

            <SearchIcon />

            <input
              type="search"
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Tìm theo tên, username hoặc email..."
              aria-label="Tìm kiếm nhân viên"
            />

            {search && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => {
                  setSearch(
                    ""
                  );

                  setPage(
                    1
                  );

                  loadUsers(
                    1,
                    ""
                  );
                }}
                aria-label="Xóa tìm kiếm"
              >
                ×
              </button>
            )}

          </form>


          <div className="admin-users-filters">

            {/* ===========================================
                DEPARTMENT
            =========================================== */}

            <select
              value={
                departmentId
              }
              onChange={
                handleDepartmentChange
              }
              aria-label="Lọc theo phòng ban"
            >
              <option value="">
                Tất cả phòng ban
              </option>

              {departments.map(
                (
                  department
                ) => (
                  <option
                    key={
                      department.id
                    }
                    value={
                      department.id
                    }
                  >
                    {
                      department.name
                    }
                  </option>
                )
              )}

            </select>


            {/* ===========================================
                ROLE
            =========================================== */}

            <select
              value={
                role
              }
              onChange={
                handleRoleChange
              }
              aria-label="Lọc theo role"
            >
              <option value="">
                Tất cả role
              </option>

              <option value="Admin">
                Admin
              </option>

              <option value="Employee">
                Employee
              </option>
            </select>


            {/* ===========================================
                ACTIVE STATUS
            =========================================== */}

            <select
              value={
                isActive
              }
              onChange={
                handleStatusChange
              }
              aria-label="Lọc theo trạng thái"
              disabled={
                isDeleted
              }
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


            {/* ===========================================
                DELETED STATUS
            =========================================== */}

            <select
              value={
                isDeleted
                  ? "true"
                  : "false"
              }
              onChange={
                handleDeletedChange
              }
              aria-label="Lọc theo trạng thái xóa"
            >
              <option value="false">
                Nhân viên hiện tại
              </option>

              <option value="true">
                Đã xóa
              </option>
            </select>

          </div>

        </div>


        {/* =================================================
            TABLE SUMMARY
        ================================================= */}

        <div className="admin-users-summary">

          <div className="admin-users-summary-left">

            <span className="admin-users-summary-label">
              {isDeleted
                ? "Nhân viên đã xóa"
                : "Nhân viên"}
            </span>

            <span className="admin-users-summary-count">
              {total}
            </span>

            <span className="admin-users-summary-text">
              tài khoản
            </span>

          </div>


          <div className="admin-users-summary-right">

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

        <div className="admin-users-table-wrapper">

          {loading ? (

            <div className="admin-users-loading">

              <div className="admin-loading-spinner" />

              <span>
                Đang tải danh sách nhân viên...
              </span>

            </div>

          ) : users.length === 0 ? (

            <div className="admin-users-empty">

              <div className="admin-empty-icon">

                <svg
                  viewBox="0 0 24 24"
                  width="28"
                  height="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle
                    cx="9"
                    cy="8"
                    r="4"
                  />

                  <path d="M3 21a6 6 0 0 1 12 0" />

                  <path d="M16 11h5" />

                  <path d="M18.5 8.5v5" />
                </svg>

              </div>

              <strong>
                {isDeleted
                  ? "Không có nhân viên đã xóa"
                  : "Không tìm thấy nhân viên"}
              </strong>

              <span>
                {isDeleted
                  ? "Hiện không có tài khoản nào đã bị xóa."
                  : "Thử thay đổi từ khóa hoặc bộ lọc."}
              </span>

            </div>

          ) : (

            <table className="admin-users-table">

              <thead>

                <tr>
                  <th>
                    Employee
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Department
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Online
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>

              </thead>


              <tbody>

                {users.map(
                  (user) => {

                    const isCurrentUser =
                      Number(
                        currentUser?.id
                      ) ===
                      Number(
                        user.id
                      );

                    return (
                      <tr
                        key={
                          user.id
                        }
                        className={
                          isCurrentUser
                            ? "is-current-user"
                            : ""
                        }
                      >

                        {/* =================================
                            EMPLOYEE
                        ================================= */}

                        <td>

                          <div className="admin-user-cell">

                            <div className="admin-user-avatar">

                              {getInitial(
                                user
                              )}

                              {user.isOnline && (
                                <span className="admin-avatar-online-dot" />
                              )}

                            </div>


                            <div className="admin-user-info">

                              <div className="admin-user-name-row">

                                <strong>
                                  {user.fullName ||
                                    user.username}
                                </strong>

                                {isCurrentUser && (
                                  <span className="admin-current-badge">
                                    Bạn
                                  </span>
                                )}

                              </div>

                              <span>
                                @{user.username}
                              </span>

                            </div>

                          </div>

                        </td>


                        {/* =================================
                            EMAIL
                        ================================= */}

                        <td>

                          <span className="admin-user-email">
                            {
                              user.email
                            }
                          </span>

                        </td>


                        {/* =================================
                            DEPARTMENT
                        ================================= */}

                        <td>

                          <div className="admin-department-cell">

                            <span className="admin-department-icon">
                              <BuildingIcon />
                            </span>

                            <span>
                              {
                                user.departmentName ||
                                "Chưa phân phòng ban"
                              }
                            </span>

                          </div>

                        </td>


                        {/* =================================
                            ROLE
                        ================================= */}

                        <td>

                          <div
                            className={`admin-role-control ${
                              user.role ===
                              "Admin"
                                ? "role-admin"
                                : "role-employee"
                            }`}
                          >

                            <span className="admin-role-dot" />

                            <select
                              value={
                                user.role
                              }
                              onChange={(
                                event
                              ) =>
                                handleChangeRole(
                                  user,
                                  event
                                    .target
                                    .value
                                )
                              }
                              disabled={
                                actionLoading ||
                                isCurrentUser ||
                                isDeleted
                              }
                              aria-label={`Role của ${user.fullName}`}
                            >

                              <option value="Employee">
                                Employee
                              </option>

                              <option value="Admin">
                                Admin
                              </option>

                            </select>

                          </div>

                        </td>


                        {/* =================================
                            STATUS
                        ================================= */}

                        <td>

                          <span
                            className={`admin-user-status ${
                              user.isActive
                                ? "active"
                                : "inactive"
                            }`}
                          >

                            <span className="admin-status-dot" />

                            {user.isActive
                              ? "Hoạt động"
                              : "Bị khóa"}

                          </span>

                        </td>


                        {/* =================================
                            ONLINE
                        ================================= */}

                        <td>

                          <div
                            className={`admin-user-online ${
                              user.isOnline
                                ? "online"
                                : "offline"
                            }`}
                          >

                            <span className="admin-online-dot" />

                            <span>
                              {user.isOnline
                                ? "Online"
                                : "Offline"}
                            </span>

                          </div>

                        </td>


                        {/* =================================
                            ACTIONS
                        ================================= */}

                        <td>

                          <div className="admin-user-actions">

                            {/* =============================
                                VIEW
                            ============================= */}

                            <button
                              type="button"
                              className="action-view"
                              onClick={() =>
                                handleViewUser(
                                  user.id
                                )
                              }
                              title="Xem thông tin"
                            >
                              <EyeIcon />

                              <span>
                                Xem
                              </span>
                            </button>


                            {/* =============================
                                NORMAL USER
                            ============================= */}

                            {!isDeleted ? (
                              <>

                                {/* EDIT */}

                                <button
                                  type="button"
                                  className="action-edit"
                                  onClick={() =>
                                    handleEditUser(
                                      user.id
                                    )
                                  }
                                  title="Chỉnh sửa"
                                >
                                  <EditIcon />

                                  <span>
                                    Sửa
                                  </span>
                                </button>


                                {/* DEPARTMENT */}

                                <button
                                  type="button"
                                  className="action-department"
                                  onClick={() =>
                                    handleAssignDepartment(
                                      user
                                    )
                                  }
                                  title="Phân phòng ban"
                                >
                                  <BuildingIcon />

                                  <span>
                                    Phòng ban
                                  </span>
                                </button>


                                {/* RESET PASSWORD */}

                                <button
                                  type="button"
                                  className="action-password"
                                  onClick={() =>
                                    handleResetPassword(
                                      user
                                    )
                                  }
                                  title="Reset mật khẩu"
                                >
                                  <KeyIcon />

                                  <span>
                                    Reset PW
                                  </span>
                                </button>


                                {/* ACTIVE / INACTIVE */}

                                <button
                                  type="button"
                                  className={`action-active ${
                                    user.isActive
                                      ? "lock"
                                      : "unlock"
                                  }`}
                                  onClick={() =>
                                    handleToggleActive(
                                      user
                                    )
                                  }
                                  disabled={
                                    actionLoading ||
                                    isCurrentUser
                                  }
                                  title={
                                    user.isActive
                                      ? "Khóa tài khoản"
                                      : "Mở khóa tài khoản"
                                  }
                                >
                                  {user.isActive ? (
                                    <LockIcon />
                                  ) : (
                                    <UnlockIcon />
                                  )}

                                  <span>
                                    {user.isActive
                                      ? "Khóa"
                                      : "Mở"}
                                  </span>
                                </button>


                                {/* DELETE */}

                                <button
                                  type="button"
                                  className="action-delete"
                                  onClick={() =>
                                    handleDeleteUser(
                                      user
                                    )
                                  }
                                  disabled={
                                    actionLoading ||
                                    isCurrentUser
                                  }
                                  title="Xóa tài khoản"
                                >
                                  <TrashIcon />

                                  <span>
                                    Xóa
                                  </span>
                                </button>

                              </>
                            ) : (

                              /* =========================
                                 DELETED USER
                              ========================= */

                              <button
                                type="button"
                                className="action-active unlock"
                                onClick={() =>
                                  handleRestoreUser(
                                    user
                                  )
                                }
                                disabled={
                                  actionLoading
                                }
                                title="Khôi phục nhân viên"
                              >
                                <RestoreIcon />

                                <span>
                                  Khôi phục
                                </span>
                              </button>

                            )}

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          )}

        </div>


        {/* =================================================
            PAGINATION
        ================================================= */}

        {!loading &&
          users.length > 0 && (
            <div className="admin-users-pagination">

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

                {" "}

                {isDeleted
                  ? "nhân viên đã xóa"
                  : "nhân viên"}

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
          CREATE MODAL
      ================================================= */}

      {showCreateModal && (
        <CreateEmployeeModal
          departments={
            departments
          }
          departmentLoading={
            departmentLoading
          }
          onClose={() =>
            setShowCreateModal(
              false
            )
          }
          onCreated={
            handleEmployeeCreated
          }
        />
      )}


      {/* =================================================
          EDIT MODAL
      ================================================= */}

      {showEditModal &&
        selectedUser && (
          <EditEmployeeModal
            user={
              selectedUser
            }
            onClose={() =>
              setShowEditModal(
                false
              )
            }
            onUpdated={
              handleEmployeeUpdated
            }
          />
        )}


      {/* =================================================
          RESET PASSWORD MODAL
      ================================================= */}

      {showResetPasswordModal &&
        selectedUser && (
          <ResetPasswordModal
            user={
              selectedUser
            }
            onClose={() =>
              setShowResetPasswordModal(
                false
              )
            }
            onReset={
              handlePasswordReset
            }
          />
        )}


      {/* =================================================
          ASSIGN DEPARTMENT MODAL
      ================================================= */}

      {showAssignDepartmentModal &&
        selectedUser && (
          <AssignDepartmentModal
            user={
              selectedUser
            }
            departments={
              departments
            }
            departmentLoading={
              departmentLoading
            }
            onClose={() =>
              setShowAssignDepartmentModal(
                false
              )
            }
            onAssigned={
              handleDepartmentAssigned
            }
          />
        )}


      {/* =================================================
          DETAIL MODAL
      ================================================= */}

      {selectedUser &&
        !showEditModal &&
        !showResetPasswordModal &&
        !showAssignDepartmentModal && (
          <EmployeeDetailModal
            user={
              selectedUser
            }
            loading={
              detailLoading
            }
            onClose={() =>
              setSelectedUser(
                null
              )
            }
          />
        )}


      {/* =================================================
          CONFIRM MODAL
      ================================================= */}

      {confirmModal && (
        <ConfirmModal
          title={
            confirmModal.title
          }
          message={
            confirmModal.message
          }
          confirmText={
            confirmModal.confirmText
          }
          cancelText={
            confirmModal.cancelText
          }
          danger={
            confirmModal.danger
          }
          loading={
            actionLoading
          }
          onConfirm={
            confirmModal.onConfirm
          }
          onClose={
            closeConfirmModal
          }
        />
      )}


      {/* =================================================
          TOAST
      ================================================= */}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() =>
            setToast(null)
          }
        />
      )}

    </div>
  );
}