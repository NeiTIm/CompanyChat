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

  const [error, setError] =
    useState("");


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

  const [systemOnly, setSystemOnly] =
    useState("");


  /* =======================================================
     PAGINATION
  ======================================================= */

  const [page, setPage] =
    useState(1);

  const [pageSize] =
    useState(10);


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
     LOAD ROLES
  ======================================================= */

  async function loadRoles(
    customSearch = search,
    customSystemOnly = systemOnly
  ) {

    if (!canView) {
      setRoles([]);
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
        });


      const items =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : [];


      setRoles(
        items
      );

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

      setLoading(false);

    }
  }


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {

    loadRoles();

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

    setPage(1);

    loadRoles(
      search,
      systemOnly
    );
  }


  function handleClearSearch() {

    setSearch("");

    setPage(1);

    loadRoles(
      "",
      systemOnly
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

    setSystemOnly(
      value
    );

    setPage(1);

    loadRoles(
      search,
      value
    );
  }


  /* =======================================================
     REFRESH
  ======================================================= */

  function handleRefresh() {

    loadRoles(
      search,
      systemOnly
    );
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

      /*
       * Nếu đang mở Detail thì đóng Detail
       * trước khi mở Edit.
       */
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

      /*
       * Đóng Detail trước khi mở
       * Permission Modal.
       */
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


            /*
             * Reload từ backend thay vì
             * chỉ filter local.
             *
             * An toàn hơn cho pagination,
             * filter và tổng số role.
             */
            await loadRoles(
              search,
              systemOnly
            );


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

    setPage(1);

    await loadRoles(
      search,
      systemOnly
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


    /*
     * Reload toàn bộ danh sách.
     *
     * Quan trọng vì backend có thể cập nhật
     * User.Role khi đổi tên Custom Role.
     */
    await loadRoles(
      search,
      systemOnly
    );


    /*
     * Refresh selected role để Detail /
     * Permission có dữ liệu mới nhất.
     */
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


    /*
     * PermissionCount trong danh sách Role
     * cần được cập nhật lại từ backend.
     */
    await loadRoles(
      search,
      systemOnly
    );


    /*
     * Refresh selected role.
     */
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

  const total =
    roles.length;


  const totalPages =
    Math.max(
      Math.ceil(
        total /
          pageSize
      ),
      1
    );


  /*
   * Nếu sau khi delete/filter,
   * page hiện tại không còn tồn tại,
   * đưa về page cuối hợp lệ.
   */
  useEffect(() => {

    if (
      page >
      totalPages
    ) {

      setPage(
        totalPages
      );

    }

  }, [
    page,
    totalPages,
  ]);


  function goToPreviousPage() {

    if (
      page <= 1
    ) {
      return;
    }

    setPage(
      current =>
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
      current =>
        current + 1
    );
  }


  function handlePageChange(
    nextPage
  ) {

    if (
      nextPage < 1 ||
      nextPage > totalPages
    ) {
      return;
    }

    setPage(
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
     PAGINATED DATA
  ======================================================= */

  const startIndex =
    (page - 1) *
    pageSize;


  const paginatedRoles =
    roles.slice(
      startIndex,
      startIndex +
        pageSize
    );


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
            paginatedRoles
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
            paginatedRoles
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
        <div
          className={
            `admin-toast ${
              toast.type === "error"
                ? "error"
                : "success"
            }`
          }
        >

          <span>
            {toast.message}
          </span>

          <button
            type="button"
            onClick={() =>
              setToast(null)
            }
            aria-label="Đóng thông báo"
          >
            ×
          </button>

        </div>
      )}

    </div>
  );
}