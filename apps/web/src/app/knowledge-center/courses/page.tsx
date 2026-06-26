import { Suspense } from 'react';
import { HomeWideBanner } from '@/components/home-wide-banner';
import { CoursesCatalog } from '@/components/knowledge-center/courses-catalog';
import { CoursesCatalogInsight } from '@/components/knowledge-center/knowledge-insights';
import { getSubjectImage } from '@/lib/media';
import { getCourses } from '@/lib/knowledge';

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="knowledge-center-page">
      <HomeWideBanner
        imageSrc={getSubjectImage('computer-science')}
        imageAlt=""
        eyebrow="Courses"
        title="Video courses with tracked progress."
      />

      <div className="page-section knowledge-center-page-body">
        <div className="container-wide">
          <div className="assessments-stats-row">
            <CoursesCatalogInsight />
          </div>
          <Suspense fallback={null}>
            <CoursesCatalog courses={courses} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
