function DeliveryStatus({ status }) {
  if (status === "pending") {
    return (
      <span
        className="delivery-status pending"
        title="Đang gửi"
      >
        <span className="sending-spinner" />
        <span>Đang gửi</span>
      </span>
    );
  }

  if (status === "read") {
    return (
      <span
        className="delivery-status read"
        title="Đã đọc"
      >
        ✓✓
      </span>
    );
  }

  if (status === "delivered") {
    return (
      <span
        className="delivery-status delivered"
        title="Đã nhận"
      >
        ✓✓
      </span>
    );
  }

  return (
    <span
      className="delivery-status sent"
      title="Đã gửi"
    >
      ✓
    </span>
  );
}

export default DeliveryStatus;