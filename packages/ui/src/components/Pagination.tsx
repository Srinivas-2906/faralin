'use client';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  compact?: boolean;
  className?: string;
}

function pageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  compact = false,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1 && total <= pageSize) return null;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = pageNumbers(page, totalPages);

  return (
    <nav
      className={`ui-pagination${compact ? ' ui-pagination-compact' : ''} ${className}`.trim()}
      aria-label="Pagination"
    >
      {!compact ? (
        <span className="ui-pagination-summary">
          Showing {start}–{end} of {total}
        </span>
      ) : null}
      <div className="ui-pagination-controls">
        <button
          type="button"
          className="ui-pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          Prev
        </button>
        {compact ? (
          <span className="ui-pagination-current">
            {page} / {totalPages}
          </span>
        ) : (
          pages.map((p, index) => {
            const prev = pages[index - 1];
            const showEllipsis = prev !== undefined && p - prev > 1;
            return (
              <span key={p} className="ui-pagination-page-wrap">
                {showEllipsis ? <span className="ui-pagination-ellipsis">…</span> : null}
                <button
                  type="button"
                  className={`ui-pagination-btn${p === page ? ' ui-pagination-btn-active' : ''}`}
                  onClick={() => onPageChange(p)}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              </span>
            );
          })
        )}
        <button
          type="button"
          className="ui-pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
