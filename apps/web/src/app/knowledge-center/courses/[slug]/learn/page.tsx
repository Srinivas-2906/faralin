import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CourseLearnView } from '@/components/knowledge-center/course-learn-view';
import { getCourse, getCourseLearn } from '@/lib/knowledge';

export default async function CourseLearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { slug } = await params;
  const { lesson } = await searchParams;

  const [course, learn] = await Promise.all([
    getCourse(slug),
    getCourseLearn(slug, lesson),
  ]);

  if (!course || !learn) notFound();

  return (
    <div className="course-learn-page">
      <div className="course-learn-topbar">
        <div className="container-wide course-learn-topbar-inner">
          <Link href={`/knowledge-center/courses/${slug}`} className="course-learn-back">
            ← Back to course
          </Link>
          <p className="course-learn-topbar-title">{course.title}</p>
        </div>
      </div>

      <Suspense fallback={null}>
        <CourseLearnView
          courseSlug={slug}
          initialLearn={learn}
          courseSummary={course}
        />
      </Suspense>
    </div>
  );
}
