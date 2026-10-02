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

  /* =====================================================
     SEND TYPING STATUS
  ===================================================== */

  function sendTypingStatus(isTyping) {
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

  /* =====================================================
     INPUT CHANGE
  ===================================================== */

  function handleChange(e) {
    const value =
      e.target.value;

    onChange(e);

    if (!websocketConnected) {
      return;
    }

    /* ===================================================
       INPUT RỖNG
    =================================================== */

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

    /* ===================================================
       BẮT ĐẦU TYPING
    =================================================== */

    if (!isTypingRef.current) {
      sendTypingStatus(true);

      isTypingRef.current =
        true;
    }

    /* ===================================================
       RESET TIMER
    =================================================== */

    if (
      typingTimeoutRef.current
    ) {
      clearTimeout(
        typingTimeoutRef.current
      );
    }

    /* ===================================================
       SAU 700ms KHÔNG GÕ
       → STOP TYPING
    =================================================== */

    typingTimeoutRef.current =
      setTimeout(() => {
        sendTypingStatus(false);

        isTypingRef.current =
          false;

        typingTimeoutRef.current =
          null;
      }, 700);
  }

  /* =====================================================
     SUBMIT MESSAGE
  ===================================================== */

  function handleSubmit(e) {
    e.preventDefault();

    /* -----------------------------------------------
       STOP TYPING
    ----------------------------------------------- */

    if (isTypingRef.current) {
      sendTypingStatus(false);

      isTypingRef.current =
        false;
    }

    /* -----------------------------------------------
       CLEAR TIMER
    ----------------------------------------------- */

    if (
      typingTimeoutRef.current
    ) {
      clearTimeout(
        typingTimeoutRef.current
      );

      typingTimeoutRef.current =
        null;
    }

    /* -----------------------------------------------
       SEND MESSAGE
    ----------------------------------------------- */

    onSubmit(e);
  }

  /* =====================================================
     CLEANUP
  ===================================================== */

  useEffect(() => {
    return () => {
      if (
        typingTimeoutRef.current
      ) {
        clearTimeout(
          typingTimeoutRef.current
        );
      }

      typingTimeoutRef.current =
        null;

      /*
       * Không gửi typing_stop
       * khi component unmount.
       *
       * Tránh React StrictMode /
       * re-render tạo thêm WebSocket message.
       */
      isTypingRef.current =
        false;
    };
  }, []);

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="composer-container">

      <DeliveryLegend />

      {/* =================================================
          REPLY BANNER
      ================================================= */}

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

      {/* =================================================
          MESSAGE FORM
      ================================================= */}

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
          aria-label="Gửi tin nhắn"
        >

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
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>

        </button>

      </form>

      {/* =================================================
          CONNECTION WARNING
      ================================================= */}

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