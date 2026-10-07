export default function RolesSummary({
  total,
  systemCount,
  customCount,
  page,
  totalPages,
  pageSize,
}) {
  const from =
    total === 0
      ? 0
      : (page - 1) *
          pageSize +
        1;

  const to =
    Math.min(
      page * pageSize,
      total
    );

  return (
    <div className="admin-roles-summary">

      <div className="admin-roles-summary-left">

        <div className="admin-roles-summary-item">

          <span className="admin-roles-summary-label">
            Tổng Role
          </span>

          <strong className="admin-roles-summary-value">
            {total}
          </strong>

        </div>


        <div className="admin-roles-summary-item">

          <span className="admin-roles-summary-label">
            System
          </span>

          <strong className="admin-roles-summary-value">
            {systemCount}
          </strong>

        </div>


        <div className="admin-roles-summary-item">

          <span className="admin-roles-summary-label">
            Custom
          </span>

          <strong className="admin-roles-summary-value">
            {customCount}
          </strong>

        </div>

      </div>


      <div className="admin-roles-summary-right">

        {total > 0 ? (
          <span>
            Hiển thị{" "}
            <strong>
              {from}
            </strong>
            {" - "}
            <strong>
              {to}
            </strong>
            {" / "}
            <strong>
              {total}
            </strong>
          </span>
        ) : (
          <span>
            Không có Role
          </span>
        )}

        {totalPages > 1 && (
          <span>
            {" • "}
            Trang{" "}
            <strong>
              {page}
            </strong>
            {" / "}
            <strong>
              {totalPages}
            </strong>
          </span>
        )}

      </div>

    </div>
  );
}