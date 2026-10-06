import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import MessageComposer from "./MessageComposer";

/* =========================================================
   PRIVATE CHAT VIEW
========================================================= */

function PrivateChatView({
  selectedUser,
  websocketConnected,
  onDeleteHistory,

  messages,
  loading,
  isTyping,
  messagesEndRef,
  currentUser,

  text,
  conversation,
  websocket,

  replyingTo,
  onCancelReply,
  onChange,
  onSubmit,

  onDelete,
  onReply,
}) {
  return (
    <main className="chat-container">

      {/* =================================================
          HEADER
      ================================================= */}

      <ChatHeader
        selectedUser={selectedUser}
        websocketConnected={
          websocketConnected
        }
        onDeleteHistory={
          onDeleteHistory
        }
      />

      {/* =================================================
          MESSAGES
      ================================================= */}

      <ChatMessages
        type="private"
        selectedUser={selectedUser}
        messages={messages}
        loading={loading}
        isTyping={isTyping}
        messagesEndRef={messagesEndRef}
        currentUser={currentUser}
        onDelete={onDelete}
        onReply={onReply}
      />

      {/* =================================================
          COMPOSER
      ================================================= */}

      <MessageComposer
        text={text}
        selectedUser={selectedUser}
        conversation={conversation}
        websocket={websocket}
        websocketConnected={
          websocketConnected
        }
        replyingTo={replyingTo}
        onCancelReply={onCancelReply}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    </main>
  );
}

export default PrivateChatView;