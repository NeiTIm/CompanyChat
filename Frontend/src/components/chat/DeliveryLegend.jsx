function DeliveryLegend() {
  return (
    <div className="delivery-legend">
      <div>
        <span className="delivery-status sent">
          ✓
        </span>
        <span>Đã gửi</span>
      </div>

      <div>
        <span className="delivery-status delivered">
          ✓✓
        </span>
        <span>Đã nhận</span>
      </div>

      <div>
        <span className="delivery-status read">
          ✓✓
        </span>
        <span>Đã đọc</span>
      </div>
    </div>
  );
}

export default DeliveryLegend;