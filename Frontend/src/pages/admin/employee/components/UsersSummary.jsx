export default function UsersSummary({
  total,
  page,
  totalPages,
  pageSize,
  isDeleted,
}) {
  return (
    <div className="admin-users-summary">
      <div className="admin-users-summary-left">
        <span className="admin-users-summary-label">
          {isDeleted
            ? "Nhân viên đã xóa"
            : "Nhân viên"}
        </span>

        <span className="admin-users-summary-count">
          {total}
        </span>

        <span className="admin-users-summary-text">
          tài khoản
        </span>
      </div>

      <div className="admin-users-summary-right">
        <span>
          Trang{" "}
          <strong>{page}</strong>
          {" "} / {totalPages}
        </span>

        <span className="admin-summary-divider">
          |
        </span>

        <span>
          {pageSize} / trang
        </span>
      </div>
    </div>
  );
}