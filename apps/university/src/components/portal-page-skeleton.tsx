import { Skeleton } from '@faralin/ui';

export function PortalPageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="page-section portal-page-loading">
      <div className="container">
        <Skeleton variant="title" width="35%" style={{ marginBottom: '0.75rem' }} />
        <Skeleton height="2.25rem" width="12rem" style={{ marginBottom: '0.875rem' }} />
        <div className="card">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} height="2.5rem" style={{ marginBottom: i < rows - 1 ? '0.75rem' : 0 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
