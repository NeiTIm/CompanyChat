import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "./UsersIcons";

export default function UsersPagination({
  loading,
  users,
  page,
  pageSize,
  total,
  totalPages,
  isDeleted,
  pageNumbers,
  onPrevious,
  onNext,
  onPageChange,
}) {
  if (loading || users.length === 0) {
    return null;
  }

  return (
    <div className="admin-users-pagination">
      <div className="admin-pagination-info">
        Hiển thị{" "}

        <strong>
          {(page - 1) * pageSize + 1}
        </strong>

        {" – "}

        <strong>
          {Math.min(
            page * pageSize,
            total
          )}
        </strong>

        {" "}trong{" "}

        <strong>
          {total}
        </strong>

        {" "}

        {isDeleted
          ? "nhân viên đã xóa"
          : "nhân viên"}
      </div>

      <div className="admin-pagination-controls">
        <button
          type="button"
          className="admin-pagination-arrow"
          onClick={onPrevious}
          disabled={page <= 1}
          aria-label="Trang trước"
        >
          <ChevronLeftIcon />
        </button>

        {pageNumbers.map(
          (pageNumber) => (
            <button
              type="button"
              key={pageNumber}
              className={
                pageNumber === page
                  ? "active"
                  : ""
              }
              onClick={() =>
                onPageChange(pageNumber)
              }
            >
              {pageNumber}
            </button>
          )
        )}

        <button
          type="button"
          className="admin-pagination-arrow"
          onClick={onNext}
          disabled={
            page >= totalPages
          }
          aria-label="Trang sau"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}