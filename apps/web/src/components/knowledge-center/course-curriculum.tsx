'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { apiFetch } from '@faralin/utils';
import { formatLessonDuration, type CourseDetail, type CourseProgress } from '@/lib/knowledge';

export function CourseCurriculum({
  course,
  courseSlug,
  showLinks = false,
  activeLessonId,
  progress,
}: {
  course: CourseDetail;
  courseSlug: string;
  showLinks?: boolean;
  activeLessonId?: string;
  progress?: CourseProgress | null;
}) {
  const { isSignedIn, getToken } = useAuth();
  const [localProgress, setLocalProgress] = useState<CourseProgress | null>(progress ?? null);

  useEffect(() => {
    if (progress) {
      setLocalProgress(progress);
      return;
    }
    if (!isSignedIn) return;

    getToken().then(async (token) => {
      if (!token) return;
      try {
        const data = await apiFetch<CourseProgress>(`/knowledge/courses/${courseSlug}/progress`, {
          token,
        });
        setLocalProgress(data);
      } catch {
        // ignore
      }
    });
  }, [courseSlug, getToken, isSignedIn, progress]);

  const completed = new Set(localProgress?.completedLessonIds ?? []);

  return (
    <div className="course-curriculum">
      {localProgress && (
        <div className="course-curriculum-progress">
          <div className="course-curriculum-progress-label">
            <span>Your progress</span>
            <span>{localProgress.percentComplete}%</span>
          </div>
          <div className="course-curriculum-progress-bar">
            <div
              className="course-curriculum-progress-fill"
              style={{ width: `${localProgress.percentComplete}%` }}
            />
          </div>
        </div>
      )}

      {course.sections.map((section) => (
        <details key={section.id} className="course-curriculum-section" open>
          <summary className="course-curriculum-section-title">{section.title}</summary>
          <ul className="course-curriculum-lessons">
            {section.lessons.map((lesson) => {
              const isCompleted = completed.has(lesson.id);
              const isActive = lesson.id === activeLessonId;
              const locked = !isSignedIn && !lesson.isPreviewFree;

              const content = (
                <>
                  <span className="course-curriculum-lesson-status" aria-hidden="true">
                    {isCompleted ? '✓' : locked ? '🔒' : isActive ? '▶' : '○'}
                  </span>
                  <span className="course-curriculum-lesson-title">{lesson.title}</span>
                  <span className="course-curriculum-lesson-duration">
                    {formatLessonDuration(lesson.durationSeconds)}
                  </span>
                </>
              );

              return (
                <li
                  key={lesson.id}
                  className={`course-curriculum-lesson${isActive ? ' is-active' : ''}${
                    locked ? ' is-locked' : ''
                  }`}
                >
                  {showLinks && !locked ? (
                    <Link
                      href={`/knowledge-center/courses/${courseSlug}/learn?lesson=${lesson.id}`}
                      className="course-curriculum-lesson-link"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="course-curriculum-lesson-link">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </details>
      ))}
    </div>
  );
}
