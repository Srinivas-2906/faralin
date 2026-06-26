import { Skeleton } from '@faralin/ui';

export default function CourseLearnLoading() {
  return (
    <div className="course-learn-page">
      <div className="course-learn-topbar">
        <div className="container-wide">
          <Skeleton variant="text" width="8rem" />
        </div>
      </div>
      <div className="course-learn-layout">
        <div className="course-learn-main">
          <Skeleton variant="card" className="course-video-skeleton" />
          <Skeleton variant="title" width="70%" />
        </div>
        <aside className="course-learn-sidebar">
          <Skeleton variant="card" style={{ minHeight: '20rem' }} />
        </aside>
      </div>
    </div>
  );
}
