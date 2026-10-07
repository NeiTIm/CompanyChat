export default function RolesPagination({
  loading,
  roles,
  page,
  pageSize,
  total,
  totalPages,
  pageNumbers,
  onPrevious,
  onNext,
  onPageChange,
}) {
  if (
    loading ||
    !roles ||
    roles.length === 0 ||
    totalPages <= 1
  ) {
    return null;
  }


  return (
    <div className="admin-roles-pagination">

      {/* =================================================
          INFO
      ================================================= */}

      <div className="admin-roles-pagination-info">

        Trang{" "}
        <strong>
          {page}
        </strong>
        {" / "}
        <strong>
          {totalPages}
        </strong>

        <span>
          {" • "}
          {total} Role
        </span>

      </div>


      {/* =================================================
          CONTROLS
      ================================================= */}

      <div className="admin-roles-pagination-controls">

        <button
          type="button"
          onClick={
            onPrevious
          }
          disabled={
            loading ||
            page <= 1
          }
          className="admin-roles-pagination-button"
        >
          <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>

          <span>
            Trước
          </span>
        </button>


        <div className="admin-roles-page-numbers">

          {pageNumbers.map(
            (pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={
                  `admin-roles-page-number ${
                    pageNumber === page
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  onPageChange(
                    pageNumber
                  )
                }
                disabled={
                  loading
                }
              >
                {pageNumber}
              </button>
            )
          )}

        </div>


        <button
          type="button"
          onClick={
            onNext
          }
          disabled={
            loading ||
            page >= totalPages
          }
          className="admin-roles-pagination-button"
        >
          <span>
            Sau
          </span>

          <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

      </div>

    </div>
  );
}