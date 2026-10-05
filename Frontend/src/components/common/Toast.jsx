import { useEffect } from "react";

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.3 3.8 2.5 17.5A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.5L13.7 3.8a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

const DEFAULT_TITLES = {
  success: "Thành công",
  error: "Có lỗi xảy ra",
  warning: "Cảnh báo",
  info: "Thông báo",
};

export default function Toast({
  type = "success",
  message = "",
  title,
  duration = 3000,
  onClose,
}) {
  /*
   * =========================================================
   * AUTO CLOSE
   * =========================================================
   *
   * Toast sẽ tự động gọi onClose sau duration milliseconds.
   *
   * Mặc định:
   * 3000ms = 3 giây
   */

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    if (duration <= 0) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [message, duration, onClose]);

  const normalizedType = [
    "success",
    "error",
    "warning",
    "info",
  ].includes(type)
    ? type
    : "info";

  function renderIcon() {
    switch (normalizedType) {
      case "success":
        return <CheckIcon />;

      case "error":
        return <ErrorIcon />;

      case "warning":
        return <WarningIcon />;

      case "info":
        return <InfoIcon />;

      default:
        return <InfoIcon />;
    }
  }

  if (!message) {
    return null;
  }

  return (
    <div
      className={`admin-toast admin-toast-${normalizedType}`}
      role={normalizedType === "error" ? "alert" : "status"}
      aria-live={
        normalizedType === "error"
          ? "assertive"
          : "polite"
      }
    >
      {/* =====================================================
          ICON
      ===================================================== */}

      <div className="admin-toast-icon">
        {renderIcon()}
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="admin-toast-content">
        <strong>
          {title || DEFAULT_TITLES[normalizedType]}
        </strong>

        <span>
          {message}
        </span>
      </div>

      {/* =====================================================
          CLOSE
      ===================================================== */}

      <button
        type="button"
        className="admin-toast-close"
        onClick={onClose}
        aria-label="Đóng thông báo"
      >
        <CloseIcon />
      </button>
    </div>
  );
}