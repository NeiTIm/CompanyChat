import { useEffect, useState } from "react";

/* =========================================================
   EDIT GROUP SCOPE MODAL
========================================================= */

function EditGroupScopeModal({
  open = false,
  groupScope = null,
  loading = false,
  onClose,
  onSubmit,
  error = "",
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState("");

  /* =========================================================
     LOAD GROUP SCOPE DATA
  ========================================================= */

  useEffect(() => {
    if (!open || !groupScope) {
      return;
    }

    setName(groupScope.name ?? "");
    setDescription(groupScope.description ?? "");
    setValidationError("");
  }, [open, groupScope]);

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

    if (!groupScope?.id) {
      setValidationError(
        "Không xác định được Group Scope cần chỉnh sửa."
      );
      return;
    }

    setValidationError("");

    /* -------------------------------------------------------
       SUBMIT TO PARENT
    ------------------------------------------------------- */

    await onSubmit?.({
      id: groupScope.id,
      name: trimmedName,
      description: trimmedDescription || null,
    });
  };

  /* =========================================================
     DON'T RENDER
  ========================================================= */

  if (!open || !groupScope) {
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
        aria-labelledby="edit-group-scope-title"
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
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </div>

            <div>
              <h2 id="edit-group-scope-title">
                Chỉnh sửa Group Scope
              </h2>

              <p>
                Cập nhật thông tin của Group Scope.
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
                GROUP SCOPE ID
            ================================================= */}

            <div className="scope-group-edit-id">
              <span>ID Group Scope</span>

              <strong>#{groupScope.id}</strong>
            </div>

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
                  <line
                    x1="12"
                    y1="8"
                    x2="12"
                    y2="12"
                  />
                  <line
                    x1="12"
                    y1="16"
                    x2="12.01"
                    y2="16"
                  />
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
                  <line
                    x1="12"
                    y1="8"
                    x2="12"
                    y2="12"
                  />
                  <line
                    x1="12"
                    y1="16"
                    x2="12.01"
                    y2="16"
                  />
                </svg>

                <span>{validationError}</span>
              </div>
            )}

            {/* =================================================
                NAME
            ================================================= */}

            <div className="form-group">
              <label htmlFor="edit-group-scope-name">
                Tên Group Scope
                <span className="required-mark">*</span>
              </label>

              <input
                id="edit-group-scope-name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);

                  if (validationError) {
                    setValidationError("");
                  }
                }}
                placeholder="Nhập tên Group Scope"
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
              <label htmlFor="edit-group-scope-description">
                Mô tả
              </label>

              <textarea
                id="edit-group-scope-description"
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
                  Đang lưu...
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
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>

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

export default EditGroupScopeModal;