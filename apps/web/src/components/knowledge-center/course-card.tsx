import { Badge, MediaImage } from '@faralin/ui';
import { COURSE_LEVEL_LABELS } from '@faralin/types';
import { getSubjectImage } from '@/lib/media';
import { formatDurationMinutes, type CourseListItem } from '@/lib/knowledge';

export function CourseCard({ course }: { course: CourseListItem }) {
  const coverSubject = course.subjectTags[0] ?? 'mathematics';
  const thumbnail = course.thumbnailUrl ?? getSubjectImage(coverSubject);
  const levelLabel =
    COURSE_LEVEL_LABELS[course.level as keyof typeof COURSE_LEVEL_LABELS] ?? course.level;

  return (
    <a
      href={`/knowledge-center/courses/${course.slug}`}
      className="media-card assessment-card-split course-card"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="assessment-card-visual">
        <MediaImage
          src={thumbnail}
          alt=""
          aspect="16x9"
          frameClassName="media-frame--fill"
        />
        <div className="assessment-card-badges-overlay" aria-hidden="true" />
        <div className="assessment-card-badges">
          <Badge variant="copper">{levelLabel}</Badge>
        </div>
      </div>
      <div className="assessment-card-details">
        <div className="media-card-eyebrow">{course.instructorName}</div>
        <div className="media-card-title">{course.title}</div>
        <div className="media-card-meta">
          {formatDurationMinutes(course.durationMinutes)} · {course.lessonCount} lessons
        </div>
      </div>
    </a>
  );
}
