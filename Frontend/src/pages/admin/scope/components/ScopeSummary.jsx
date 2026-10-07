/* =========================================================
   SCOPE SUMMARY
========================================================= */

function ScopeSummary({
  totalUsers = 0,
  usersWithScope = 0,
  totalScopes = 0,
  totalDepartments = 0,

  page = 1,
  pageSize = 20,
  total = 0,
}) {
  const safeTotalUsers =
    Number(totalUsers) || 0;

  const safeUsersWithScope =
    Number(usersWithScope) || 0;

  const safeTotalScopes =
    Number(totalScopes) || 0;

  const safeTotalDepartments =
    Number(totalDepartments) || 0;

  const safePage =
    Math.max(
      Number(page) || 1,
      1,
    );

  const safePageSize =
    Math.max(
      Number(pageSize) || 20,
      1,
    );

  const safeTotal =
    Math.max(
      Number(total) || 0,
      0,
    );

  /* =========================================================
     DISPLAY RANGE
  ========================================================= */

  const from =
    safeTotal === 0
      ? 0
      : (safePage - 1) *
          safePageSize +
        1;

  const to =
    Math.min(
      safePage * safePageSize,
      safeTotal,
    );

  const summaryItems = [
    {
      key: "users",
      label: "Tổng người dùng",
      value: safeTotalUsers,
      icon: "👥",
    },
    {
      key: "users-with-scope",
      label: "User có Scope",
      value: safeUsersWithScope,
      icon: "🎯",
    },
    {
      key: "scopes",
      label: "Tổng Scope",
      value: safeTotalScopes,
      icon: "🔗",
    },
    {
      key: "departments",
      label: "Department",
      value: safeTotalDepartments,
      icon: "🏢",
    },
  ];

  return (
    <div className="scope-summary">

      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="scope-summary-cards">

        {summaryItems.map((item) => (
          <div
            key={item.key}
            className="scope-summary-card"
          >
            <div className="scope-summary-icon">
              {item.icon}
            </div>

            <div className="scope-summary-content">
              <span className="scope-summary-label">
                {item.label}
              </span>

              <strong className="scope-summary-value">
                {item.value}
              </strong>
            </div>
          </div>
        ))}

      </div>

      {/* =================================================
          DISPLAY RANGE
      ================================================= */}

      <div className="scope-summary-range">

        {safeTotal > 0 ? (
          <span>
            Hiển thị{" "}
            <strong>{from}</strong>
            {" - "}
            <strong>{to}</strong>
            {" / "}
            <strong>{safeTotal}</strong>
          </span>
        ) : (
          <span>
            Không có người dùng
          </span>
        )}

      </div>

    </div>
  );
}

export default ScopeSummary;