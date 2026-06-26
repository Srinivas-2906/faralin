import type { ReactNode } from 'react';

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
}

export function ResponsiveTable<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = 'No data.',
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return <p className="text-muted">{emptyMessage}</p>;
  }

  return (
    <>
      <div className="table-responsive table-desktop-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
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
        {data.map((row) => (
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
    </>
  );
}
