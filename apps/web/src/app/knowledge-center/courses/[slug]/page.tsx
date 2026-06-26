import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, MediaImage } from '@faralin/ui';
import { COURSE_LEVEL_LABELS } from '@faralin/types';
import { CourseCurriculum } from '@/components/knowledge-center/course-curriculum';
import { getSubjectImage } from '@/lib/media';
import { formatDurationMinutes, getCourse } from '@/lib/knowledge';

export default async function CourseLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  const thumbnail = course.thumbnailUrl ?? getSubjectImage(course.subjectTags[0] ?? 'mathematics');
  const levelLabel =
    COURSE_LEVEL_LABELS[course.level as keyof typeof COURSE_LEVEL_LABELS] ?? course.level;
  const firstLesson = course.sections[0]?.lessons[0];

  return (
    <div className="page-section course-landing-page">
      <div className="container-wide">
        <div className="course-landing-grid">
          <div className="course-landing-main">
            <p className="course-landing-eyebrow">{course.instructorName}</p>
            <h1 className="course-landing-title">{course.title}</h1>
            {course.subtitle && <p className="course-landing-subtitle">{course.subtitle}</p>}

            <div className="course-landing-meta">
              <Badge variant="copper">{levelLabel}</Badge>
              <span>{formatDurationMinutes(course.durationMinutes)}</span>
              <span>{course.lessonCount} lessons</span>
            </div>

            <div className="course-landing-section">
              <h2 className="course-landing-section-title">About this course</h2>
              <p className="course-landing-description">{course.description}</p>
            </div>

            {course.learningOutcomes.length > 0 && (
              <div className="course-landing-section">
                <h2 className="course-landing-section-title">What you&apos;ll learn</h2>
                <ul className="course-landing-outcomes">
                  {course.learningOutcomes.map((outcome) => (
                    <li key={outcome}>{outcome}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="course-landing-section">
              <h2 className="course-landing-section-title">Course content</h2>
              <CourseCurriculum course={course} courseSlug={course.slug} />
            </div>
          </div>

          <aside className="course-landing-aside">
            <div className="course-landing-card">
              <div className="course-landing-card-visual">
                <MediaImage
                  src={thumbnail}
                  alt=""
                  aspect="16x9"
                  frameClassName="media-frame--fill"
                />
              </div>
              {firstLesson ? (
                <Link
                  href={`/knowledge-center/courses/${course.slug}/learn?lesson=${firstLesson.id}`}
                  className="btn btn-primary btn-block btn-lg"
                >
                  Start course
                </Link>
              ) : (
                <button type="button" className="btn btn-primary btn-block btn-lg" disabled>
                  Coming soon
                </button>
              )}
              <p className="course-landing-card-note">
                Preview the first free lesson without signing in.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
