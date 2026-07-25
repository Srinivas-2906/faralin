import type { CSSProperties, ReactNode } from 'react';
import { Pagination } from './Pagination';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  mobileLabel?: string;
}

interface ResponsiveTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  emptyMessage?: ReactNode;
  paginated?: boolean;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  serverPaginated?: boolean;
  total?: number;
  totalPages?: number;
  maxHeight?: string | number;
}

export function ResponsiveTable<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = 'No data.',
  paginated = false,
  page = 1,
  pageSize = 25,
  onPageChange,
  serverPaginated = false,
  total,
  totalPages,
  maxHeight,
}: ResponsiveTableProps<T>) {
  const resolvedTotal = total ?? data.length;
  const resolvedTotalPages =
    totalPages ?? Math.max(1, Math.ceil(resolvedTotal / pageSize));

  const visibleData =
    paginated && !serverPaginated
      ? data.slice((page - 1) * pageSize, page * pageSize)
      : data;

  if (data.length === 0) {
    return <p className="text-muted">{emptyMessage}</p>;
  }

  const scrollStyle: CSSProperties | undefined = maxHeight
    ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }
    : undefined;

  return (
    <>
      <div
        className={`table-responsive table-desktop-wrap${maxHeight ? ' table-scroll-panel' : ''}`}
        style={scrollStyle}
      >
        <table className={maxHeight ? 'table-sticky-head' : undefined}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleData.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-mobile">
        {visibleData.map((row) => (
          <div key={getRowKey(row)} className="table-mobile-card">
            {columns.map((col) => (
              <div key={col.key} className="table-mobile-row">
                <span className="table-mobile-label">{col.mobileLabel ?? col.header}</span>
                <span>{col.render(row)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {paginated && onPageChange ? (
        <Pagination
          page={page}
          totalPages={resolvedTotalPages}
          total={resolvedTotal}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      ) : null}
    </>
  );
}
