import {
  useEffect,
  useRef,
} from "react";

import DeliveryLegend from "./DeliveryLegend";

function MessageComposer({
  text,
  selectedUser,
  conversation,
  websocket,
  websocketConnected,
  onChange,
  onSubmit,
  replyingTo,
  onCancelReply,
}) {
  const typingTimeoutRef =
    useRef(null);

  const isTypingRef =
    useRef(false);

  function sendTypingStatus(
    isTyping
  ) {
    if (
      !websocket ||
      websocket.readyState !==
        WebSocket.OPEN
    ) {
      return;
    }

    if (
      !selectedUser ||
      !conversation
    ) {
      return;
    }

    websocket.send(
      JSON.stringify({
        type: isTyping
          ? "typing_start"
          : "typing_stop",

        conversationId:
          conversation.id,

        receiverId:
          selectedUser.id,
      })
    );
  }

  function handleChange(e) {
    const value =
      e.target.value;

    onChange(e);

    if (!websocketConnected) {
      return;
    }

    if (!value.trim()) {
      if (isTypingRef.current) {
        sendTypingStatus(false);

        isTypingRef.current =
          false;
      }

      if (
        typingTimeoutRef.current
      ) {
        clearTimeout(
          typingTimeoutRef.current
        );

        typingTimeoutRef.current =
          null;
      }

      return;
    }

    if (!isTypingRef.current) {
      sendTypingStatus(true);

      isTypingRef.current =
        true;
    }

    if (
      typingTimeoutRef.current
    ) {
      clearTimeout(
        typingTimeoutRef.current
      );
    }

    typingTimeoutRef.current =
      setTimeout(() => {
        sendTypingStatus(false);

        isTypingRef.current =
          false;

        typingTimeoutRef.current =
          null;
      }, 700);
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (isTypingRef.current) {
      sendTypingStatus(false);

      isTypingRef.current =
        false;
    }

    if (
      typingTimeoutRef.current
    ) {
      clearTimeout(
        typingTimeoutRef.current
      );

      typingTimeoutRef.current =
        null;
    }

    onSubmit(e);
  }

  useEffect(() => {
    return () => {
      if (
        typingTimeoutRef.current
      ) {
        clearTimeout(
          typingTimeoutRef.current
        );
      }

      if (isTypingRef.current) {
        sendTypingStatus(false);

        isTypingRef.current =
          false;
      }
    };
  }, []);

  return (
    <div className="composer-container">
      <DeliveryLegend />

      {replyingTo && (
        <div className="replying-banner">
          <div className="replying-content-wrapper">
            <div className="replying-label">
              Đang trả lời{" "}
              {replyingTo.senderName ||
                "tin nhắn"}
            </div>

            <div className="replying-message">
              {replyingTo.content}
            </div>
          </div>

          <button
            type="button"
            className="cancel-reply-button"
            onClick={onCancelReply}
            title="Hủy trả lời"
          >
            ×
          </button>
        </div>
      )}

      <form
        className="message-composer"
        onSubmit={handleSubmit}
      >
        <input
          value={text}
          onChange={handleChange}
          placeholder={`Nhắn tin cho ${
            selectedUser.fullName ||
            selectedUser.username
          }...`}
          disabled={
            !websocketConnected
          }
        />

        <button
          type="submit"
          className="send-button"
          disabled={
            !text.trim() ||
            !websocketConnected
          }
          title="Gửi tin nhắn"
        >
          <span>➤</span>
        </button>
      </form>

      {!websocketConnected && (
        <div className="connection-warning">
          <span className="warning-dot" />
          Mất kết nối realtime.
          Vui lòng chờ kết nối lại.
        </div>
      )}
    </div>
  );
}

export default MessageComposer;