/* =========================================================
   SCOPE PAGINATION
========================================================= */

function ScopePagination({
  page = 1,
  pageSize = 20,
  totalCount = 0,
  onPageChange,
  loading = false,
}) {
  const safePageSize =
    Number(pageSize) > 0
      ? Number(pageSize)
      : 20;

  const safePage =
    Number(page) > 0
      ? Number(page)
      : 1;

  const safeTotal =
    Number(totalCount) >= 0
      ? Number(totalCount)
      : 0;

  const totalPages =
    safeTotal === 0
      ? 1
      : Math.ceil(
          safeTotal / safePageSize
        );

  const start =
    safeTotal === 0
      ? 0
      : (safePage - 1) *
          safePageSize +
        1;

  const end =
    safeTotal === 0
      ? 0
      : Math.min(
          safePage * safePageSize,
          safeTotal
        );

  if (safeTotal === 0) {
    return null;
  }

  return (
    <div className="scope-pagination">
      {/* =================================================
          INFO
      ================================================= */}

      <div className="scope-pagination-info">
        Hiển thị{" "}
        <strong>
          {start}
        </strong>{" "}
        -{" "}
        <strong>
          {end}
        </strong>{" "}
        /{" "}
        <strong>
          {safeTotal}
        </strong>
      </div>

      {/* =================================================
          CONTROLS
      ================================================= */}

      <div className="scope-pagination-buttons">
        <button
          type="button"
          disabled={
            safePage <= 1 ||
            loading
          }
          onClick={() =>
            onPageChange?.(
              safePage - 1
            )
          }
          title="Trang trước"
        >
          ←
        </button>

        <span>
          Trang{" "}
          <strong>
            {safePage}
          </strong>{" "}
          /{" "}
          <strong>
            {totalPages}
          </strong>
        </span>

        <button
          type="button"
          disabled={
            safePage >=
              totalPages ||
            loading
          }
          onClick={() =>
            onPageChange?.(
              safePage + 1
            )
          }
          title="Trang sau"
        >
          →
        </button>
      </div>
    </div>
  );
}

export default ScopePagination;