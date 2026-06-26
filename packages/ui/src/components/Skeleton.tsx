import type { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'title' | 'stat' | 'card' | 'block';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = 'block',
  width,
  height,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const variantClass =
    variant === 'text'
      ? 'skeleton-text'
      : variant === 'title'
        ? 'skeleton-title'
        : variant === 'stat'
          ? 'skeleton-stat'
          : variant === 'card'
            ? 'skeleton-card'
            : '';

  return (
    <div
      className={`skeleton ${variantClass} ${className}`.trim()}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card">
      <Skeleton variant="title" />
      <Skeleton variant="text" />
      <Skeleton variant="text" width="80%" />
    </div>
  );
}

export function SkeletonTable({ rows = 4 }: { rows?: number }) {
  return (
    <div className="stack-sm">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height="2.5rem" />
      ))}
    </div>
  );
}

function CompactAssessmentCardSkeleton() {
  return (
    <div className="assessment-card-skeleton">
      <Skeleton variant="card" className="assessment-card-skeleton-visual dashboard-recommended-skeleton-visual" />
      <div className="assessment-card-skeleton-details">
        <Skeleton variant="text" width="35%" height="0.5rem" />
        <Skeleton variant="title" width="85%" height="0.875rem" />
        <Skeleton variant="text" width="55%" height="0.625rem" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="page-section dashboard-page">
      <div className="container-wide">
        <div className="dashboard-stats-row" aria-hidden="true">
          <Skeleton variant="title" width="12rem" height="1.5rem" className="dashboard-greeting" />
          <div className="assessments-stats">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="assessments-stat">
                <Skeleton variant="title" width="3rem" style={{ marginBottom: '0.35rem' }} />
                <Skeleton variant="text" width="4.5rem" />
              </div>
            ))}
          </div>
        </div>

        <section className="dashboard-section">
          <div className="card dashboard-recommended-panel">
            <div className="dashboard-section-head" aria-hidden="true">
              <Skeleton variant="text" width="10rem" height="0.75rem" />
              <Skeleton variant="text" width="5rem" height="0.75rem" />
            </div>
            <div className="dashboard-carousel" aria-hidden="true">
              <div className="dashboard-carousel-viewport">
                <div className="dashboard-carousel-track">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="dashboard-carousel-item">
                      <CompactAssessmentCardSkeleton />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="dashboard-bento">
          <div className="card dashboard-bento-panel">
            <div className="dashboard-section-head" aria-hidden="true">
              <Skeleton variant="text" width="12rem" height="0.75rem" />
              <Skeleton variant="text" width="5rem" height="0.75rem" />
            </div>
            <div className="dashboard-bento-body">
              <div className="dashboard-bento-list">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} height="4.75rem" style={{ borderRadius: '4px' }} />
                ))}
              </div>
            </div>
          </div>
          <div className="card dashboard-bento-panel">
            <div className="dashboard-section-head" aria-hidden="true">
              <Skeleton variant="text" width="5rem" height="0.75rem" />
              <Skeleton variant="text" width="5rem" height="0.75rem" />
            </div>
            <div className="dashboard-bento-body">
              <div className="dashboard-bento-list">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} height="4.75rem" style={{ borderRadius: '4px' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
