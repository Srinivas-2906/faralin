import { Skeleton } from '@faralin/ui';

function UniversityCardSkeleton() {
  return (
    <div className="assessment-card-skeleton">
      <Skeleton variant="card" className="assessment-card-skeleton-visual" />
      <div className="assessment-card-skeleton-details">
        <Skeleton variant="title" width="85%" />
      </div>
    </div>
  );
}

export default function UniversitiesLoading() {
  return (
    <div className="universities-page">
      <Skeleton variant="card" className="universities-loading-banner" />
      <div className="page-section universities-page-body">
        <div className="container-wide">
          <div className="universities-loading-stats-row" aria-hidden="true">
            <Skeleton variant="card" className="catalog-insight catalog-insight--copper" style={{ minHeight: '3rem' }} />
            <div className="universities-loading-actions-slot">
              <Skeleton variant="text" className="universities-loading-search" />
            </div>
          </div>

          <div className="assessments-catalog-grid" aria-hidden="true">
            <div className="assessment-card-row">
              {Array.from({ length: 4 }).map((_, i) => (
                <UniversityCardSkeleton key={i} />
              ))}
            </div>
            <hr className="assessment-catalog-row-divider" />
            <div className="assessment-card-row">
              {Array.from({ length: 4 }).map((_, i) => (
                <UniversityCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
