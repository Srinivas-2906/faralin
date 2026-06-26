import { Skeleton } from '@faralin/ui';

function AssessmentCardSkeleton() {
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

export default function AssessmentsLoading() {
  return (
    <div className="assessments-page">
      <Skeleton variant="card" className="assessments-loading-banner" />
      <div className="page-section assessments-page-body">
        <div className="container-wide">
          <div className="assessments-loading-stats-row" aria-hidden="true">
            <Skeleton variant="card" className="catalog-insight catalog-insight--copper" style={{ minHeight: '3rem' }} />
            <div className="assessments-loading-filter-slot">
              <Skeleton variant="text" className="assessments-loading-filter-btn" />
            </div>
          </div>

          <div className="assessments-catalog-grid" aria-hidden="true">
            <div className="assessment-card-row">
              {Array.from({ length: 4 }).map((_, i) => (
                <AssessmentCardSkeleton key={i} />
              ))}
            </div>
            <hr className="assessment-catalog-row-divider" />
            <div className="assessment-card-row">
              {Array.from({ length: 4 }).map((_, i) => (
                <AssessmentCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
