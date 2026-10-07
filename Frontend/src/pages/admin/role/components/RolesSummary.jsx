export default function RolesSummary({
  total,
  systemCount,
  customCount,
  page,
  totalPages,
  pageSize,
}) {

  /* =======================================================
     DISPLAY RANGE
  ======================================================= */

  const safeTotal =
    Number(total) || 0;

  const safePage =
    Math.max(
      Number(page) || 1,
      1
    );

  const safePageSize =
    Math.max(
      Number(pageSize) || 10,
      1
    );

  const safeTotalPages =
    Math.max(
      Number(totalPages) || 1,
      1
    );


  const from =
    safeTotal === 0
      ? 0
      : (safePage - 1) *
          safePageSize +
        1;


  const to =
    Math.min(
      safePage *
        safePageSize,
      safeTotal
    );


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="admin-roles-summary">

      {/* =================================================
          LEFT
      ================================================= */}

      <div className="admin-roles-summary-left">

        {/* =================================================
            TOTAL
        ================================================= */}

        <div className="admin-roles-summary-item">

          <span className="admin-roles-summary-label">
            Tổng Role
          </span>

          <strong className="admin-roles-summary-value">
            {safeTotal}
          </strong>

        </div>


        {/* =================================================
            SYSTEM
        ================================================= */}

        <div className="admin-roles-summary-item">

          <span className="admin-roles-summary-label">
            System
          </span>

          <strong className="admin-roles-summary-value">
            {Number(systemCount) || 0}
          </strong>

        </div>


        {/* =================================================
            CUSTOM
        ================================================= */}

        <div className="admin-roles-summary-item">

          <span className="admin-roles-summary-label">
            Custom
          </span>

          <strong className="admin-roles-summary-value">
            {Number(customCount) || 0}
          </strong>

        </div>

      </div>


      {/* =================================================
          RIGHT
      ================================================= */}

      <div className="admin-roles-summary-right">

        {safeTotal > 0 ? (

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
              {safeTotal}
            </strong>

          </span>

        ) : (

          <span>
            Không có Role
          </span>

        )}


        {safeTotalPages > 1 && (

          <span>

            {" • "}

            Trang{" "}

            <strong>
              {safePage}
            </strong>

            {" / "}

            <strong>
              {safeTotalPages}
            </strong>

          </span>

        )}

      </div>

    </div>
  );
}