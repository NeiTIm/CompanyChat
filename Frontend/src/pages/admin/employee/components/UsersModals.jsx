import CreateEmployeeModal from "../CreateEmployeeModal";
import EditEmployeeModal from "../EditEmployeeModal";
import EmployeeDetailModal from "../EmployeeDetailModal";
import ResetPasswordModal from "../ResetPasswordModal";
import AssignDepartmentModal from "../AssignDepartmentModal";

import ConfirmModal from "../../../../components/modal/ConfirmModal";
import Toast from "../../../../components/common/Toast";

export default function UsersModals({
  /* =========================
     CREATE
  ========================= */
  showCreateModal,
  departments,
  departmentLoading,
  roles,
  canCreate,
  canAssignRole,
  onCloseCreate,
  onEmployeeCreated,

  /* =========================
     EDIT
  ========================= */
  showEditModal,
  selectedUser,
  onCloseEdit,
  onEmployeeUpdated,

  /* =========================
     RESET PASSWORD
  ========================= */
  showResetPasswordModal,
  onCloseResetPassword,
  onPasswordReset,

  /* =========================
     ASSIGN DEPARTMENT
  ========================= */
  showAssignDepartmentModal,
  onCloseAssignDepartment,
  onDepartmentAssigned,

  /* =========================
     DETAIL
  ========================= */
  detailLoading,
  onCloseDetail,

  /* =========================
     CONFIRM
  ========================= */
  confirmModal,
  actionLoading,
  onConfirm,
  onCloseConfirm,

  /* =========================
     TOAST
  ========================= */
  toast,
  onCloseToast,
}) {
  return (
    <>
      {/* =================================================
          CREATE
      ================================================= */}
      {showCreateModal && (
        <CreateEmployeeModal
          departments={departments}
          departmentLoading={departmentLoading}
          roles={roles}
          canCreate={canCreate}
          canAssignRole={canAssignRole}
          onClose={onCloseCreate}
          onCreated={onEmployeeCreated}
        />
      )}

      {/* =================================================
          EDIT
      ================================================= */}
      {showEditModal &&
        selectedUser && (
          <EditEmployeeModal
            user={selectedUser}
            onClose={onCloseEdit}
            onUpdated={onEmployeeUpdated}
          />
        )}

      {/* =================================================
          RESET PASSWORD
      ================================================= */}
      {showResetPasswordModal &&
        selectedUser && (
          <ResetPasswordModal
            user={selectedUser}
            onClose={onCloseResetPassword}
            onReset={onPasswordReset}
          />
        )}

      {/* =================================================
          ASSIGN DEPARTMENT
      ================================================= */}
      {showAssignDepartmentModal &&
        selectedUser && (
          <AssignDepartmentModal
            user={selectedUser}
            departments={departments}
            departmentLoading={departmentLoading}
            onClose={onCloseAssignDepartment}
            onAssigned={onDepartmentAssigned}
          />
        )}

      {/* =================================================
          DETAIL
      ================================================= */}
      {selectedUser &&
        !showEditModal &&
        !showResetPasswordModal &&
        !showAssignDepartmentModal && (
          <EmployeeDetailModal
            user={selectedUser}
            loading={detailLoading}
            onClose={onCloseDetail}
          />
        )}

      {/* =================================================
          CONFIRM
      ================================================= */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={
            confirmModal.confirmText
          }
          cancelText={
            confirmModal.cancelText
          }
          danger={confirmModal.danger}
          loading={actionLoading}
          onConfirm={
            confirmModal.onConfirm
          }
          onClose={onCloseConfirm}
        />
      )}

      {/* =================================================
          TOAST
      ================================================= */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={onCloseToast}
        />
      )}
    </>
  );
}