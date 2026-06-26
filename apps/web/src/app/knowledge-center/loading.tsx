import { Skeleton } from '@faralin/ui';

function CardSkeleton() {
  return (
    <div className="assessment-card-skeleton">
      <Skeleton variant="card" className="assessment-card-skeleton-visual" />
      <div className="assessment-card-skeleton-details">
        <Skeleton variant="text" width="35%" />
        <Skeleton variant="title" width="85%" />
        <Skeleton variant="text" width="55%" />
      </div>
    </div>
  );
}

export default function KnowledgeCenterLoading() {
  return (
    <div className="knowledge-center-page">
      <Skeleton variant="card" className="knowledge-center-loading-banner" />
      <div className="page-section knowledge-center-page-body">
        <div className="container-wide">
          <Skeleton variant="text" width="60%" style={{ marginBottom: '1.5rem' }} />
          <div className="knowledge-hub-grid" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="card" style={{ minHeight: '12rem' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { CardSkeleton };
