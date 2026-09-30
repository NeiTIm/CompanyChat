import DeliveryLegend from "./DeliveryLegend";

function MessageComposer({
  text,
  selectedUser,
  websocketConnected,
  onChange,
  onSubmit,
}) {
  return (
    <div className="composer-container">
      <DeliveryLegend />

      <form
        className="message-composer"
        onSubmit={onSubmit}
      >
        <input
          value={text}
          onChange={onChange}
          placeholder={`Nhắn tin cho ${
            selectedUser.fullName ||
            selectedUser.username
          }...`}
          disabled={!websocketConnected}
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