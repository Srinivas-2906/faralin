import { Skeleton } from '@faralin/ui';

export function AdminPageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="page-section admin-page-loading">
      <div className="container">
        <Skeleton variant="title" width="35%" style={{ marginBottom: '1.5rem' }} />
        <div className="stat-grid" style={{ marginBottom: 'var(--section-gap)' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="stat" />
          ))}
        </div>
        <div className="card">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} height="2.5rem" style={{ marginBottom: '0.75rem' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
