import {
  useEffect,
  useState,
} from "react";

import {
  createDepartment,
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


/* =========================================================
   COMPONENT
========================================================= */

export default function CreateDepartmentModal({
  onClose,
  onCreated,
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
     RESET ERROR
  ======================================================= */

  useEffect(() => {
    if (error) {
      setError("");
    }

    if (Object.keys(fieldErrors).length > 0) {
      setFieldErrors({});
    }
  }, [
    name,
    description,
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
     SUBMIT
  ======================================================= */

  async function handleSubmit(
    event
  ) {

    event.preventDefault();

    if (loading) {
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


      const createdDepartment =
        await createDepartment(
          data
        );


      if (onCreated) {
  await onCreated(createdDepartment);
} else {
        onClose?.();
      }

    } catch (error) {

      console.error(
        "Không thể tạo phòng ban:",
        error
      );


      const responseData =
        error?.response?.data;


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
              "Không thể tạo phòng ban."
          );

        }

      } else {

        setError(
          responseData?.message ||
            "Không thể tạo phòng ban."
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
     KEYBOARD
  ======================================================= */

  function handleOverlayClick(
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

  return (
    <div
      className="admin-department-modal-overlay"
      onMouseDown={
        handleOverlayClick
      }
    >

      <div
        className="admin-department-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-department-title"
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
                id="create-department-title"
              >
                Thêm phòng ban
              </h2>

              <p>
                Tạo phòng ban mới trong hệ thống
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
              NAME
          =============================================== */}

          <div className="admin-department-form-group">

            <label htmlFor="department-name">
              Tên phòng ban
              <span>
                *
              </span>
            </label>


            <input
              id="department-name"
              type="text"
              value={
                name
              }
              onChange={(
                event
              ) =>
                setName(
                  event.target.value
                )
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
                  ? "department-name-error"
                  : undefined
              }
            />


            <div className="admin-department-form-meta">

              {fieldErrors.name ? (

                <span
                  id="department-name-error"
                  className="admin-department-field-error"
                >
                  {fieldErrors.name}
                </span>

              ) : (

                <span>
                  Tên phòng ban sẽ được hiển thị trong hệ thống.
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

            <label htmlFor="department-description">
              Mô tả
              <span className="optional">
                Không bắt buộc
              </span>
            </label>


            <textarea
              id="department-description"
              value={
                description
              }
              onChange={(
                event
              ) =>
                setDescription(
                  event.target.value
                )
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
                  ? "department-description-error"
                  : undefined
              }
            />


            <div className="admin-department-form-meta">

              {fieldErrors.description ? (

                <span
                  id="department-description-error"
                  className="admin-department-field-error"
                >
                  {fieldErrors.description}
                </span>

              ) : (

                <span>
                  Có thể bổ sung hoặc thay đổi sau.
                </span>

              )}


              <span>
                {description.length}/500
              </span>

            </div>

          </div>


          {/* ===============================================
              INFO
          =============================================== */}

          <div className="admin-department-form-info">

            <div className="admin-department-form-info-icon">
              i
            </div>

            <p>
              Phòng ban mới sẽ được tạo ở trạng thái
              <strong> Hoạt động</strong>.
            </p>

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

                  Đang tạo...
                </>
              ) : (
                <>
                  <BuildingIcon />

                  Tạo phòng ban
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}