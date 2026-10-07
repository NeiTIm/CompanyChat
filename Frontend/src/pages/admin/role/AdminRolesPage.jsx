import {
  useEffect,
  useState,
} from "react";

import {
  getRoles,
  getRole,
  deleteRole,
} from "../../../services/admin/roleService";

import {
  hasPermission,
} from "../../../utils/permissionUtils";

import RolesHeader from "./components/RolesHeader";
import RolesToolbar from "./components/RolesToolbar";
import RolesSummary from "./components/RolesSummary";
import RolesTable from "./components/RolesTable";
import RolesPagination from "./components/RolesPagination";

import CreateRoleModal from "./CreateRoleModal";
import EditRoleModal from "./EditRoleModal";
import RoleDetailModal from "./RoleDetailModal";
import RolePermissionModal from "./RolePermissionModal";

import Toast from "../../../components/common/Toast";

export default function AdminRolesPage() {

  /* =======================================================
     PERMISSIONS
  ======================================================= */

  const canView =
    hasPermission(
      "Role.View"
    );

  const canCreate =
    hasPermission(
      "Role.Create"
    );

  const canUpdate =
    hasPermission(
      "Role.Update"
    );

  const canDelete =
    hasPermission(
      "Role.Delete"
    );

  const canAssign =
    hasPermission(
      "Role.Assign"
    );


  /* =======================================================
     DATA
  ======================================================= */

  const [roles, setRoles] =
    useState([]);

  const [roleOptions, setRoleOptions] =
    useState([]);

  const [selectedRole, setSelectedRole] =
    useState(null);


  /* =======================================================
     LOADING / ERROR
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [toast, setToast] =
    useState(null);

  const [error, setError] =
    useState("");


  /* =======================================================
     TOAST
  ======================================================= */

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

  const [systemOnly, setSystemOnly] =
    useState("");

  const [roleName, setRoleName] =
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

  const [showDetailModal, setShowDetailModal] =
    useState(false);

  const [showPermissionModal, setShowPermissionModal] =
    useState(false);

  const [confirmModal, setConfirmModal] =
    useState(null);


  /* =======================================================
     LOAD ROLE OPTIONS

     Dùng riêng cho dropdown Role Name.

     Không dùng roles của page hiện tại vì đang
     server-side pagination.
  ======================================================= */

  async function loadRoleOptions() {

    if (!canView) {

      setRoleOptions([]);

      return;
    }


    try {

      const data =
        await getRoles({
          search: "",
          systemOnly: null,
          roleName: "",
          page: 1,
          pageSize: 100,
        });


      const items =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : [];


      const uniqueRoles = [
        ...new Map(
          items
            .filter(
              role =>
                role &&
                typeof role.name === "string" &&
                role.name.trim() !== ""
            )
            .map(
              role => [
                role.name.trim(),
                role,
              ]
            )
        ).values(),
      ];


      uniqueRoles.sort(
        (a, b) =>
          a.name.localeCompare(
            b.name,
            "vi",
            {
              sensitivity: "base",
            }
          )
      );


      setRoleOptions(
        uniqueRoles
      );

    } catch (error) {

      console.error(
        "Không thể tải danh sách Role cho filter:",
        error
      );

      setRoleOptions([]);
    }
  }


  /* =======================================================
     LOAD ROLES
  ======================================================= */

  async function loadRoles(
    customSearch = search,
    customSystemOnly = systemOnly,
    customRoleName = roleName,
    customPage = page
  ) {

    if (!canView) {

      setRoles([]);

      setTotal(0);

      setTotalPages(1);

      setLoading(false);

      return;
    }


    try {

      setLoading(true);

      setError("");


      const data =
        await getRoles({

          search:
            customSearch.trim(),

          systemOnly:
            customSystemOnly === ""
              ? null
              : customSystemOnly === "true",

          roleName:
            customRoleName.trim(),

          page:
            customPage,

          pageSize,
        });


      /* =================================================
         BACKEND RESPONSE

         {
           items,
           page,
           pageSize,
           total,
           totalPages
         }
      ================================================= */

      const items =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : [];


      setRoles(
        items
      );


      setTotal(
        Number(
          data?.total || 0
        )
      );


      setTotalPages(
        Math.max(
          Number(
            data?.totalPages || 1
          ),
          1
        )
      );


      /* =================================================
         BACKEND CÓ THỂ TỰ ĐIỀU CHỈNH PAGE
      ================================================= */

      if (
        Number.isInteger(
          data?.page
        ) &&
        data.page !== customPage
      ) {

        setPage(
          data.page
        );
      }

    } catch (error) {

      console.error(
        "Không thể tải danh sách role:",
        error
      );


      const message =
        error?.response?.data?.message ||
        "Không thể tải danh sách role.";


      setError(
        message
      );


      showToast(
        "error",
        message
      );

    } finally {

      setLoading(
        false
      );
    }
  }


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {

    if (!canView) {
      return;
    }


    loadRoles(
      search,
      systemOnly,
      roleName,
      page
    );


    loadRoleOptions();

  }, [
    canView,
  ]);


  /* =======================================================
     SEARCH
  ======================================================= */

  function handleSearchChange(
    event
  ) {

    setSearch(
      event.target.value
    );
  }


  function handleSearchSubmit(
    event
  ) {

    event.preventDefault();


    const nextPage =
      1;


    setPage(
      nextPage
    );


    loadRoles(
      search,
      systemOnly,
      roleName,
      nextPage
    );
  }


  function handleClearSearch() {

    const nextSearch =
      "";

    const nextPage =
      1;


    setSearch(
      nextSearch
    );


    setPage(
      nextPage
    );


    loadRoles(
      nextSearch,
      systemOnly,
      roleName,
      nextPage
    );
  }


  /* =======================================================
     SYSTEM FILTER
  ======================================================= */

  function handleSystemFilterChange(
    event
  ) {

    const value =
      event.target.value;

    const nextPage =
      1;


    setSystemOnly(
      value
    );


    setPage(
      nextPage
    );


    loadRoles(
      search,
      value,
      roleName,
      nextPage
    );
  }


  /* =======================================================
     ROLE NAME FILTER
  ======================================================= */

  function handleRoleNameChange(
    event
  ) {

    const value =
      event.target.value;

    const nextPage =
      1;


    setRoleName(
      value
    );


    setPage(
      nextPage
    );


    loadRoles(
      search,
      systemOnly,
      value,
      nextPage
    );
  }


  /* =======================================================
     REFRESH
  ======================================================= */

  function handleRefresh() {

    loadRoles(
      search,
      systemOnly,
      roleName,
      page
    );


    loadRoleOptions();
  }


  /* =======================================================
     VIEW ROLE
  ======================================================= */

  async function handleViewRole(
    roleId
  ) {

    if (!canView) {
      return;
    }


    try {

      setDetailLoading(
        true
      );


      const role =
        await getRole(
          roleId
        );


      setSelectedRole(
        role
      );


      setShowDetailModal(
        true
      );

    } catch (error) {

      console.error(
        "Không thể tải thông tin role:",
        error
      );


      showToast(
        "error",
        error?.response?.data?.message ||
          "Không thể tải thông tin role."
      );

    } finally {

      setDetailLoading(
        false
      );
    }
  }


  /* =======================================================
     EDIT ROLE
  ======================================================= */

  async function handleEditRole(
    roleId
  ) {

    if (!canUpdate) {
      return;
    }


    try {

      setDetailLoading(
        true
      );


      const role =
        await getRole(
          roleId
        );


      setSelectedRole(
        role
      );


      setShowDetailModal(
        false
      );


      setShowEditModal(
        true
      );

    } catch (error) {

      console.error(
        "Không thể tải role:",
        error
      );


      showToast(
        "error",
        error?.response?.data?.message ||
          "Không thể tải thông tin role."
      );

    } finally {

      setDetailLoading(
        false
      );
    }
  }


  /* =======================================================
     MANAGE PERMISSIONS
  ======================================================= */

  async function handleManagePermissions(
    roleId
  ) {

    if (!canAssign) {
      return;
    }


    try {

      setDetailLoading(
        true
      );


      const role =
        await getRole(
          roleId
        );


      setSelectedRole(
        role
      );


      setShowDetailModal(
        false
      );


      setShowPermissionModal(
        true
      );

    } catch (error) {

      console.error(
        "Không thể tải role:",
        error
      );


      showToast(
        "error",
        error?.response?.data?.message ||
          "Không thể tải thông tin role."
      );

    } finally {

      setDetailLoading(
        false
      );
    }
  }


  /* =======================================================
     DELETE ROLE
  ======================================================= */

  function handleDeleteRole(
    role
  ) {

    if (!canDelete) {
      return;
    }


    /* -----------------------------------------------------
       SYSTEM ROLE
    ----------------------------------------------------- */

    if (
      role.isSystemRole
    ) {

      showToast(
        "error",
        "Không thể xóa System Role."
      );

      return;
    }


    /* -----------------------------------------------------
       ROLE IS IN USE
    ----------------------------------------------------- */

    if (
      Number(
        role.userCount || 0
      ) > 0
    ) {

      showToast(
        "error",
        "Không thể xóa role đang được sử dụng."
      );

      return;
    }


    /* -----------------------------------------------------
       CONFIRM
    ----------------------------------------------------- */

    setConfirmModal({

      title:
        "Xác nhận xóa Role",

      message:
        `Bạn có chắc muốn xóa role ` +
        `"${role.name}"? ` +
        `Thao tác này không thể hoàn tác.`,

      confirmText:
        "Xóa Role",

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


            await deleteRole(
              role.id
            );


            await loadRoles(
              search,
              systemOnly,
              roleName,
              page
            );


            await loadRoleOptions();


            setSelectedRole(
              current =>
                current?.id ===
                role.id
                  ? null
                  : current
            );


            setConfirmModal(
              null
            );


            showToast(
              "success",
              `Đã xóa role "${role.name}".`
            );

          } catch (error) {

            console.error(
              "Không thể xóa role:",
              error
            );


            showToast(
              "error",
              error?.response?.data?.message ||
                "Không thể xóa role."
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

  async function handleRoleCreated() {

    setShowCreateModal(
      false
    );


    const nextPage =
      1;


    setPage(
      nextPage
    );


    await loadRoleOptions();


    await loadRoles(
      search,
      systemOnly,
      roleName,
      nextPage
    );


    showToast(
      "success",
      "Đã tạo role thành công."
    );
  }


  /* =======================================================
     UPDATE SUCCESS
  ======================================================= */

  async function handleRoleUpdated() {

    setShowEditModal(
      false
    );


    await loadRoleOptions();


    await loadRoles(
      search,
      systemOnly,
      roleName,
      page
    );


    if (
      selectedRole
    ) {

      try {

        const refreshedRole =
          await getRole(
            selectedRole.id
          );


        setSelectedRole(
          refreshedRole
        );

      } catch (error) {

        console.error(
          "Không thể refresh role:",
          error
        );
      }
    }


    showToast(
      "success",
      "Đã cập nhật role thành công."
    );
  }


  /* =======================================================
     PERMISSION UPDATE SUCCESS
  ======================================================= */

  async function handlePermissionsUpdated() {

    setShowPermissionModal(
      false
    );


    await loadRoles(
      search,
      systemOnly,
      roleName,
      page
    );


    if (
      selectedRole
    ) {

      try {

        const refreshedRole =
          await getRole(
            selectedRole.id
          );


        setSelectedRole(
          refreshedRole
        );

      } catch (error) {

        console.error(
          "Không thể refresh role:",
          error
        );
      }
    }


    showToast(
      "success",
      "Đã cập nhật Permission cho Role."
    );
  }


  /* =======================================================
     CLOSE CONFIRM MODAL
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
     PAGINATION
  ======================================================= */

  function goToPreviousPage() {

    if (
      loading ||
      page <= 1
    ) {
      return;
    }


    const nextPage =
      page - 1;


    setPage(
      nextPage
    );


    loadRoles(
      search,
      systemOnly,
      roleName,
      nextPage
    );
  }


  function goToNextPage() {

    if (
      loading ||
      page >= totalPages
    ) {
      return;
    }


    const nextPage =
      page + 1;


    setPage(
      nextPage
    );


    loadRoles(
      search,
      systemOnly,
      roleName,
      nextPage
    );
  }


  function handlePageChange(
    nextPage
  ) {

    if (
      loading ||
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === page
    ) {
      return;
    }


    setPage(
      nextPage
    );


    loadRoles(
      search,
      systemOnly,
      roleName,
      nextPage
    );
  }


  function getPageNumbers() {

    const pages = [];

    const maxVisible =
      5;


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
      end -
        start +
        1 <
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


  const pageNumbers =
    getPageNumbers();


  /* =======================================================
     SUMMARY
  ======================================================= */

  const systemCount =
    roles.filter(
      role =>
        role.isSystemRole
    ).length;


  const customCount =
    roles.filter(
      role =>
        !role.isSystemRole
    ).length;


  /* =======================================================
     NO VIEW PERMISSION
  ======================================================= */

  if (!canView) {

    return (
      <div className="admin-roles-page">

        <section className="admin-roles-card">

          <div className="admin-users-error">

            <span className="admin-error-icon">
              !
            </span>

            <span>
              Bạn không có quyền xem danh sách Role.
            </span>

          </div>

        </section>

      </div>
    );
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="admin-roles-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <RolesHeader

        loading={
          loading
        }

        onRefresh={
          handleRefresh
        }

        onCreate={() => {

          if (!canCreate) {
            return;
          }


          setShowCreateModal(
            true
          );

        }}

        canCreate={
          canCreate
        }

      />


      {/* =================================================
          MAIN CARD
      ================================================= */}

      <section className="admin-roles-card">

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <RolesToolbar

          search={
            search
          }

          onSearchChange={
            handleSearchChange
          }

          onSearchSubmit={
            handleSearchSubmit
          }

          onClearSearch={
            handleClearSearch
          }

          systemOnly={
            systemOnly
          }

          onSystemFilterChange={
            handleSystemFilterChange
          }

          roleName={
            roleName
          }

          onRoleNameChange={
            handleRoleNameChange
          }

          roles={
            roleOptions
          }

        />


        {/* =================================================
            SUMMARY
        ================================================= */}

        <RolesSummary

          total={
            total
          }

          systemCount={
            systemCount
          }

          customCount={
            customCount
          }

          page={
            page
          }

          totalPages={
            totalPages
          }

          pageSize={
            pageSize
          }

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

        <RolesTable

          roles={
            roles
          }

          loading={
            loading
          }

          actionLoading={
            actionLoading
          }

          onViewRole={
            handleViewRole
          }

          onEditRole={
            handleEditRole
          }

          onDeleteRole={
            handleDeleteRole
          }

          onManagePermissions={
            handleManagePermissions
          }

          canView={
            canView
          }

          canUpdate={
            canUpdate
          }

          canDelete={
            canDelete
          }

          canAssign={
            canAssign
          }

        />


        {/* =================================================
            PAGINATION
        ================================================= */}

        <RolesPagination

          loading={
            loading
          }

          roles={
            roles
          }

          page={
            page
          }

          pageSize={
            pageSize
          }

          total={
            total
          }

          totalPages={
            totalPages
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
            handlePageChange
          }

        />

      </section>


      {/* =================================================
          CREATE ROLE
      ================================================= */}

      <CreateRoleModal

        open={
          showCreateModal
        }

        onClose={() =>
          setShowCreateModal(
            false
          )
        }

        onCreated={
          handleRoleCreated
        }

        canCreate={
          canCreate
        }

      />


      {/* =================================================
          EDIT ROLE
      ================================================= */}

      <EditRoleModal

        open={
          showEditModal
        }

        role={
          selectedRole
        }

        loading={
          detailLoading
        }

        onClose={() =>
          setShowEditModal(
            false
          )
        }

        onUpdated={
          handleRoleUpdated
        }

        canUpdate={
          canUpdate
        }

      />


      {/* =================================================
          ROLE DETAIL
      ================================================= */}

      <RoleDetailModal

        open={
          showDetailModal
        }

        role={
          selectedRole
        }

        loading={
          detailLoading
        }

        onClose={() =>
          setShowDetailModal(
            false
          )
        }

        onEdit={
          handleEditRole
        }

        onManagePermissions={
          handleManagePermissions
        }

        canUpdate={
          canUpdate
        }

        canAssign={
          canAssign
        }

      />


      {/* =================================================
          ROLE PERMISSIONS
      ================================================= */}

      <RolePermissionModal

        open={
          showPermissionModal
        }

        role={
          selectedRole
        }

        onClose={() =>
          setShowPermissionModal(
            false
          )
        }

        onSaved={
          handlePermissionsUpdated
        }

        canAssign={
          canAssign
        }

      />


      {/* =================================================
          CONFIRM MODAL
      ================================================= */}

      {confirmModal && (

        <div className="admin-modal-overlay">

          <div className="admin-confirm-modal">

            <div className="admin-confirm-modal-header">

              <h3>
                {confirmModal.title}
              </h3>

            </div>


            <div className="admin-confirm-modal-body">

              <p>
                {confirmModal.message}
              </p>

            </div>


            <div className="admin-confirm-modal-actions">

              <button
                type="button"
                onClick={
                  closeConfirmModal
                }
                disabled={
                  actionLoading
                }
              >
                {confirmModal.cancelText ||
                  "Hủy"}
              </button>


              <button
                type="button"
                className={
                  confirmModal.danger
                    ? "danger"
                    : ""
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
                  : confirmModal.confirmText ||
                    "Xác nhận"}

              </button>

            </div>

          </div>

        </div>
      )}


      {/* =================================================
          TOAST
      ================================================= */}

      {toast && (

        <Toast
          type={
            toast.type
          }

          message={
            toast.message
          }

          duration={
            3000
          }

          onClose={() =>
            setToast(
              null
            )
          }
        />

      )}

    </div>
  );
}