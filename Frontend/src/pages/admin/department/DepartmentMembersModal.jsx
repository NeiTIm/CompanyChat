import {
  useEffect,
  useState,
} from "react";

import {
  getDepartmentMembers,
  getAvailableDepartmentMembers,
  addDepartmentMember,
  removeDepartmentMember,
  bulkAddDepartmentMembers,
  bulkRemoveDepartmentMembers,
} from "../../../services/admin/departmentService";

import Toast from "../../../components/common/Toast";


/* =========================================================
   ICONS
========================================================= */

function UsersIcon() {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />

      <circle
        cx="9"
        cy="7"
        r="4"
      />

      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />

      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}


function SearchIcon() {
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
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m20 20-3.5-3.5" />
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


function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />

      <path d="M5 12h14" />
    </svg>
  );
}


function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />

      <path d="M8 6V4h8v2" />

      <path d="M19 6l-1 15H6L5 6" />

      <path d="M10 11v6" />

      <path d="M14 11v6" />
    </svg>
  );
}


function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}


function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}


function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11a8.1 8.1 0 0 0-14.8-4.5L4 8" />

      <path d="M4 4v4h4" />

      <path d="M4 13a8.1 8.1 0 0 0 14.8 4.5L20 16" />

      <path d="M20 20v-4h-4" />
    </svg>
  );
}


/* =========================================================
   HELPERS
========================================================= */

function getUserId(user) {
  return user?.userId ?? user?.id ?? null;
}


function getUserInitials(user) {
  const name =
    user?.fullName ||
    user?.username ||
    "?";

  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}


function getUserName(user) {
  return (
    user?.fullName ||
    user?.username ||
    "Không xác định"
  );
}


function getResponseItems(data) {
  if (
    Array.isArray(data)
  ) {
    return data;
  }

  return (
    data?.items ||
    data?.data ||
    []
  );
}


function getResponseTotal(
  data,
  items,
) {
  if (
    typeof data?.total ===
    "number"
  ) {
    return data.total;
  }

  if (
    typeof data?.totalCount ===
    "number"
  ) {
    return data.totalCount;
  }

  return items.length;
}


function getResponseTotalPages(
  data,
  total,
  pageSize,
) {
  if (
    typeof data?.totalPages ===
    "number"
  ) {
    return Math.max(
      data.totalPages,
      1,
    );
  }

  return Math.max(
    Math.ceil(
      total / pageSize,
    ),
    1,
  );
}


/* =========================================================
   COMPONENT
========================================================= */

export default function DepartmentMembersModal({
  department,
  onClose,
}) {

  /* =======================================================
     CURRENT MEMBERS
  ======================================================= */

  const [members, setMembers] =
    useState([]);

  const [memberSearch, setMemberSearch] =
    useState("");

  const [memberPage, setMemberPage] =
    useState(1);

  const [memberTotal, setMemberTotal] =
    useState(0);

  const [memberTotalPages, setMemberTotalPages] =
    useState(1);


  /* =======================================================
     AVAILABLE MEMBERS
  ======================================================= */

  const [availableMembers, setAvailableMembers] =
    useState([]);

  const [availableSearch, setAvailableSearch] =
    useState("");

  const [availablePage, setAvailablePage] =
    useState(1);

  const [availableTotal, setAvailableTotal] =
    useState(0);

  const [availableTotalPages, setAvailableTotalPages] =
    useState(1);


  /* =======================================================
     SELECTION
  ======================================================= */

  const [selectedMemberIds, setSelectedMemberIds] =
    useState([]);

  const [selectedAvailableIds, setSelectedAvailableIds] =
    useState([]);


  /* =======================================================
     STATE
  ======================================================= */

  const [loadingMembers, setLoadingMembers] =
    useState(true);

  const [loadingAvailable, setLoadingAvailable] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("members");

  const [toast, setToast] =
    useState(null);


  const pageSize = 20;


  /* =======================================================
     TOAST
  ======================================================= */

  function showToast(
    type,
    message,
    duration = 3000,
  ) {
    setToast({
      id: Date.now(),
      type,
      message,
      duration,
    });
  }


  function closeToast() {
    setToast(null);
  }


  /* =======================================================
     LOAD MEMBERS
  ======================================================= */

  async function loadMembers(
    customPage = memberPage,
    customSearch = memberSearch,
  ) {
    if (!department?.id) {
      return;
    }

    try {
      setLoadingMembers(true);
      setError("");

      const data =
        await getDepartmentMembers(
          department.id,
          {
            search:
              customSearch.trim(),

            page:
              customPage,

            pageSize,
          },
        );

      const items =
        getResponseItems(data);

      const total =
        getResponseTotal(
          data,
          items,
        );

      const totalPages =
        getResponseTotalPages(
          data,
          total,
          pageSize,
        );

      setMembers(items);
      setMemberTotal(total);
      setMemberTotalPages(totalPages);

    } catch (error) {
      console.error(
        "Không thể tải thành viên phòng ban:",
        error,
      );

      setError(
        error?.response?.data?.message ||
          "Không thể tải danh sách thành viên.",
      );
    } finally {
      setLoadingMembers(false);
    }
  }


  /* =======================================================
     LOAD AVAILABLE MEMBERS
  ======================================================= */

  async function loadAvailableMembers(
    customPage = availablePage,
    customSearch = availableSearch,
  ) {
    if (!department?.id) {
      return;
    }

    try {
      setLoadingAvailable(true);
      setError("");

      const data =
        await getAvailableDepartmentMembers(
          department.id,
          {
            search:
              customSearch.trim(),

            page:
              customPage,

            pageSize,
          },
        );

      const items =
        getResponseItems(data);

      const total =
        getResponseTotal(
          data,
          items,
        );

      const totalPages =
        getResponseTotalPages(
          data,
          total,
          pageSize,
        );

      setAvailableMembers(items);
      setAvailableTotal(total);
      setAvailableTotalPages(totalPages);

    } catch (error) {
      console.error(
        "Không thể tải nhân viên có thể thêm:",
        error,
      );

      setError(
        error?.response?.data?.message ||
          "Không thể tải danh sách nhân viên.",
      );
    } finally {
      setLoadingAvailable(false);
    }
  }


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadMembers(1, "");
    loadAvailableMembers(1, "");
  }, [department?.id]);


  /* =======================================================
     SEARCH MEMBERS
  ======================================================= */

  function handleMemberSearchSubmit(event) {
    event.preventDefault();

    setMemberPage(1);
    setSelectedMemberIds([]);

    loadMembers(
      1,
      memberSearch,
    );
  }


  function handleClearMemberSearch() {
    setMemberSearch("");
    setMemberPage(1);
    setSelectedMemberIds([]);

    loadMembers(
      1,
      "",
    );
  }


  /* =======================================================
     SEARCH AVAILABLE
  ======================================================= */

  function handleAvailableSearchSubmit(event) {
    event.preventDefault();

    setAvailablePage(1);
    setSelectedAvailableIds([]);

    loadAvailableMembers(
      1,
      availableSearch,
    );
  }


  function handleClearAvailableSearch() {
    setAvailableSearch("");
    setAvailablePage(1);
    setSelectedAvailableIds([]);

    loadAvailableMembers(
      1,
      "",
    );
  }


  /* =======================================================
     SELECT MEMBER
  ======================================================= */

  function toggleMemberSelection(userId) {
    setSelectedMemberIds(
      (current) =>
        current.includes(userId)
          ? current.filter(
              (id) =>
                id !== userId,
            )
          : [
              ...current,
              userId,
            ],
    );
  }


  /* =======================================================
     SELECT AVAILABLE MEMBER
  ======================================================= */

  function toggleAvailableSelection(userId) {
    setSelectedAvailableIds(
      (current) =>
        current.includes(userId)
          ? current.filter(
              (id) =>
                id !== userId,
            )
          : [
              ...current,
              userId,
            ],
    );
  }


  /* =======================================================
     SELECT ALL CURRENT PAGE
  ======================================================= */

  function toggleAllMembers() {
    const removableMembers =
      members;

    const removableIds =
      removableMembers
        .map(
          (member) =>
            getUserId(member),
        )
        .filter(
          (id) =>
            id !== null,
        );

    const allSelected =
      removableIds.length > 0 &&
      removableIds.every(
        (id) =>
          selectedMemberIds.includes(
            id,
          ),
      );

    if (allSelected) {
      setSelectedMemberIds(
        (current) =>
          current.filter(
            (id) =>
              !removableIds.includes(
                id,
              ),
          ),
      );
    } else {
      setSelectedMemberIds(
        (current) => [
          ...new Set([
            ...current,
            ...removableIds,
          ]),
        ],
      );
    }
  }


  /* =======================================================
     SELECT ALL AVAILABLE PAGE
  ======================================================= */

  function toggleAllAvailable() {
    const ids =
      availableMembers
        .map(
          (member) =>
            getUserId(member),
        )
        .filter(
          (id) =>
            id !== null,
        );

    const allSelected =
      ids.length > 0 &&
      ids.every(
        (id) =>
          selectedAvailableIds.includes(
            id,
          ),
      );

    if (allSelected) {
      setSelectedAvailableIds(
        (current) =>
          current.filter(
            (id) =>
              !ids.includes(id),
          ),
      );
    } else {
      setSelectedAvailableIds(
        (current) => [
          ...new Set([
            ...current,
            ...ids,
          ]),
        ],
      );
    }
  }


  /* =======================================================
     ADD ONE MEMBER
  ======================================================= */

  async function handleAddMember(userId) {
    if (actionLoading) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await addDepartmentMember(
        department.id,
        userId,
      );

      setSelectedAvailableIds(
        (current) =>
          current.filter(
            (id) =>
              id !== userId,
          ),
      );

      await Promise.all([
        loadMembers(
          memberPage,
          memberSearch,
        ),

        loadAvailableMembers(
          availablePage,
          availableSearch,
        ),
      ]);

      showToast(
        "success",
        "Đã thêm nhân viên vào phòng ban.",
      );

    } catch (error) {
      console.error(
        "Không thể thêm thành viên:",
        error,
      );

      showToast(
        "error",
        error?.response?.data?.message ||
          "Không thể thêm thành viên.",
      );
    } finally {
      setActionLoading(false);
    }
  }


  /* =======================================================
     ADD SELECTED MEMBERS
  ======================================================= */

  async function handleBulkAdd() {
    if (
      actionLoading ||
      selectedAvailableIds.length === 0
    ) {
      return;
    }

    const count =
      selectedAvailableIds.length;

    try {
      setActionLoading(true);
      setError("");

      await bulkAddDepartmentMembers(
        department.id,
        selectedAvailableIds,
      );

      setSelectedAvailableIds([]);

      await Promise.all([
        loadMembers(
          memberPage,
          memberSearch,
        ),

        loadAvailableMembers(
          availablePage,
          availableSearch,
        ),
      ]);

      showToast(
        "success",
        `Đã thêm ${count} nhân viên vào phòng ban.`,
      );

    } catch (error) {
      console.error(
        "Không thể thêm nhiều thành viên:",
        error,
      );

      showToast(
        "error",
        error?.response?.data?.message ||
          "Không thể thêm các thành viên đã chọn.",
      );
    } finally {
      setActionLoading(false);
    }
  }


  /* =======================================================
     REMOVE ONE MEMBER
  ======================================================= */

  async function handleRemoveMember(userId) {
    if (actionLoading) {
      return;
    }

    const member =
      members.find(
        (item) =>
          getUserId(item) === userId,
      );

    if (!member) {
      return;
    }

    const memberName =
      getUserName(member);

    const removeType =
      member.isPrimary
        ? "phòng ban chính"
        : "phòng ban này";

    const confirmed =
      window.confirm(
        member.isPrimary
          ? `Bạn có chắc muốn xóa "${memberName}" khỏi phòng ban chính này?\n\nPhòng ban chính của nhân viên sẽ được đặt thành trống.`
          : `Bạn có chắc muốn xóa "${memberName}" khỏi phòng ban này?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await removeDepartmentMember(
        department.id,
        userId,
      );

      setSelectedMemberIds(
        (current) =>
          current.filter(
            (id) =>
              id !== userId,
          ),
      );

      await Promise.all([
        loadMembers(
          memberPage,
          memberSearch,
        ),

        loadAvailableMembers(
          availablePage,
          availableSearch,
        ),
      ]);

      showToast(
        "success",
        member.isPrimary
          ? `Đã xóa "${memberName}" khỏi ${removeType}. Phòng ban chính đã được đặt thành trống.`
          : `Đã xóa "${memberName}" khỏi phòng ban.`,
      );

    } catch (error) {
      console.error(
        "Không thể xóa thành viên:",
        error,
      );

      showToast(
        "error",
        error?.response?.data?.message ||
          "Không thể xóa thành viên.",
      );
    } finally {
      setActionLoading(false);
    }
  }


  /* =======================================================
     REMOVE SELECTED MEMBERS
  ======================================================= */

  async function handleBulkRemove() {
    if (
      actionLoading ||
      selectedMemberIds.length === 0
    ) {
      return;
    }

    const selectedMembers =
      selectedMemberIds
        .map(
          (userId) =>
            members.find(
              (member) =>
                getUserId(member) === userId,
            ),
        )
        .filter(Boolean);

    if (
      selectedMembers.length === 0
    ) {
      return;
    }

    const primaryCount =
      selectedMembers.filter(
        (member) =>
          member.isPrimary,
      ).length;

    const additionalCount =
      selectedMembers.length -
      primaryCount;

    const confirmed =
      window.confirm(
        primaryCount > 0
          ? `Bạn có chắc muốn xóa ${selectedMembers.length} thành viên khỏi phòng ban này?\n\n${primaryCount} nhân viên đang có đây là phòng ban chính sẽ được đặt phòng ban chính thành trống.`
          : `Bạn có chắc muốn xóa ${additionalCount} thành viên khỏi phòng ban này?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await bulkRemoveDepartmentMembers(
        department.id,
        selectedMemberIds,
      );

      setSelectedMemberIds([]);

      await Promise.all([
        loadMembers(
          memberPage,
          memberSearch,
        ),

        loadAvailableMembers(
          availablePage,
          availableSearch,
        ),
      ]);

      showToast(
        "success",
        primaryCount > 0
          ? `Đã xóa ${selectedMembers.length} thành viên. ${primaryCount} phòng ban chính đã được đặt thành trống.`
          : `Đã xóa ${selectedMembers.length} thành viên khỏi phòng ban.`,
      );

    } catch (error) {
      console.error(
        "Không thể xóa nhiều thành viên:",
        error,
      );

      showToast(
        "error",
        error?.response?.data?.message ||
          "Không thể xóa các thành viên đã chọn.",
      );
    } finally {
      setActionLoading(false);
    }
  }


  /* =======================================================
     PAGINATION
  ======================================================= */

  function goToPreviousMemberPage() {
    if (memberPage <= 1) {
      return;
    }

    const nextPage =
      memberPage - 1;

    setMemberPage(nextPage);
    setSelectedMemberIds([]);

    loadMembers(
      nextPage,
      memberSearch,
    );
  }


  function goToNextMemberPage() {
    if (
      memberPage >=
      memberTotalPages
    ) {
      return;
    }

    const nextPage =
      memberPage + 1;

    setMemberPage(nextPage);
    setSelectedMemberIds([]);

    loadMembers(
      nextPage,
      memberSearch,
    );
  }


  function goToPreviousAvailablePage() {
    if (
      availablePage <= 1
    ) {
      return;
    }

    const nextPage =
      availablePage - 1;

    setAvailablePage(nextPage);
    setSelectedAvailableIds([]);

    loadAvailableMembers(
      nextPage,
      availableSearch,
    );
  }


  function goToNextAvailablePage() {
    if (
      availablePage >=
      availableTotalPages
    ) {
      return;
    }

    const nextPage =
      availablePage + 1;

    setAvailablePage(nextPage);
    setSelectedAvailableIds([]);

    loadAvailableMembers(
      nextPage,
      availableSearch,
    );
  }


  /* =======================================================
     CLOSE
  ======================================================= */

  function handleClose() {
    if (actionLoading) {
      return;
    }

    onClose?.();
  }


  function handleOverlayMouseDown(event) {
    if (
      event.target ===
      event.currentTarget
    ) {
      handleClose();
    }
  }


  /* =======================================================
     RENDER MEMBER
  ======================================================= */

  function renderMemberRow(member) {
    const userId =
      getUserId(member);

    const selected =
      selectedMemberIds.includes(
        userId,
      );

    return (
      <div
        key={`member-${userId}`}
        className={`admin-department-member-row ${
          selected
            ? "selected"
            : ""
        }`}
      >

        <label className="admin-department-member-checkbox">

          <input
            type="checkbox"
            checked={selected}
            onChange={() =>
              toggleMemberSelection(
                userId,
              )
            }
            disabled={
              actionLoading
            }
          />

          <span />

        </label>


        <div className="admin-department-member-avatar">

          {getUserInitials(member)}

          {member.isOnline && (
            <span className="admin-member-online-dot" />
          )}

        </div>


        <div className="admin-department-member-info">

          <strong>
            {getUserName(member)}
          </strong>

          <span>
            {member.email ||
              member.username ||
              "—"}
          </span>

        </div>


        <div className="admin-department-member-role">

          {member.role && (
            <span>
              {member.role}
            </span>
          )}

          {member.isPrimary && (
            <span className="admin-department-primary-badge">
              Phòng ban chính
            </span>
          )}

        </div>


        <div className="admin-department-member-status">

          <span
            className={`admin-user-status ${
              member.isActive === false
                ? "inactive"
                : "active"
            }`}
          >

            <span className="admin-status-dot" />

            {member.isActive === false
              ? "Không hoạt động"
              : "Hoạt động"}

          </span>

        </div>


        <button
          type="button"
          className="admin-department-member-remove"
          onClick={() =>
            handleRemoveMember(
              userId,
            )
          }
          disabled={
            actionLoading
          }
          title={
            member.isPrimary
              ? "Xóa phòng ban chính"
              : "Xóa khỏi phòng ban"
          }
        >
          <TrashIcon />

          <span>
            Xóa
          </span>
        </button>

      </div>
    );
  }


  /* =======================================================
     RENDER AVAILABLE
  ======================================================= */

  function renderAvailableRow(member) {
    const userId =
      getUserId(member);

    const selected =
      selectedAvailableIds.includes(
        userId,
      );

    return (
      <div
        key={`available-${userId}`}
        className={`admin-department-member-row ${
          selected
            ? "selected"
            : ""
        }`}
      >

        <label className="admin-department-member-checkbox">

          <input
            type="checkbox"
            checked={selected}
            onChange={() =>
              toggleAvailableSelection(
                userId,
              )
            }
            disabled={
              actionLoading
            }
          />

          <span />

        </label>


        <div className="admin-department-member-avatar">

          {getUserInitials(member)}

          {member.isOnline && (
            <span className="admin-member-online-dot" />
          )}

        </div>


        <div className="admin-department-member-info">

          <strong>
            {getUserName(member)}
          </strong>

          <span>
            {member.email ||
              member.username ||
              "—"}
          </span>

        </div>


        <div className="admin-department-member-role">

          {member.role && (
            <span>
              {member.role}
            </span>
          )}

        </div>


        <div className="admin-department-member-status">

          <span
            className={`admin-user-status ${
              member.isActive === false
                ? "inactive"
                : "active"
            }`}
          >

            <span className="admin-status-dot" />

            {member.isActive === false
              ? "Không hoạt động"
              : "Hoạt động"}

          </span>

        </div>


        <button
          type="button"
          className="admin-department-member-add"
          onClick={() =>
            handleAddMember(
              userId,
            )
          }
          disabled={
            actionLoading ||
            member.isActive === false
          }
        >
          <PlusIcon />

          <span>
            Thêm
          </span>

        </button>

      </div>
    );
  }


  /* =======================================================
     RENDER
  ======================================================= */

  if (!department) {
    return null;
  }


  const currentPageIds =
    members
      .map(
        (member) =>
          getUserId(member),
      )
      .filter(
        (id) =>
          id !== null,
      );


  const allCurrentSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every(
      (id) =>
        selectedMemberIds.includes(
          id,
        ),
    );


  const availablePageIds =
    availableMembers
      .map(
        (member) =>
          getUserId(member),
      )
      .filter(
        (id) =>
          id !== null,
      );


  const allAvailableSelected =
    availablePageIds.length > 0 &&
    availablePageIds.every(
      (id) =>
        selectedAvailableIds.includes(
          id,
        ),
    );


  return (
    <div
      className="admin-department-members-overlay"
      onMouseDown={
        handleOverlayMouseDown
      }
    >

      <div
        className="admin-department-members-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="department-members-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="admin-department-members-header">

          <div className="admin-department-members-heading">

            <div className="admin-department-members-icon">
              <UsersIcon />
            </div>

            <div>

              <h2
                id="department-members-title"
              >
                Thành viên phòng ban
              </h2>

              <p>
                {department.name}
                {" · "}
                {memberTotal} thành viên
              </p>

            </div>

          </div>


          <button
            type="button"
            className="admin-department-modal-close"
            onClick={handleClose}
            disabled={actionLoading}
            aria-label="Đóng"
          >
            <CloseIcon />
          </button>

        </div>


        {/* =================================================
            TABS
        ================================================= */}

        <div className="admin-department-members-tabs">

          <button
            type="button"
            className={
              activeTab === "members"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("members")
            }
          >
            Thành viên

            <span>
              {memberTotal}
            </span>

          </button>


          <button
            type="button"
            className={
              activeTab === "available"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("available")
            }
          >
            Thêm thành viên

            <span>
              {availableTotal}
            </span>

          </button>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            className="admin-department-members-error"
            role="alert"
          >

            <span>
              !
            </span>

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              aria-label="Đóng lỗi"
            >
              ×
            </button>

          </div>
        )}


        {/* =================================================
            CURRENT MEMBERS
        ================================================= */}

        {activeTab === "members" && (

          <div className="admin-department-members-body">

            <div className="admin-department-members-toolbar">

              <form
                className="admin-department-members-search"
                onSubmit={
                  handleMemberSearchSubmit
                }
              >

                <SearchIcon />

                <input
                  type="search"
                  value={memberSearch}
                  onChange={(event) =>
                    setMemberSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Tìm thành viên..."
                  disabled={
                    loadingMembers ||
                    actionLoading
                  }
                  aria-label="Tìm thành viên"
                />


                {memberSearch && (
                  <button
                    type="button"
                    className="admin-search-clear"
                    onClick={
                      handleClearMemberSearch
                    }
                    aria-label="Xóa tìm kiếm"
                  >
                    ×
                  </button>
                )}

              </form>


              <div className="admin-department-members-toolbar-actions">

                {selectedMemberIds.length > 0 && (
                  <button
                    type="button"
                    className="admin-department-bulk-remove"
                    onClick={
                      handleBulkRemove
                    }
                    disabled={
                      actionLoading
                    }
                  >
                    <TrashIcon />

                    Xóa (
                    {
                      selectedMemberIds.length
                    }
                    )
                  </button>
                )}


                <button
                  type="button"
                  className="admin-refresh-button"
                  onClick={() =>
                    loadMembers(
                      memberPage,
                      memberSearch,
                    )
                  }
                  disabled={
                    loadingMembers ||
                    actionLoading
                  }
                >
                  <RefreshIcon />

                  Làm mới
                </button>

              </div>

            </div>


            <div className="admin-department-members-select-all">

              <label>

                <input
                  type="checkbox"
                  checked={
                    allCurrentSelected
                  }
                  onChange={
                    toggleAllMembers
                  }
                  disabled={
                    loadingMembers ||
                    actionLoading ||
                    currentPageIds.length === 0
                  }
                />

                <span />

                Chọn thành viên trên trang

              </label>


              {selectedMemberIds.length > 0 && (
                <strong>
                  Đã chọn{" "}
                  {
                    selectedMemberIds.length
                  }
                </strong>
              )}

            </div>


            <div className="admin-department-members-list">

              {loadingMembers ? (

                <div className="admin-department-members-loading">

                  <div className="admin-loading-spinner" />

                  <span>
                    Đang tải thành viên...
                  </span>

                </div>

              ) : members.length === 0 ? (

                <div className="admin-department-members-empty">

                  <UsersIcon />

                  <strong>
                    Chưa có thành viên
                  </strong>

                  <span>
                    Phòng ban này chưa có thành viên phù hợp.
                  </span>

                </div>

              ) : (

                members.map(
                  renderMemberRow,
                )

              )}

            </div>


            {!loadingMembers &&
              members.length > 0 && (

                <div className="admin-department-members-pagination">

                  <span>
                    Trang{" "}
                    <strong>
                      {memberPage}
                    </strong>
                    {" "}/{" "}
                    {memberTotalPages}
                  </span>


                  <div>

                    <button
                      type="button"
                      onClick={
                        goToPreviousMemberPage
                      }
                      disabled={
                        memberPage <= 1 ||
                        actionLoading
                      }
                      aria-label="Trang trước"
                    >
                      <ChevronLeftIcon />
                    </button>


                    <button
                      type="button"
                      onClick={
                        goToNextMemberPage
                      }
                      disabled={
                        memberPage >=
                          memberTotalPages ||
                        actionLoading
                      }
                      aria-label="Trang sau"
                    >
                      <ChevronRightIcon />
                    </button>

                  </div>

                </div>

              )}

          </div>

        )}


        {/* =================================================
            AVAILABLE MEMBERS
        ================================================= */}

        {activeTab === "available" && (

          <div className="admin-department-members-body">

            <div className="admin-department-members-toolbar">

              <form
                className="admin-department-members-search"
                onSubmit={
                  handleAvailableSearchSubmit
                }
              >

                <SearchIcon />

                <input
                  type="search"
                  value={availableSearch}
                  onChange={(event) =>
                    setAvailableSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Tìm nhân viên để thêm..."
                  disabled={
                    loadingAvailable ||
                    actionLoading
                  }
                  aria-label="Tìm nhân viên để thêm"
                />


                {availableSearch && (
                  <button
                    type="button"
                    className="admin-search-clear"
                    onClick={
                      handleClearAvailableSearch
                    }
                    aria-label="Xóa tìm kiếm"
                  >
                    ×
                  </button>
                )}

              </form>


              <div className="admin-department-members-toolbar-actions">

                {selectedAvailableIds.length > 0 && (
                  <button
                    type="button"
                    className="admin-department-bulk-add"
                    onClick={
                      handleBulkAdd
                    }
                    disabled={
                      actionLoading
                    }
                  >
                    <PlusIcon />

                    Thêm (
                    {
                      selectedAvailableIds.length
                    }
                    )
                  </button>
                )}


                <button
                  type="button"
                  className="admin-refresh-button"
                  onClick={() =>
                    loadAvailableMembers(
                      availablePage,
                      availableSearch,
                    )
                  }
                  disabled={
                    loadingAvailable ||
                    actionLoading
                  }
                >
                  <RefreshIcon />

                  Làm mới
                </button>

              </div>

            </div>


            <div className="admin-department-members-select-all">

              <label>

                <input
                  type="checkbox"
                  checked={
                    allAvailableSelected
                  }
                  onChange={
                    toggleAllAvailable
                  }
                  disabled={
                    loadingAvailable ||
                    actionLoading ||
                    availablePageIds.length === 0
                  }
                />

                <span />

                Chọn nhân viên trên trang

              </label>


              {selectedAvailableIds.length > 0 && (
                <strong>
                  Đã chọn{" "}
                  {
                    selectedAvailableIds.length
                  }
                </strong>
              )}

            </div>


            <div className="admin-department-members-list">

              {loadingAvailable ? (

                <div className="admin-department-members-loading">

                  <div className="admin-loading-spinner" />

                  <span>
                    Đang tải nhân viên...
                  </span>

                </div>

              ) : availableMembers.length === 0 ? (

                <div className="admin-department-members-empty">

                  <UsersIcon />

                  <strong>
                    Không có nhân viên
                  </strong>

                  <span>
                    Không có nhân viên phù hợp để thêm vào phòng ban.
                  </span>

                </div>

              ) : (

                availableMembers.map(
                  renderAvailableRow,
                )

              )}

            </div>


            {!loadingAvailable &&
              availableMembers.length > 0 && (

                <div className="admin-department-members-pagination">

                  <span>
                    Trang{" "}
                    <strong>
                      {availablePage}
                    </strong>
                    {" "}/{" "}
                    {availableTotalPages}
                  </span>


                  <div>

                    <button
                      type="button"
                      onClick={
                        goToPreviousAvailablePage
                      }
                      disabled={
                        availablePage <= 1 ||
                        actionLoading
                      }
                      aria-label="Trang trước"
                    >
                      <ChevronLeftIcon />
                    </button>


                    <button
                      type="button"
                      onClick={
                        goToNextAvailablePage
                      }
                      disabled={
                        availablePage >=
                          availableTotalPages ||
                        actionLoading
                      }
                      aria-label="Trang sau"
                    >
                      <ChevronRightIcon />
                    </button>

                  </div>

                </div>

              )}

          </div>

        )}


        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="admin-department-members-footer">

          <span>
            {activeTab === "members"
              ? `${memberTotal} thành viên`
              : `${availableTotal} nhân viên có thể thêm`}
          </span>


          <button
            type="button"
            className="admin-department-modal-cancel"
            onClick={handleClose}
            disabled={actionLoading}
          >
            Đóng
          </button>

        </div>

      </div>


      {/* =================================================
          TOAST
      ================================================= */}

      {toast && (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={closeToast}
        />
      )}

    </div>
  );
}