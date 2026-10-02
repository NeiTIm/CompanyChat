import { useEffect, useState } from "react";

import {
  getGroupMembers,
  addGroupMember,
  removeGroupMember,
  updateGroupMemberRole,
  transferGroupOwnership,
  leaveGroup,
  deleteGroup,
} from "../../services/conversationService";

import { getUsers } from "../../services/userService";

/* =========================================================
   GROUP DETAILS MODAL
========================================================= */

function GroupDetailsModal({
  group,
  currentUser,
  onClose,
  onGroupUpdated,
  onLeaveGroup,
  onDeleteGroup,
}) {
  const [members, setMembers] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [showAddMember, setShowAddMember] =
    useState(false);

  const [error, setError] =
    useState("");

  if (!group) {
    return null;
  }

  const conversationId =
    group.conversationId ?? group.id;

  /* =======================================================
     LOAD MEMBERS
  ======================================================= */

  async function loadMembers() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getGroupMembers(
          conversationId
        );

      setMembers(data);
    } catch (error) {
      console.error(
        "Load group members error:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Không thể tải thành viên."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     LOAD USERS
  ======================================================= */

  async function loadUsers() {
    try {
      const data = await getUsers();

      setUsers(
        Array.isArray(data)
          ? data
          : data?.items || []
      );
    } catch (error) {
      console.error(
        "Load users error:",
        error
      );
    }
  }

  /* =======================================================
     INIT
  ======================================================= */

  useEffect(() => {
    loadMembers();
    loadUsers();
  }, [conversationId]);

  /* =======================================================
     CURRENT MEMBER
  ======================================================= */

  const currentMember =
    members.find(
      (member) =>
        Number(member.userId) ===
        Number(currentUser.id)
    );

  const currentRole =
    currentMember?.role || "Member";

  const isOwner =
    currentRole === "Owner";

  const isAdmin =
    currentRole === "Admin";

  /* =======================================================
     ADD MEMBER
  ======================================================= */

  async function handleAddMember(
    userId
  ) {
    try {
      setActionLoading(true);
      setError("");

      await addGroupMember(
        conversationId,
        userId
      );

      await loadMembers();

      setShowAddMember(false);

      onGroupUpdated?.();
    } catch (error) {
      console.error(
        "Add member error:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Không thể thêm thành viên."
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* =======================================================
     REMOVE MEMBER
  ======================================================= */

  async function handleRemoveMember(
    userId
  ) {
    if (
      !window.confirm(
        "Bạn có chắc muốn xóa thành viên này khỏi nhóm?"
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await removeGroupMember(
        conversationId,
        userId
      );

      await loadMembers();

      onGroupUpdated?.();
    } catch (error) {
      console.error(
        "Remove member error:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Không thể xóa thành viên."
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* =======================================================
     UPDATE ROLE
  ======================================================= */

  async function handleUpdateRole(
    userId,
    role
  ) {
    try {
      setActionLoading(true);
      setError("");

      await updateGroupMemberRole(
        conversationId,
        userId,
        role
      );

      await loadMembers();

      onGroupUpdated?.();
    } catch (error) {
      console.error(
        "Update role error:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Không thể cập nhật quyền."
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* =======================================================
     TRANSFER OWNER
  ======================================================= */

  async function handleTransferOwner(
    userId
  ) {
    if (
      !window.confirm(
        "Bạn có chắc muốn chuyển quyền Owner cho thành viên này?"
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await transferGroupOwnership(
        conversationId,
        userId
      );

      await loadMembers();

      onGroupUpdated?.();
    } catch (error) {
      console.error(
        "Transfer owner error:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Không thể chuyển quyền Owner."
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* =======================================================
     LEAVE GROUP
  ======================================================= */

  async function handleLeaveGroup() {
    if (
      !window.confirm(
        "Bạn có chắc muốn rời nhóm này?"
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await leaveGroup(
        conversationId
      );

      onLeaveGroup?.();

      onClose();
    } catch (error) {
      console.error(
        "Leave group error:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Không thể rời nhóm."
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* =======================================================
     DELETE GROUP
  ======================================================= */

  async function handleDeleteGroup() {
    if (
      !window.confirm(
        "Bạn có chắc muốn xóa nhóm này? Toàn bộ lịch sử sẽ bị xóa."
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await deleteGroup(
        conversationId
      );

      onDeleteGroup?.();

      onClose();
    } catch (error) {
      console.error(
        "Delete group error:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Không thể xóa nhóm."
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* =======================================================
     AVAILABLE USERS
  ======================================================= */

  const availableUsers =
    users.filter(
      (user) =>
        user.isActive !== false &&
        !members.some(
          (member) =>
            Number(member.userId) ===
            Number(user.id)
        )
    );

  return (
    <div
      className="modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="group-details-modal"
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="group-details-header">

          <div>
            <div className="group-details-icon">
              👥
            </div>

            <h3>
              {group.name}
            </h3>

            <p>
              {members.length} thành viên
            </p>
          </div>

          <button
            className="group-details-close"
            onClick={onClose}
          >
            ×
          </button>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="group-details-error">
            {error}
          </div>
        )}

        {/* =================================================
            ADD MEMBER
        ================================================= */}

        {(isOwner || isAdmin) && (
          <div className="group-add-section">

            <button
              className="group-add-member-button"
              onClick={() =>
                setShowAddMember(
                  !showAddMember
                )
              }
              disabled={actionLoading}
            >
              <span>＋</span>

              <span>
                Thêm thành viên
              </span>
            </button>

            {showAddMember && (
              <div className="group-user-list">

                {availableUsers.length ===
                0 ? (
                  <div className="group-empty-text">
                    Không còn người dùng để thêm.
                  </div>
                ) : (
                  availableUsers.map(
                    (user) => (
                      <button
                        key={user.id}
                        className="group-user-item"
                        onClick={() =>
                          handleAddMember(
                            user.id
                          )
                        }
                        disabled={
                          actionLoading
                        }
                      >
                        <div className="group-user-avatar">
                          {(
                            user.fullName ||
                            user.username ||
                            "?"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="group-user-info">
                          <strong>
                            {user.fullName ||
                              user.username}
                          </strong>

                          <small>
                            @{user.username}
                          </small>
                        </div>

                        <span className="group-user-add">
                          ＋
                        </span>
                      </button>
                    )
                  )
                )}

              </div>
            )}

          </div>
        )}

        {/* =================================================
            MEMBERS
        ================================================= */}

        <div className="group-members-section">

          <div className="group-section-title">
            Thành viên
          </div>

          {loading ? (
            <div className="group-loading">
              Đang tải...
            </div>
          ) : (
            <div className="group-members-list">

              {members.map(
                (member) => {
                  const isCurrentUser =
                    Number(
                      member.userId
                    ) ===
                    Number(
                      currentUser.id
                    );

                  return (
                    <div
                      key={
                        member.userId
                      }
                      className="group-member-item"
                    >

                      {/* Avatar */}

                      <div className="group-member-avatar">

                        {(
                          member.fullName ||
                          member.username ||
                          "?"
                        )
                          .charAt(0)
                          .toUpperCase()}

                        {member.online && (
                          <span className="group-online-dot" />
                        )}

                      </div>

                      {/* Info */}

                      <div className="group-member-info">

                        <div className="group-member-name">

                          {member.fullName ||
                            member.username}

                          {isCurrentUser && (
                            <span className="group-you">
                              Bạn
                            </span>
                          )}

                        </div>

                        <div className="group-member-role">
                          {member.role}
                        </div>

                      </div>

                      {/* Actions */}

                      <div className="group-member-actions">

                        {/* OWNER */}

                        {member.role ===
                          "Owner" && (
                          <span className="group-role-badge owner">
                            Owner
                          </span>
                        )}

                        {/* ADMIN */}

                        {member.role ===
                          "Admin" && (
                          <span className="group-role-badge admin">
                            Admin
                          </span>
                        )}

                        {/* OWNER ACTION */}

                        {isOwner &&
                          !isCurrentUser &&
                          member.role !==
                            "Owner" && (
                          <>
                            <button
                              className="group-member-action"
                              onClick={() =>
                                handleUpdateRole(
                                  member.userId,
                                  member.role ===
                                    "Admin"
                                    ? "Member"
                                    : "Admin"
                                )
                              }
                              disabled={
                                actionLoading
                              }
                            >
                              {member.role ===
                              "Admin"
                                ? "Hạ quyền"
                                : "Admin"}
                            </button>

                            <button
                              className="group-member-action"
                              onClick={() =>
                                handleTransferOwner(
                                  member.userId
                                )
                              }
                              disabled={
                                actionLoading
                              }
                            >
                              Owner
                            </button>

                            <button
                              className="group-member-action danger"
                              onClick={() =>
                                handleRemoveMember(
                                  member.userId
                                )
                              }
                              disabled={
                                actionLoading
                              }
                            >
                              Xóa
                            </button>
                          </>
                        )}

                        {/* ADMIN ACTION */}

                        {isAdmin &&
                          !isCurrentUser &&
                          member.role ===
                            "Member" && (
                          <button
                            className="group-member-action danger"
                            onClick={() =>
                              handleRemoveMember(
                                member.userId
                              )
                            }
                            disabled={
                              actionLoading
                            }
                          >
                            Xóa
                          </button>
                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="group-details-footer">

          {!isOwner && (
            <button
              className="group-leave-button"
              onClick={
                handleLeaveGroup
              }
              disabled={actionLoading}
            >
              Rời nhóm
            </button>
          )}

          {isOwner && (
            <button
              className="group-delete-button"
              onClick={
                handleDeleteGroup
              }
              disabled={actionLoading}
            >
              Xóa nhóm
            </button>
          )}

          <button
            className="group-close-button"
            onClick={onClose}
            disabled={actionLoading}
          >
            Đóng
          </button>

        </div>

      </div>
    </div>
  );
}

export default GroupDetailsModal;