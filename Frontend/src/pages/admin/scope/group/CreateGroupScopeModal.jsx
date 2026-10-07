import { useEffect, useState } from "react";

/* =========================================================
   CREATE GROUP SCOPE MODAL
========================================================= */

function CreateGroupScopeModal({
  open = false,
  loading = false,
  onClose,
  onSubmit,
  error = "",
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState("");

  /* =========================================================
     RESET FORM WHEN MODAL OPENS
  ========================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    setName("");
    setDescription("");
    setValidationError("");
  }, [open]);

  /* =========================================================
     CLOSE
  ========================================================= */

  const handleClose = () => {
    if (loading) {
      return;
    }

    onClose?.();
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    if (!trimmedName) {
      setValidationError("Vui lòng nhập tên Group Scope.");
      return;
    }

    if (trimmedName.length > 100) {
      setValidationError(
        "Tên Group Scope không được vượt quá 100 ký tự."
      );
      return;
    }

    if (trimmedDescription.length > 500) {
      setValidationError(
        "Mô tả không được vượt quá 500 ký tự."
      );
      return;
    }

    setValidationError("");

    /* -------------------------------------------------------
       SUBMIT TO PARENT
    ------------------------------------------------------- */

    await onSubmit?.({
      name: trimmedName,
      description: trimmedDescription || null,
    });
  };

  /* =========================================================
     DON'T RENDER
  ========================================================= */

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="modal-dialog scope-group-create-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-group-scope-title"
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-header-icon">
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>

            <div>
              <h2 id="create-group-scope-title">
                Tạo Group Scope
              </h2>

              <p>
                Tạo một nhóm phạm vi để quản lý quyền truy cập
                Department.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Đóng"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* =================================================
                API ERROR
            ================================================= */}

            {error && (
              <div className="scope-group-modal-error">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>

                <span>{error}</span>
              </div>
            )}

            {/* =================================================
                VALIDATION ERROR
            ================================================= */}

            {validationError && (
              <div className="scope-group-modal-error">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>

                <span>{validationError}</span>
              </div>
            )}

            {/* =================================================
                NAME
            ================================================= */}

            <div className="form-group">
              <label htmlFor="group-scope-name">
                Tên Group Scope
                <span className="required-mark">*</span>
              </label>

              <input
                id="group-scope-name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);

                  if (validationError) {
                    setValidationError("");
                  }
                }}
                placeholder="Ví dụ: Quản lý phòng Kinh doanh"
                maxLength={100}
                disabled={loading}
                autoFocus
              />

              <div className="form-field-footer">
                <span>
                  Tên dùng để nhận diện Group Scope.
                </span>

                <span>
                  {name.length}/100
                </span>
              </div>
            </div>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <div className="form-group">
              <label htmlFor="group-scope-description">
                Mô tả
              </label>

              <textarea
                id="group-scope-description"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);

                  if (validationError) {
                    setValidationError("");
                  }
                }}
                placeholder="Mô tả mục đích sử dụng của Group Scope..."
                rows={5}
                maxLength={500}
                disabled={loading}
              />

              <div className="form-field-footer">
                <span>
                  Không bắt buộc.
                </span>

                <span>
                  {description.length}/500
                </span>
              </div>
            </div>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="modal-footer">
            <button
              type="button"
              className="modal-button modal-button-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Hủy
            </button>

            <button
              type="submit"
              className="modal-button modal-button-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    width="17"
                    height="17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line
                      x1="12"
                      y1="5"
                      x2="12"
                      y2="19"
                    />
                    <line
                      x1="5"
                      y1="12"
                      x2="19"
                      y2="12"
                    />
                  </svg>

                  Tạo Group Scope
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroupScopeModal;