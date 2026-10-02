import { useEffect, useState } from "react";
import Avatar from "../common/Avatar";
import { createGroup } from "../../services/conversationService";

/* =========================================================
   CLOSE ICON
========================================================= */

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

/* =========================================================
   SEARCH ICON
========================================================= */

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
      />

      <path d="m16 16 4 4" />
    </svg>
  );
}

/* =========================================================
   CHECK ICON
========================================================= */

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

/* =========================================================
   CREATE GROUP MODAL
========================================================= */

function CreateGroupModal({
  users,
  currentUser,
  onClose,
  onCreated,
}) {
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =======================================================
     RESET
  ======================================================= */

  useEffect(() => {
    setGroupName("");
    setSearch("");
    setSelectedUserIds([]);
    setError("");
  }, []);

  /* =======================================================
     FILTER USERS
  ======================================================= */

  const filteredUsers = users.filter((user) => {
    if (
      Number(user.id) ===
      Number(currentUser?.id)
    ) {
      return false;
    }

    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      user.fullName
        ?.toLowerCase()
        .includes(keyword) ||
      user.username
        ?.toLowerCase()
        .includes(keyword)
    );
  });

  /* =======================================================
     SELECT USER
  ======================================================= */

  function handleToggleUser(userId) {
    setSelectedUserIds((current) => {
      const id = Number(userId);

      if (current.includes(id)) {
        return current.filter(
          (item) => item !== id
        );
      }

      return [
        ...current,
        id,
      ];
    });
  }

  /* =======================================================
     CREATE GROUP
  ======================================================= */

  async function handleCreate() {
    setError("");

    const name = groupName.trim();

    if (!name) {
      setError(
        "Vui lòng nhập tên nhóm."
      );

      return;
    }

    if (selectedUserIds.length === 0) {
      setError(
        "Vui lòng chọn ít nhất một thành viên."
      );

      return;
    }

    try {
      setLoading(true);

      const result = await createGroup(
        name,
        selectedUserIds
      );

      const createdGroup =
        result?.group ||
        result?.data ||
        result;

      await onCreated?.(
        createdGroup
      );
    } catch (error) {
      console.error(
        "Create group error:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Không thể tạo nhóm."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     KEYBOARD
  ======================================================= */

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      if (!loading) {
        onClose();
      }
    }

    if (
      event.key === "Enter" &&
      event.ctrlKey
    ) {
      handleCreate();
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="create-group-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          if (!loading) {
            onClose();
          }
        }
      }}
    >
      <div
        className="create-group-modal"
        onKeyDown={handleKeyDown}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="create-group-header">
          <div>
            <div className="create-group-title">
              Tạo nhóm mới
            </div>

            <div className="create-group-subtitle">
              Chọn thành viên để bắt đầu cuộc trò chuyện
            </div>
          </div>

          <button
            type="button"
            className="create-group-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Đóng"
          >
            <CloseIcon />
          </button>
        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <div className="create-group-body">
          {/* =================================================
              GROUP NAME
          ================================================= */}

          <div className="create-group-field">
            <label>
              Tên nhóm
            </label>

            <input
              type="text"
              value={groupName}
              onChange={(event) =>
                setGroupName(
                  event.target.value
                )
              }
              placeholder="Ví dụ: Team Development"
              maxLength={100}
              autoFocus
              disabled={loading}
            />
          </div>

          {/* =================================================
              SELECTED COUNT
          ================================================= */}

          <div className="create-group-member-heading">
            <div>
              Thành viên
            </div>

            <span>
              {selectedUserIds.length} đã chọn
            </span>
          </div>

          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="create-group-search">
            <span>
              <SearchIcon />
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Tìm nhân viên..."
              disabled={loading}
            />
          </div>

          {/* =================================================
              USER LIST
          ================================================= */}

          <div className="create-group-user-list">
            {filteredUsers.map((user) => {
              const userId = Number(
                user.id
              );

              const selected =
                selectedUserIds.includes(
                  userId
                );

              return (
                <button
                  key={userId}
                  type="button"
                  className={`create-group-user ${
                    selected
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleToggleUser(
                      userId
                    )
                  }
                  disabled={loading}
                >
                  <Avatar
                    user={user}
                    size="medium"
                    showStatus
                  />

                  <div className="create-group-user-info">
                    <div className="create-group-user-name">
                      {user.fullName ||
                        user.username}
                    </div>

                    <div className="create-group-user-username">
                      @{user.username}
                    </div>
                  </div>

                  <div
                    className={`create-group-checkbox ${
                      selected
                        ? "checked"
                        : ""
                    }`}
                  >
                    {selected && (
                      <CheckIcon />
                    )}
                  </div>
                </button>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="create-group-empty">
                Không tìm thấy nhân viên.
              </div>
            )}
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="create-group-error">
              {error}
            </div>
          )}
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="create-group-footer">
          <button
            type="button"
            className="create-group-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </button>

          <button
            type="button"
            className="create-group-submit"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading
              ? "Đang tạo..."
              : "Tạo nhóm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateGroupModal;