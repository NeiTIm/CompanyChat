import {
  useEffect,
  useState,
} from "react";

import {
  createRole,
} from "../../../services/admin/roleService";


export default function CreateRoleModal({
  open,
  onClose,
  onCreated,
  canCreate,
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
     RESET
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    setName("");
    setDescription("");
    setError("");
    setLoading(false);
  }, [open]);


  /* =======================================================
     CLOSE
  ======================================================= */

  function handleClose() {
    if (loading) {
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

    if (!canCreate) {
      return;
    }

    const trimmedName =
      name.trim();

    const trimmedDescription =
      description.trim();


    /* ================================================
       VALIDATION
    ================================================ */

    if (!trimmedName) {
      setError(
        "Vui lòng nhập tên Role."
      );

      return;
    }

    if (trimmedName.length > 100) {
      setError(
        "Tên Role không được vượt quá 100 ký tự."
      );

      return;
    }

    if (trimmedDescription.length > 500) {
      setError(
        "Mô tả không được vượt quá 500 ký tự."
      );

      return;
    }


    try {
      setLoading(true);
      setError("");

      await createRole({
        name:
          trimmedName,

        description:
          trimmedDescription,
      });

      onCreated();

    } catch (error) {
      console.error(
        "Không thể tạo Role:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Không thể tạo Role."
      );

    } finally {
      setLoading(false);
    }
  }


  /* =======================================================
     NO RENDER
  ======================================================= */

  if (!open) {
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
        aria-labelledby="create-role-title"
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="admin-role-modal-header">

          <div>

            <h2 id="create-role-title">
              Tạo Role mới
            </h2>

            <p>
              Tạo một vai trò mới cho hệ thống.
            </p>

          </div>


          <button
            type="button"
            className="admin-role-modal-close"
            onClick={
              handleClose
            }
            disabled={
              loading
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


            {/* NAME */}

            <div className="admin-role-form-group">

              <label htmlFor="create-role-name">
                Tên Role
                <span className="required">
                  *
                </span>
              </label>

              <input
                id="create-role-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="Ví dụ: Content Manager"
                maxLength={100}
                disabled={
                  loading
                }
                autoFocus
              />

              <div className="admin-role-form-hint">
                {name.length}/100 ký tự
              </div>

            </div>


            {/* DESCRIPTION */}

            <div className="admin-role-form-group">

              <label htmlFor="create-role-description">
                Mô tả
              </label>

              <textarea
                id="create-role-description"
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
                loading
              }
            >
              Hủy
            </button>

            <button
              type="submit"
              className="admin-role-modal-submit"
              disabled={
                loading ||
                !canCreate
              }
            >
              {loading
                ? "Đang tạo..."
                : "Tạo Role"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}