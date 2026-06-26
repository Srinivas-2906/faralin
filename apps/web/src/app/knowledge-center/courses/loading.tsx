import { Skeleton } from '@faralin/ui';
import { CardSkeleton } from '../loading';

export default function CoursesLoading() {
  return (
    <div className="knowledge-center-page">
      <Skeleton variant="card" className="knowledge-center-loading-banner" />
      <div className="page-section knowledge-center-page-body">
        <div className="container-wide">
          <Skeleton variant="card" className="catalog-insight catalog-insight--copper" style={{ minHeight: '3rem', marginBottom: '1.5rem' }} />
          <div className="assessments-catalog-grid" aria-hidden="true">
            <div className="assessment-card-row">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
