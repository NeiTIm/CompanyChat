/* =========================================================
   SCOPE SUMMARY
========================================================= */

function ScopeSummary({
  totalUsers = 0,
  usersWithScope = 0,
  totalScopes = 0,
  totalDepartments = 0,
}) {
  const summaryItems = [
    {
      key: "users",
      label: "Tổng người dùng",
      value: totalUsers,
      icon: "👥",
    },
    {
      key: "users-with-scope",
      label: "User có Scope",
      value: usersWithScope,
      icon: "🎯",
    },
    {
      key: "scopes",
      label: "Tổng Scope",
      value: totalScopes,
      icon: "🔗",
    },
    {
      key: "departments",
      label: "Department",
      value: totalDepartments,
      icon: "🏢",
    },
  ];

  return (
    <div className="scope-summary">
      {summaryItems.map((item) => (
        <div
          key={item.key}
          className="scope-summary-card"
        >
          {/* =================================================
              ICON
          ================================================= */}

          <div className="scope-summary-icon">
            {item.icon}
          </div>

          {/* =================================================
              CONTENT
          ================================================= */}

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
  );
}

export default ScopeSummary;