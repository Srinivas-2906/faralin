'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@faralin/utils';
import type { CourseProgress } from '@/lib/knowledge';

export function CourseVideoPlayer({
  lessonId,
  courseSlug,
  videoUrl,
  title,
  initialPosition = 0,
  onComplete,
}: {
  lessonId: string;
  courseSlug: string;
  videoUrl: string;
  title: string;
  initialPosition?: number;
  onComplete?: () => void;
}) {
  const { isSignedIn, getToken } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedRef = useRef(0);

  const saveProgress = useCallback(
    async (payload: { completed?: boolean; lastPositionSeconds?: number }) => {
      if (!isSignedIn) return;
      const token = await getToken();
      if (!token) return;
      try {
        await apiFetch(`/knowledge/courses/${courseSlug}/progress`, {
          method: 'POST',
          token,
          body: JSON.stringify({ lessonId, ...payload }),
        });
        if (payload.completed) onComplete?.();
      } catch {
        // ignore
      }
    },
    [courseSlug, getToken, isSignedIn, lessonId, onComplete],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (initialPosition > 0 && initialPosition < video.duration - 5) {
      video.currentTime = initialPosition;
    }
  }, [initialPosition, lessonId, videoUrl]);

  return (
    <div className="course-video-shell">
      <video
        ref={videoRef}
        key={lessonId}
        className="course-video-player"
        controls
        playsInline
        preload="metadata"
        onTimeUpdate={(event) => {
          const current = Math.floor(event.currentTarget.currentTime);
          if (current - lastSavedRef.current < 5) return;
          lastSavedRef.current = current;
          void saveProgress({ lastPositionSeconds: current });
        }}
        onEnded={() => {
          void saveProgress({ completed: true, lastPositionSeconds: 0 });
        }}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support video playback.
      </video>
      <p className="course-video-caption">{title}</p>
    </div>
  );
}

export async function fetchCourseProgress(
  courseSlug: string,
  token: string,
): Promise<CourseProgress | null> {
  try {
    return await apiFetch<CourseProgress>(`/knowledge/courses/${courseSlug}/progress`, { token });
  } catch {
    return null;
  }
}
