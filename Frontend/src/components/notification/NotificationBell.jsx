import { useState } from "react";

import NotificationDropdown from "./NotificationDropdown";


/* =========================================================
   BELL ICON
========================================================= */

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}


/* =========================================================
   NOTIFICATION BELL
========================================================= */

function NotificationBell({
  notifications,
  unreadCount,
  loading,
  onNotificationClick,
  onMarkAllAsRead,
}) {
  const [open, setOpen] =
    useState(false);


  function handleToggle() {
    setOpen(
      (current) => !current
    );
  }


  return (
    <div className="notification-container">

      {/* =================================================
          BELL BUTTON
      ================================================= */}

      <button
        type="button"
        className={`notification-bell-button ${
          open ? "active" : ""
        }`}
        onClick={
          handleToggle
        }
        aria-label="Thông báo"
      >

        <BellIcon />


        {/* ===============================================
            UNREAD BADGE
        =============================================== */}

        {unreadCount > 0 && (

          <span className="notification-badge">

            {unreadCount > 99
              ? "99+"
              : unreadCount}

          </span>

        )}

      </button>


      {/* =================================================
          DROPDOWN
      ================================================= */}

      {open && (

        <NotificationDropdown
          notifications={
            notifications
          }

          unreadCount={
            unreadCount
          }

          loading={
            loading
          }

          onNotificationClick={
            onNotificationClick
          }

          onMarkAllAsRead={
            onMarkAllAsRead
          }

        />

      )}

    </div>
  );
}

export default NotificationBell;