import {
  useEffect,
  useState,
} from "react";

import {
  updateDepartment,
} from "../../../services/admin/departmentService";


/* =========================================================
   ICONS
========================================================= */

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
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


function SaveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  );
}


/* =========================================================
   COMPONENT
========================================================= */

export default function EditDepartmentModal({
  department,
  onClose,
  onUpdated,
}) {

  /* =======================================================
     FORM
  ======================================================= */

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");


  /* =======================================================
     STATE
  ======================================================= */

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [fieldErrors, setFieldErrors] =
    useState({});


  /* =======================================================
     INITIAL DATA
  ======================================================= */

  useEffect(() => {

    if (!department) {
      return;
    }

    setName(
      department.name || ""
    );

    setDescription(
      department.description || ""
    );

    setError("");

    setFieldErrors({});

  }, [
    department,
  ]);


  /* =======================================================
     VALIDATION
  ======================================================= */

  function validate() {

    const errors = {};

    const trimmedName =
      name.trim();

    const trimmedDescription =
      description.trim();


    if (!trimmedName) {

      errors.name =
        "Tên phòng ban không được để trống.";

    } else if (
      trimmedName.length < 2
    ) {

      errors.name =
        "Tên phòng ban phải có ít nhất 2 ký tự.";

    } else if (
      trimmedName.length > 100
    ) {

      errors.name =
        "Tên phòng ban không được vượt quá 100 ký tự.";

    }


    if (
      trimmedDescription.length > 500
    ) {

      errors.description =
        "Mô tả không được vượt quá 500 ký tự.";

    }


    setFieldErrors(
      errors
    );

    return (
      Object.keys(errors).length === 0
    );
  }


  /* =======================================================
     CHANGE HANDLERS
  ======================================================= */

  function handleNameChange(
    event
  ) {

    setName(
      event.target.value
    );

    if (
      fieldErrors.name
    ) {

      setFieldErrors(
        (current) => ({
          ...current,
          name: undefined,
        })
      );

    }

    if (error) {
      setError("");
    }

  }


  function handleDescriptionChange(
    event
  ) {

    setDescription(
      event.target.value
    );

    if (
      fieldErrors.description
    ) {

      setFieldErrors(
        (current) => ({
          ...current,
          description: undefined,
        })
      );

    }

    if (error) {
      setError("");
    }

  }


  /* =======================================================
     SUBMIT
  ======================================================= */

  async function handleSubmit(
    event
  ) {

    event.preventDefault();

    if (
      loading ||
      !department?.id
    ) {
      return;
    }


    setError("");


    if (!validate()) {
      return;
    }


    try {

      setLoading(true);


      const data = {
        name: name.trim(),
        description: description.trim(),
      };


      const updatedDepartment =
        await updateDepartment(
          department.id,
          data
        );


      if (onUpdated) {
  await onUpdated(updatedDepartment);
} else {

        onClose?.();

      }

    } catch (error) {

      console.error(
        "Không thể cập nhật phòng ban:",
        error
      );


      const responseData =
        error?.response?.data;


      /* ===============================================
         BACKEND VALIDATION ERRORS
      =============================================== */

      if (
        responseData?.errors
      ) {

        const backendErrors =
          responseData.errors;

        const normalizedErrors = {};


        Object.entries(
          backendErrors
        ).forEach(
          ([
            key,
            messages,
          ]) => {

            const field =
              key.toLowerCase();


            const message =
              Array.isArray(messages)
                ? messages[0]
                : String(messages);


            if (
              field === "name"
            ) {

              normalizedErrors.name =
                message;

            }


            if (
              field === "description"
            ) {

              normalizedErrors.description =
                message;

            }

          }
        );


        if (
          Object.keys(
            normalizedErrors
          ).length > 0
        ) {

          setFieldErrors(
            normalizedErrors
          );

        } else {

          setError(
            responseData?.message ||
              "Không thể cập nhật phòng ban."
          );

        }

      } else {

        setError(
          responseData?.message ||
            "Không thể cập nhật phòng ban."
        );

      }

    } finally {

      setLoading(
        false
      );

    }

  }


  /* =======================================================
     CLOSE
  ======================================================= */

  function handleClose() {

    if (loading) {
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
      className="admin-department-modal-overlay"
      onMouseDown={
        handleOverlayMouseDown
      }
    >

      <div
        className="admin-department-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-department-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="admin-department-modal-header">

          <div className="admin-department-modal-title">

            <div className="admin-department-modal-icon">
              <BuildingIcon />
            </div>

            <div>

              <h2
                id="edit-department-title"
              >
                Chỉnh sửa phòng ban
              </h2>

              <p>
                Cập nhật thông tin phòng ban
              </p>

            </div>

          </div>


          <button
            type="button"
            className="admin-department-modal-close"
            onClick={
              handleClose
            }
            disabled={
              loading
            }
            aria-label="Đóng"
          >
            <CloseIcon />
          </button>

        </div>


        {/* =================================================
            FORM
        ================================================= */}

        <form
          className="admin-department-form"
          onSubmit={
            handleSubmit
          }
        >

          {/* ===============================================
              ERROR
          =============================================== */}

          {error && (
            <div
              className="admin-department-form-error"
              role="alert"
            >

              <span>
                !
              </span>

              <p>
                {error}
              </p>

            </div>
          )}


          {/* ===============================================
              DEPARTMENT ID
          =============================================== */}

          <div className="admin-department-form-reference">

            <span>
              Department ID
            </span>

            <strong>
              #{department.id}
            </strong>

          </div>


          {/* ===============================================
              NAME
          =============================================== */}

          <div className="admin-department-form-group">

            <label htmlFor="edit-department-name">

              Tên phòng ban

              <span>
                *
              </span>

            </label>


            <input
              id="edit-department-name"
              type="text"
              value={
                name
              }
              onChange={
                handleNameChange
              }
              placeholder="Ví dụ: Phòng Kỹ thuật"
              maxLength={100}
              disabled={
                loading
              }
              autoFocus
              aria-invalid={
                !!fieldErrors.name
              }
              aria-describedby={
                fieldErrors.name
                  ? "edit-department-name-error"
                  : undefined
              }
            />


            <div className="admin-department-form-meta">

              {fieldErrors.name ? (

                <span
                  id="edit-department-name-error"
                  className="admin-department-field-error"
                >
                  {
                    fieldErrors.name
                  }
                </span>

              ) : (

                <span>
                  Tên phòng ban được sử dụng trong hệ thống.
                </span>

              )}


              <span>
                {name.length}/100
              </span>

            </div>

          </div>


          {/* ===============================================
              DESCRIPTION
          =============================================== */}

          <div className="admin-department-form-group">

            <label htmlFor="edit-department-description">

              Mô tả

              <span className="optional">
                Không bắt buộc
              </span>

            </label>


            <textarea
              id="edit-department-description"
              value={
                description
              }
              onChange={
                handleDescriptionChange
              }
              placeholder="Nhập mô tả cho phòng ban..."
              rows={4}
              maxLength={500}
              disabled={
                loading
              }
              aria-invalid={
                !!fieldErrors.description
              }
              aria-describedby={
                fieldErrors.description
                  ? "edit-department-description-error"
                  : undefined
              }
            />


            <div className="admin-department-form-meta">

              {fieldErrors.description ? (

                <span
                  id="edit-department-description-error"
                  className="admin-department-field-error"
                >
                  {
                    fieldErrors.description
                  }
                </span>

              ) : (

                <span>
                  Cập nhật mô tả của phòng ban.
                </span>

              )}


              <span>
                {description.length}/500
              </span>

            </div>

          </div>


          {/* ===============================================
              STATUS
          =============================================== */}

          <div className="admin-department-edit-status">

            <span className="admin-department-edit-status-label">
              Trạng thái hiện tại
            </span>


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


            <span className="admin-department-edit-status-hint">
              Trạng thái được quản lý bằng nút
              Khóa/Mở ở danh sách phòng ban.
            </span>

          </div>


          {/* ===============================================
              ACTIONS
          =============================================== */}

          <div className="admin-department-modal-actions">

            <button
              type="button"
              className="admin-department-modal-cancel"
              onClick={
                handleClose
              }
              disabled={
                loading
              }
            >
              Hủy
            </button>


            <button
              type="submit"
              className="admin-department-modal-submit"
              disabled={
                loading
              }
            >

              {loading ? (

                <>
                  <span className="admin-department-button-spinner" />

                  Đang lưu...
                </>

              ) : (

                <>
                  <SaveIcon />

                  Lưu thay đổi
                </>

              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}