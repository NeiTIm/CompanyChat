import DeleteMessageModal from "../modal/DeleteMessageModal";
import DeleteHistoryModal from "../modal/DeleteHistoryModal";
import GroupDetailsModal from "../modal/GroupDetailsModal";

/* =========================================================
   CHAT MODALS
========================================================= */

function ChatModals({
  /* =========================
     DELETE MESSAGE
  ========================= */

  deleteMessage,
  currentUser,
  onCloseDeleteMessage,
  onDeleteForMe,
  onDeleteForEveryone,

  /* =========================
     DELETE HISTORY
  ========================= */

  showDeleteHistoryModal,
  onCloseDeleteHistory,
  onConfirmDeleteHistory,
  deletingHistory,

  /* =========================
     GROUP
  ========================= */

  showGroupDetails,
  selectedGroup,
  onCloseGroupDetails,
  onGroupUpdated,
  onLeaveGroup,
  onDeleteGroup,
}) {
  return (
    <>
      {/* ===================================================
          DELETE MESSAGE
      =================================================== */}

      <DeleteMessageModal
        message={deleteMessage}
        currentUser={currentUser}
        onClose={onCloseDeleteMessage}
        onDeleteForMe={onDeleteForMe}
        onDeleteForEveryone={onDeleteForEveryone}
      />

      {/* ===================================================
          DELETE HISTORY
      =================================================== */}

      {showDeleteHistoryModal && (
        <DeleteHistoryModal
          onClose={onCloseDeleteHistory}
          onConfirm={onConfirmDeleteHistory}
          loading={deletingHistory}
        />
      )}

      {/* ===================================================
          GROUP DETAILS
      =================================================== */}

      {showGroupDetails &&
        selectedGroup && (
          <GroupDetailsModal
            group={selectedGroup}
            currentUser={currentUser}
            onClose={onCloseGroupDetails}
            onGroupUpdated={onGroupUpdated}
            onLeaveGroup={onLeaveGroup}
            onDeleteGroup={onDeleteGroup}
          />
        )}
    </>
  );
}

export default ChatModals;