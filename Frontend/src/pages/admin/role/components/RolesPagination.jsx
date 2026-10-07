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

  /*
   * Không hiển thị pagination nếu:
   *
   * - đang loading
   * - không có dữ liệu
   * - chỉ có 1 page
   */
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

        {/* =================================================
            PREVIOUS
        ================================================= */}

        <button
          type="button"
          onClick={onPrevious}
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
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>

          <span>
            Trước
          </span>

        </button>


        {/* =================================================
            PAGE NUMBERS
        ================================================= */}

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
                  loading ||
                  pageNumber === page
                }
                aria-current={
                  pageNumber === page
                    ? "page"
                    : undefined
                }
                aria-label={
                  `Trang ${pageNumber}`
                }
              >
                {pageNumber}
              </button>
            )
          )}

        </div>


        {/* =================================================
            NEXT
        ================================================= */}

        <button
          type="button"
          onClick={onNext}
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
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>

        </button>

      </div>

    </div>
  );
}