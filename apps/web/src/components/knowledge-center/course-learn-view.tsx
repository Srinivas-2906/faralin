'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert, Skeleton } from '@faralin/ui';
import {
  CourseVideoPlayer,
  fetchCourseProgress,
} from '@/components/knowledge-center/course-video-player';
import { CourseCurriculum } from '@/components/knowledge-center/course-curriculum';
import type { CourseDetail, CourseLearnData, CourseProgress } from '@/lib/knowledge';

export function CourseLearnView({
  courseSlug,
  initialLearn,
  courseSummary,
}: {
  courseSlug: string;
  initialLearn: CourseLearnData;
  courseSummary: CourseDetail;
}) {
  const { isSignedIn, getToken } = useAuth();
  const searchParams = useSearchParams();
  const lessonParam = searchParams.get('lesson');

  const [learn, setLearn] = useState(initialLearn);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(false);

  const allLessons = useMemo(
    () => learn.sections.flatMap((section) => section.lessons),
    [learn.sections],
  );

  const activeLesson = useMemo(() => {
    const fromParam = lessonParam ? allLessons.find((l) => l.id === lessonParam) : null;
    return fromParam ?? allLessons.find((l) => l.id === learn.activeLessonId) ?? allLessons[0];
  }, [allLessons, learn.activeLessonId, lessonParam]);

  const activeIndex = allLessons.findIndex((l) => l.id === activeLesson?.id);
  const prevLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
  const nextLesson =
    activeIndex >= 0 && activeIndex < allLessons.length - 1
      ? allLessons[activeIndex + 1]
      : null;

  const loadProgress = useCallback(async () => {
    if (!isSignedIn) {
      setProgress(null);
      return;
    }
    const token = await getToken();
    if (!token) return;
    const data = await fetchCourseProgress(courseSlug, token);
    setProgress(data);
  }, [courseSlug, getToken, isSignedIn]);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    if (!lessonParam) return;
    setLoading(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/knowledge/courses/${courseSlug}/learn?lesson=${encodeURIComponent(lessonParam)}`,
      { cache: 'no-store' },
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CourseLearnData | null) => {
        if (data) setLearn(data);
      })
      .finally(() => setLoading(false));
  }, [courseSlug, lessonParam]);

  if (!activeLesson) {
    return <Alert variant="error">This course has no lessons yet.</Alert>;
  }

  const locked = !isSignedIn && !activeLesson.isPreviewFree;

  if (locked) {
    return (
      <div className="course-learn-layout">
        <div className="course-learn-main">
          <Alert variant="info">
            Sign in to access full course content. Preview lessons are available on the course page.
          </Alert>
          <Link href="/sign-in" className="btn btn-primary">
            Sign in to continue
          </Link>
        </div>
        <aside className="course-learn-sidebar">
          <CourseCurriculum
            course={courseSummary}
            courseSlug={courseSlug}
            showLinks
            activeLessonId={activeLesson.id}
            progress={progress}
          />
        </aside>
      </div>
    );
  }

  const initialPosition = progress?.lastPositions[activeLesson.id] ?? 0;

  return (
    <div className="course-learn-layout">
      <div className="course-learn-main">
        {loading ? (
          <Skeleton className="course-video-skeleton" />
        ) : (
          <CourseVideoPlayer
            lessonId={activeLesson.id}
            courseSlug={courseSlug}
            videoUrl={activeLesson.videoUrl}
            title={activeLesson.title}
            initialPosition={initialPosition}
            onComplete={() => {
              void loadProgress();
            }}
          />
        )}

        <div className="course-learn-lesson-nav">
          <div>
            <p className="course-learn-lesson-label">Now playing</p>
            <h1 className="course-learn-lesson-title">{activeLesson.title}</h1>
          </div>
          <div className="course-learn-lesson-actions">
            {prevLesson && (
              <Link
                href={`/knowledge-center/courses/${courseSlug}/learn?lesson=${prevLesson.id}`}
                className="btn btn-secondary"
              >
                ← Previous
              </Link>
            )}
            {nextLesson && (
              <Link
                href={`/knowledge-center/courses/${courseSlug}/learn?lesson=${nextLesson.id}`}
                className="btn btn-primary"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      </div>

      <aside className="course-learn-sidebar">
        <p className="course-learn-sidebar-title">{learn.title}</p>
        <CourseCurriculum
          course={courseSummary}
          courseSlug={courseSlug}
          showLinks
          activeLessonId={activeLesson.id}
          progress={progress}
        />
      </aside>
    </div>
  );
}
