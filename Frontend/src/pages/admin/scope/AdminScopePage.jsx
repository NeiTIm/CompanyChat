import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getScopeUsers,
  getUserScope,
  getScopeDepartments,
  replaceUserScopes,
  getScopeStatistics,
} from "../../../services/admin/scopeService";

import { hasPermission } from "../../../utils/permissionUtils";

import ScopeHeader from "./components/ScopeHeader";
import ScopePagination from "./components/ScopePagination";
import ScopeSummary from "./components/ScopeSummary";
import ScopeTable from "./components/ScopeTable";
import ScopeToolbar from "./components/ScopeToolbar";
import Toast from "../../../components/common/Toast";
import AssignDepartmentModal from "./AssignDepartmentModal";
import ScopeUserModal from "./ScopeUserModal";

/* =========================================================
   HELPERS
========================================================= */

const getUserId = (user) =>
  user?.id ??
  user?.Id ??
  user?.userId ??
  user?.UserId;

const getUserName = (user) =>
  user?.fullName ??
  user?.FullName ??
  user?.username ??
  user?.Username ??
  "Unknown user";

const getUserRole = (user) =>
  user?.role ??
  user?.Role ??
  "—";

const getDepartmentId = (
  department,
) =>
  department?.departmentId ??
  department?.DepartmentId ??
  department?.id ??
  department?.Id;

const getDepartmentName = (
  department,
) =>
  department?.departmentName ??
  department?.DepartmentName ??
  department?.name ??
  department?.Name ??
  "Unknown department";

/* =========================================================
   NORMALIZE PAGINATION RESPONSE
========================================================= */

const normalizeUsersResponse = (
  data,
) => {
  /* -------------------------------------------------------
     API trả về trực tiếp array
  ------------------------------------------------------- */

  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: 1,
      pageSize:
        data.length || 20,
      totalPages:
        data.length ? 1 : 0,
    };
  }

  /* -------------------------------------------------------
     API trả về object
  ------------------------------------------------------- */

  const items =
    data?.items ??
    data?.Items ??
    data?.data ??
    data?.Data ??
    data?.users ??
    data?.Users ??
    [];

  /* -------------------------------------------------------
     BACKEND:
       totalItems
       totalPages
       page
       pageSize
  ------------------------------------------------------- */

  const total =
    data?.total ??
    data?.Total ??
    data?.totalCount ??
    data?.TotalCount ??
    data?.totalItems ??
    data?.TotalItems ??
    items.length;

  const page =
    data?.page ??
    data?.Page ??
    1;

  const pageSize =
    data?.pageSize ??
    data?.PageSize ??
    20;

  const calculatedTotalPages =
    Math.ceil(
      Number(total) /
        Number(pageSize || 20),
    );

  const totalPages =
    data?.totalPages ??
    data?.TotalPages ??
    calculatedTotalPages;

  return {
    items: Array.isArray(items)
      ? items
      : [],

    total:
      Number(total) || 0,

    page:
      Number(page) || 1,

    pageSize:
      Number(pageSize) || 20,

    totalPages:
      Number(totalPages) || 0,
  };
};

/* =========================================================
   NORMALIZE USER SCOPE RESPONSE
========================================================= */

const normalizeUserScope = (
  data,
) => {
  if (!data) {
    return {
      user: null,
      departments: [],
      departmentIds: [],
    };
  }

  const departments =
    data?.departments ??
    data?.Departments ??
    data?.managedDepartments ??
    data?.ManagedDepartments ??
    data?.scopes ??
    data?.Scopes ??
    [];

  let departmentIds =
    data?.departmentIds ??
    data?.DepartmentIds ??
    data?.managedDepartmentIds ??
    data?.ManagedDepartmentIds ??
    [];

  if (
    !Array.isArray(
      departmentIds,
    )
  ) {
    departmentIds = [];
  }

  /* -------------------------------------------------------
     Nếu backend không trả departmentIds
     thì lấy từ departments
  ------------------------------------------------------- */

  if (
    departmentIds.length === 0 &&
    Array.isArray(departments)
  ) {
    departmentIds =
      departments
        .map(getDepartmentId)
        .filter(
          (id) =>
            id !== null &&
            id !== undefined,
        );
  }

  /* -------------------------------------------------------
     Normalize + remove duplicate
  ------------------------------------------------------- */

  const normalizedDepartmentIds = [
    ...new Set(
      departmentIds
        .map(Number)
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0,
        ),
    ),
  ];

  return {
    user:
      data?.user ??
      data?.User ??
      null,

    departments:
      Array.isArray(
        departments,
      )
        ? departments
        : [],

    departmentIds:
      normalizedDepartmentIds,
  };
};

/* =========================================================
   NORMALIZE DEPARTMENT LIST
========================================================= */

const normalizeDepartments = (
  data,
) => {
  const rawDepartments =
    Array.isArray(data)
      ? data
      : data?.items ??
        data?.Items ??
        data?.data ??
        data?.Data ??
        data?.departments ??
        data?.Departments ??
        [];

  if (
    !Array.isArray(
      rawDepartments,
    )
  ) {
    return [];
  }

  const seenIds = new Set();

  return rawDepartments
    .map((department) => {
      const rawId =
        department?.departmentId ??
        department?.DepartmentId ??
        department?.id ??
        department?.Id;

      const departmentId =
        Number(rawId);

      /* ---------------------------------------------------
         Invalid ID
      --------------------------------------------------- */

      if (
        !Number.isInteger(
          departmentId,
        ) ||
        departmentId <= 0
      ) {
        return null;
      }

      /* ---------------------------------------------------
         Duplicate ID
      --------------------------------------------------- */

      if (
        seenIds.has(
          departmentId,
        )
      ) {
        return null;
      }

      seenIds.add(
        departmentId,
      );

      return {
        departmentId,

        departmentName:
          department?.departmentName ??
          department?.DepartmentName ??
          department?.name ??
          department?.Name ??
          "Unknown department",

        isActive:
          department?.isActive ??
          department?.IsActive ??
          true,
      };
    })
    .filter(Boolean);
};

/* =========================================================
   NORMALIZE STATISTICS
========================================================= */

const normalizeStatistics = (
  data,
) => {
  if (!data) {
    return {
      totalUsers: 0,
      usersWithScope: 0,
      totalScopes: 0,
      totalDepartments: 0,
    };
  }

  return {
    /* -----------------------------------------------------
       TỔNG USER
       Phải là tổng tất cả User trong hệ thống.
       KHÔNG fallback sang totalUsersWithScope.
    ----------------------------------------------------- */

    totalUsers: Number(
      data?.totalUsers ??
        data?.TotalUsers ??
        data?.userCount ??
        data?.UserCount ??
        0,
    ),

    /* -----------------------------------------------------
       USER CÓ SCOPE
    ----------------------------------------------------- */

    usersWithScope: Number(
      data?.usersWithScope ??
        data?.UsersWithScope ??
        data?.totalUsersWithScope ??
        data?.TotalUsersWithScope ??
        0,
    ),

    /* -----------------------------------------------------
       TỔNG SCOPE
    ----------------------------------------------------- */

    totalScopes: Number(
      data?.totalScopes ??
        data?.TotalScopes ??
        data?.totalScopeCount ??
        data?.TotalScopeCount ??
        0,
    ),

    /* -----------------------------------------------------
       TỔNG DEPARTMENT
    ----------------------------------------------------- */

    totalDepartments: Number(
      data?.totalDepartments ??
        data?.TotalDepartments ??
        data?.departmentCount ??
        data?.DepartmentCount ??
        0,
    ),
  };
};

/* =========================================================
   PAGE
========================================================= */

export default function AdminScopePage() {
  /* =======================================================
     PERMISSIONS
  ======================================================= */

  const canViewScope =
    hasPermission(
      "Scope.View",
    );

  const canAssignScope =
    hasPermission(
      "Scope.Assign",
    );

  /* =======================================================
     USERS
  ======================================================= */

  const [users, setUsers] =
    useState([]);

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [search, setSearch] =
    useState("");

  const [page, setPage] =
    useState(1);

  const pageSize = 20;

  const [total, setTotal] =
    useState(0);

  const [
    totalPages,
    setTotalPages,
  ] = useState(0);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     STATISTICS
  ======================================================= */

  const [
    statistics,
    setStatistics,
  ] = useState({
    totalUsers: 0,
    usersWithScope: 0,
    totalScopes: 0,
    totalDepartments: 0,
  });

  const [
    statisticsLoading,
    setStatisticsLoading,
  ] = useState(false);

  /* =======================================================
     VIEW MODAL
  ======================================================= */

  const [
    viewingUser,
    setViewingUser,
  ] = useState(null);

  const [
    viewingDepartments,
    setViewingDepartments,
  ] = useState([]);

  const [
    viewLoading,
    setViewLoading,
  ] = useState(false);

  /* =======================================================
     EDIT MODAL
  ======================================================= */
const [toast, setToast] = useState({
  type: "success",
  message: "",
  title: "",
});
  const [
    selectedUser,
    setSelectedUser,
  ] = useState(null);

  const [
    availableDepartments,
    setAvailableDepartments,
  ] = useState([]);

  const [
    selectedDepartmentIds,
    setSelectedDepartmentIds,
  ] = useState([]);

  const [
    originalDepartmentIds,
    setOriginalDepartmentIds,
  ] = useState([]);

  const [
    scopeLoading,
    setScopeLoading,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    scopeError,
    setScopeError,
  ] = useState("");

  /* =======================================================
     LOAD USERS
  ======================================================= */

  const loadUsers =
    useCallback(
      async ({
        targetPage = 1,
        targetSearch = "",
      } = {}) => {
        try {
          setLoading(true);
          setError("");

          const response =
            await getScopeUsers({
              search:
                targetSearch,
              page: targetPage,
              pageSize,
            });

          const normalized =
            normalizeUsersResponse(
              response,
            );

          setUsers(
            normalized.items,
          );

          setTotal(
            normalized.total,
          );

          setTotalPages(
            normalized.totalPages,
          );
        } catch (err) {
          console.error(
            "Failed to load scope users:",
            err,
          );

          setUsers([]);
          setTotal(0);
          setTotalPages(0);

          setError(
            err?.response?.data
              ?.message ||
              err?.response?.data
                ?.title ||
              "Không thể tải danh sách Scope.",
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  /* =======================================================
     LOAD STATISTICS
  ======================================================= */

  const loadStatistics =
    useCallback(
      async () => {
        try {
          setStatisticsLoading(
            true,
          );

          const response =
            await getScopeStatistics();

          setStatistics(
            normalizeStatistics(
              response,
            ),
          );
        } catch (err) {
          console.error(
            "Failed to load scope statistics:",
            err,
          );
        } finally {
          setStatisticsLoading(
            false,
          );
        }
      },
      [],
    );

  /* =======================================================
     INITIAL / PAGE / SEARCH LOAD
  ======================================================= */

  useEffect(() => {
    if (!canViewScope) {
      return;
    }

    loadUsers({
      targetPage: page,
      targetSearch: search,
    });
  }, [
    canViewScope,
    page,
    search,
    loadUsers,
  ]);

  /* =======================================================
     LOAD STATISTICS
  ======================================================= */

  useEffect(() => {
    if (!canViewScope) {
      return;
    }

    loadStatistics();
  }, [
    canViewScope,
    loadStatistics,
  ]);

  /* =======================================================
     SEARCH SUBMIT
  ======================================================= */

  const handleSearchSubmit = (
    event,
  ) => {
    event.preventDefault();

    const value =
      searchInput.trim();

    setPage(1);
    setSearch(value);
  };

  /* =======================================================
     SEARCH INPUT
  ======================================================= */

  const handleSearchChange = (
    value,
  ) => {
    setSearchInput(value);
  };

  /* =======================================================
     CLEAR SEARCH
  ======================================================= */

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh =
    useCallback(
      async () => {
        if (!canViewScope) {
          return;
        }

        await Promise.all([
          loadUsers({
            targetPage: page,
            targetSearch: search,
          }),

          loadStatistics(),
        ]);
      },
      [
        canViewScope,
        loadUsers,
        loadStatistics,
        page,
        search,
      ],
    );

  /* =======================================================
     LOAD USER SCOPE
  ======================================================= */

  const loadUserScope =
    useCallback(
      async (user) => {
        const userId =
          getUserId(user);

        if (!userId) {
          return null;
        }

        const response =
          await getUserScope(
            userId,
          );

        return normalizeUserScope(
          response,
        );
      },
      [],
    );

  /* =======================================================
     OPEN VIEW MODAL
  ======================================================= */

  const handleOpenView =
    async (user) => {
      const userId =
        getUserId(user);

      if (!userId) {
        return;
      }

      try {
        setViewingUser(user);
        setViewingDepartments([]);
        setViewLoading(true);

        const normalized =
          await loadUserScope(
            user,
          );

        setViewingDepartments(
          normalized?.departments ??
            [],
        );
      } catch (err) {
        console.error(
          "Failed to load scope details:",
          err,
        );

        setViewingDepartments(
          [],
        );
      } finally {
        setViewLoading(false);
      }
    };

  /* =======================================================
     CLOSE VIEW MODAL
  ======================================================= */

  const handleCloseView = () => {
    if (viewLoading) {
      return;
    }

    setViewingUser(null);
    setViewingDepartments([]);
  };

  /* =======================================================
     OPEN EDIT MODAL
  ======================================================= */

  const handleOpenEdit =
    async (user) => {
      if (!canAssignScope) {
        return;
      }

      const userId =
        getUserId(user);

      if (!userId) {
        return;
      }

      try {
        setSelectedUser(user);

        setScopeLoading(true);
        setScopeError("");

        setAvailableDepartments(
          [],
        );

        setSelectedDepartmentIds(
          [],
        );

        setOriginalDepartmentIds(
          [],
        );

        /* -------------------------------------------------
           LOAD ALL DEPARTMENTS + CURRENT SCOPE
        ------------------------------------------------- */

        const [
          departmentsResponse,
          scopeResponse,
        ] = await Promise.all([
          getScopeDepartments({
            page: 1,
            pageSize: 100,
          }),

          getUserScope(
            userId,
          ),
        ]);

        /* -------------------------------------------------
           NORMALIZE ALL DEPARTMENTS
        ------------------------------------------------- */

        const departments =
          normalizeDepartments(
            departmentsResponse,
          );

        setAvailableDepartments(
          departments,
        );

        /* -------------------------------------------------
           NORMALIZE CURRENT USER SCOPE
        ------------------------------------------------- */

        const normalized =
          normalizeUserScope(
            scopeResponse,
          );

        const currentIds = [
          ...new Set(
            (
              normalized?.departmentIds ??
              []
            )
              .map(Number)
              .filter(
                (id) =>
                  Number.isInteger(
                    id,
                  ) &&
                  id > 0,
              ),
          ),
        ];

        setSelectedDepartmentIds(
          currentIds,
        );

        setOriginalDepartmentIds(
          currentIds,
        );
      } catch (err) {
        console.error(
          "Failed to load user scope:",
          err,
        );

        setScopeError(
          err?.response?.data
            ?.message ||
            err?.response?.data
              ?.title ||
            "Không thể tải thông tin Scope.",
        );
      } finally {
        setScopeLoading(false);
      }
    };

  /* =======================================================
     CLOSE EDIT MODAL
  ======================================================= */

  const handleCloseEdit = () => {
    if (saving) {
      return;
    }

    setSelectedUser(null);

    setAvailableDepartments(
      [],
    );

    setSelectedDepartmentIds(
      [],
    );

    setOriginalDepartmentIds(
      [],
    );

    setScopeError("");
  };

  /* =======================================================
   SAVE
======================================================= */

/* =======================================================
   SAVE
======================================================= */

const handleSave = async (
  idsFromModal = null,
) => {
  if (!canAssignScope) {
    return;
  }

  const userId =
    getUserId(
      selectedUser,
    );

  if (!userId) {
    return;
  }

  try {
    setSaving(true);
    setScopeError("");

    /* -----------------------------------------------------
       ƯU TIÊN IDS TỪ MODAL
    ----------------------------------------------------- */

    const sourceIds =
      Array.isArray(idsFromModal)
        ? idsFromModal
        : selectedDepartmentIds;

    /* -----------------------------------------------------
       NORMALIZE FINAL IDS
    ----------------------------------------------------- */

    const ids = [
      ...new Set(
        sourceIds
          .map(Number)
          .filter(
            (id) =>
              Number.isInteger(id) &&
              id > 0,
          ),
      ),
    ];

    console.log(
      "[Scope] Saving:",
      {
        userId,
        departmentIds: ids,
      },
    );

    /* -----------------------------------------------------
       SAVE TO BACKEND
    ----------------------------------------------------- */

    await replaceUserScopes(
      userId,
      ids,
    );

    /* -----------------------------------------------------
       UPDATE LOCAL STATE
    ----------------------------------------------------- */

    setOriginalDepartmentIds(
      ids,
    );

    setSelectedDepartmentIds(
      ids,
    );

    /* -----------------------------------------------------
       REFRESH DATA
    ----------------------------------------------------- */

    await Promise.all([
      loadUsers({
        targetPage: page,
        targetSearch: search,
      }),

      loadStatistics(),
    ]);

    /* -----------------------------------------------------
       SUCCESS TOAST
    ----------------------------------------------------- */

    setToast({
      type: "success",
      title: "Cập nhật thành công",
      message:
        `Đã cập nhật Scope cho ${getUserName(
          selectedUser,
        )}.`,
    });

    /* -----------------------------------------------------
       CLOSE MODAL
    ----------------------------------------------------- */

    setSelectedUser(null);

    setAvailableDepartments(
      [],
    );

    setSelectedDepartmentIds(
      [],
    );

    setOriginalDepartmentIds(
      [],
    );

    setScopeError("");
  } catch (err) {
    console.error(
      "Failed to save user scope:",
      err,
    );

    console.error(
      "[Scope] Save error response:",
      err?.response?.data,
    );

    const errorMessage =
      err?.response?.data
        ?.message ||
      err?.response?.data
        ?.title ||
      "Không thể cập nhật Scope. Vui lòng thử lại.";

    setScopeError(
      errorMessage,
    );

    /* -----------------------------------------------------
       ERROR TOAST
    ----------------------------------------------------- */

    setToast({
      type: "error",
      title: "Cập nhật Scope thất bại",
      message: errorMessage,
    });
  } finally {
    setSaving(false);
  }
};

  /* =======================================================
     PAGINATION
  ======================================================= */

  const handlePageChange =
    (nextPage) => {
      const target =
        Number(nextPage);

      if (
        !Number.isInteger(
          target,
        ) ||
        target < 1
      ) {
        return;
      }

      if (
        totalPages > 0 &&
        target > totalPages
      ) {
        return;
      }

      setPage(target);
    };

  /* =======================================================
     CHECK CHANGES
  ======================================================= */

  const hasChanges =
    useMemo(() => {
      const a = [
        ...originalDepartmentIds,
      ].sort(
        (x, y) => x - y,
      );

      const b = [
        ...selectedDepartmentIds,
      ].sort(
        (x, y) => x - y,
      );

      if (
        a.length !==
        b.length
      ) {
        return true;
      }

      return a.some(
        (value, index) =>
          value !==
          b[index],
      );
    }, [
      originalDepartmentIds,
      selectedDepartmentIds,
    ]);

  /* =======================================================
     SELECTED COUNT
  ======================================================= */

  const selectedCount =
    selectedDepartmentIds.length;

  /* =======================================================
     ACCESS DENIED
  ======================================================= */

  if (!canViewScope) {
    return (
      <div className="admin-scope-page">
        <div className="admin-scope-alert error">
          Bạn không có quyền xem
          Scope.
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="admin-scope-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <ScopeHeader
        title="Scope Management"
        description="Quản lý phạm vi Department mà từng người dùng được phép quản lý."
        onRefresh={
          handleRefresh
        }
        loading={
          loading ||
          statisticsLoading
        }
      />

      {/* =================================================
          SUMMARY
      ================================================= */}

      <ScopeSummary
        totalUsers={
          statistics.totalUsers
        }
        usersWithScope={
          statistics.usersWithScope
        }
        totalScopes={
          statistics.totalScopes
        }
        totalDepartments={
          statistics.totalDepartments
        }
      />

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <ScopeToolbar
        search={searchInput}
        onSearchChange={
          handleSearchChange
        }
        onSearchSubmit={
          handleSearchSubmit
        }
        onClearSearch={
          handleClearSearch
        }
        pageSize={pageSize}
        onPageSizeChange={() => {}}
        onRefresh={
          handleRefresh
        }
        loading={loading}
      />

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="admin-scope-alert error">
          {error}
        </div>
      )}

      {/* =================================================
          TABLE
      ================================================= */}

      <ScopeTable
        users={users}
        loading={loading}
        canAssignScope={
          canAssignScope
        }
        onView={
          handleOpenView
        }
        onEdit={
          handleOpenEdit
        }
      />

      {/* =================================================
          PAGINATION
      ================================================= */}

      {!loading &&
        users.length > 0 && (
          <ScopePagination
            page={page}
            pageSize={pageSize}
            totalCount={total}
            onPageChange={
              handlePageChange
            }
            loading={loading}
          />
        )}

      {/* =================================================
          VIEW USER SCOPE MODAL
      ================================================= */}

      <ScopeUserModal
        open={Boolean(
          viewingUser,
        )}
        user={viewingUser}
        departments={
          viewingDepartments
        }
        loading={viewLoading}
        onClose={
          handleCloseView
        }
      />

      {/* =================================================
          EDIT / ASSIGN SCOPE MODAL
      ================================================= */}

      {canAssignScope && (
        <AssignDepartmentModal
          open={Boolean(
            selectedUser,
          )}
          user={selectedUser}
          departments={
            availableDepartments
          }
          currentDepartmentIds={
            selectedDepartmentIds
          }
          loading={scopeLoading}
          saving={saving}
          onClose={
            handleCloseEdit
          }
          onSave={
            handleSave
          }
        />
      )}

      {/* =================================================
          EDIT ERROR
      ================================================= */}

      
              {/* =================================================
                        TOAST
                    ================================================= */}

                    <Toast
                        type={toast.type}
                        title={toast.title}
                        message={toast.message}
                        duration={3000}
                        onClose={() =>
                        setToast({
                            type: "success",
                            title: "",
                            message: "",
                        })
                        }
                    />
    </div>
  );
}