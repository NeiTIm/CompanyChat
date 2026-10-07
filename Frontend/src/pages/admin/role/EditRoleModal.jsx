import {
  useEffect,
  useState,
} from "react";

import {
  updateRole,
} from "../../../services/admin/roleService";


export default function EditRoleModal({
  open,
  role,
  loading: detailLoading,
  onClose,
  onUpdated,
  canUpdate,
}) {

  /* =======================================================
     FORM
  ======================================================= */

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");


  /* =======================================================
     LOADING / ERROR
  ======================================================= */

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  /* =======================================================
     SYSTEM ROLE
  ======================================================= */

  const isSystemRole =
    Boolean(
      role?.isSystemRole
    );


  /* =======================================================
     LOAD ROLE INTO FORM
  ======================================================= */

  useEffect(() => {
    if (!open || !role) {
      return;
    }

    setName(
      role.name || ""
    );

    setDescription(
      role.description || ""
    );

    setError("");
    setLoading(false);

  }, [
    open,
    role,
  ]);


  /* =======================================================
     CLOSE
  ======================================================= */

  function handleClose() {
    if (
      loading ||
      detailLoading
    ) {
      return;
    }

    onClose();
  }


  /* =======================================================
     SUBMIT
  ======================================================= */

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (
      !canUpdate ||
      !role
    ) {
      return;
    }

    const trimmedName =
      name.trim();

    const trimmedDescription =
      description.trim();


    /* ================================================
       VALIDATION
    ================================================ */

    if (!isSystemRole) {

      if (!trimmedName) {
        setError(
          "Vui lòng nhập tên Role."
        );

        return;
      }

      if (
        trimmedName.length >
        100
      ) {
        setError(
          "Tên Role không được vượt quá 100 ký tự."
        );

        return;
      }

    }


    if (
      trimmedDescription.length >
      500
    ) {
      setError(
        "Mô tả không được vượt quá 500 ký tự."
      );

      return;
    }


    try {
      setLoading(true);
      setError("");


      const data = {
        description:
          trimmedDescription,
      };


      /*
       * System Role:
       * chỉ gửi description.
       *
       * Custom Role:
       * gửi cả name + description.
       */

      if (!isSystemRole) {
        data.name =
          trimmedName;
      }


      await updateRole(
        role.id,
        data
      );


      onUpdated();

    } catch (error) {
      console.error(
        "Không thể cập nhật Role:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Không thể cập nhật Role."
      );

    } finally {
      setLoading(false);
    }
  }


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
          handleClose();
        }
      }}
    >

      <div
        className="admin-role-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-role-title"
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="admin-role-modal-header">

          <div>

            <h2 id="edit-role-title">
              Chỉnh sửa Role
            </h2>

            <p>
              {isSystemRole
                ? "Cập nhật mô tả của System Role."
                : "Cập nhật thông tin Role."}
            </p>

          </div>


          <button
            type="button"
            className="admin-role-modal-close"
            onClick={
              handleClose
            }
            disabled={
              loading ||
              detailLoading
            }
            aria-label="Đóng"
          >
            ×
          </button>

        </div>


        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={
            handleSubmit
          }
        >

          <div className="admin-role-modal-body">

            {/* LOADING DETAIL */}

            {detailLoading ? (
              <div className="admin-role-detail-loading">

                <div className="admin-role-loading-spinner" />

                <span>
                  Đang tải thông tin Role...
                </span>

              </div>
            ) : (
              <>
                {error && (
                  <div className="admin-role-form-error">

                    <span className="admin-error-icon">
                      !
                    </span>

                    <span>
                      {error}
                    </span>

                  </div>
                )}


                {/* ROLE TYPE */}

                <div className="admin-role-type-info">

                  <span className="admin-role-type-label">
                    Loại Role
                  </span>

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


                {/* NAME */}

                <div className="admin-role-form-group">

                  <label htmlFor="edit-role-name">
                    Tên Role
                    {!isSystemRole && (
                      <span className="required">
                        *
                      </span>
                    )}
                  </label>

                  <input
                    id="edit-role-name"
                    type="text"
                    value={
                      name
                    }
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    placeholder="Tên Role"
                    maxLength={100}
                    disabled={
                      loading ||
                      isSystemRole
                    }
                  />

                  {isSystemRole && (
                    <div className="admin-role-form-hint">
                      System Role không thể đổi tên.
                    </div>
                  )}

                  {!isSystemRole && (
                    <div className="admin-role-form-hint">
                      {name.length}/100 ký tự
                    </div>
                  )}

                </div>


                {/* DESCRIPTION */}

                <div className="admin-role-form-group">

                  <label htmlFor="edit-role-description">
                    Mô tả
                  </label>

                  <textarea
                    id="edit-role-description"
                    value={
                      description
                    }
                    onChange={(event) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    placeholder="Mô tả quyền hạn và mục đích của Role..."
                    maxLength={500}
                    rows={5}
                    disabled={
                      loading
                    }
                  />

                  <div className="admin-role-form-hint">
                    {description.length}/500 ký tự
                  </div>

                </div>


                {/* STATISTICS */}

                <div className="admin-role-edit-stats">

                  <div className="admin-role-edit-stat">

                    <span>
                      Người dùng
                    </span>

                    <strong>
                      {role.userCount ??
                        0}
                    </strong>

                  </div>


                  <div className="admin-role-edit-stat">

                    <span>
                      Active
                    </span>

                    <strong>
                      {role.activeUserCount ??
                        0}
                    </strong>

                  </div>


                  <div className="admin-role-edit-stat">

                    <span>
                      Online
                    </span>

                    <strong>
                      {role.onlineUserCount ??
                        0}
                    </strong>

                  </div>


                  <div className="admin-role-edit-stat">

                    <span>
                      Permission
                    </span>

                    <strong>
                      {role.permissionCount ??
                        0}
                    </strong>

                  </div>

                </div>

              </>
            )}

          </div>


          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="admin-role-modal-footer">

            <button
              type="button"
              className="admin-role-modal-cancel"
              onClick={
                handleClose
              }
              disabled={
                loading ||
                detailLoading
              }
            >
              Hủy
            </button>

            <button
              type="submit"
              className="admin-role-modal-submit"
              disabled={
                loading ||
                detailLoading ||
                !canUpdate
              }
            >
              {loading
                ? "Đang lưu..."
                : "Lưu thay đổi"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}