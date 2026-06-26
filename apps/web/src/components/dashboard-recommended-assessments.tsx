'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AssessmentCard, type AssessmentListItem } from '@/components/assessment-card';
import { smoothScrollTo } from '@/lib/smooth-scroll';

export function DashboardRecommendedAssessments({
  assessments,
}: {
  assessments: AssessmentListItem[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const cancelScrollRef = useRef<(() => void) | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const { scrollLeft, scrollWidth, clientWidth } = track;
    setCanPrev(scrollLeft > 2);
    setCanNext(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const runUpdate = () => requestAnimationFrame(updateScrollState);

    runUpdate();

    track.addEventListener('scroll', runUpdate, { passive: true });
    window.addEventListener('resize', runUpdate);

    const observer = new ResizeObserver(runUpdate);
    observer.observe(track);

    return () => {
      track.removeEventListener('scroll', runUpdate);
      window.removeEventListener('resize', runUpdate);
      observer.disconnect();
      cancelScrollRef.current?.();
    };
  }, [updateScrollState, assessments.length]);

  const scroll = (direction: 'prev' | 'next') => {
    const track = trackRef.current;
    if (!track || isAnimating) return;

    const items = track.querySelectorAll<HTMLElement>('.dashboard-carousel-item');
    if (!items.length) return;

    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const step = items[0].offsetWidth + gap;
    const currentIndex = Math.round(track.scrollLeft / step);
    const targetIndex =
      direction === 'next'
        ? Math.min(currentIndex + 1, items.length - 1)
        : Math.max(currentIndex - 1, 0);

    if (targetIndex === currentIndex) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      track.scrollTo({ left: targetIndex * step, behavior: 'auto' });
      return;
    }

    cancelScrollRef.current?.();
    setIsAnimating(true);
    track.classList.add('is-animating');

    cancelScrollRef.current = smoothScrollTo(track, targetIndex * step, 480);

    window.setTimeout(() => {
      track.classList.remove('is-animating');
      setIsAnimating(false);
      updateScrollState();
    }, 480);
  };

  return (
    <div className="dashboard-carousel">
      <div className="dashboard-carousel-viewport">
        <button
          type="button"
          className="dashboard-carousel-nav dashboard-carousel-nav--prev"
          aria-label="Previous assessments"
          disabled={!canPrev || isAnimating}
          onClick={() => scroll('prev')}
        >
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M7.5 2L4 6L7.5 10"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div
          ref={trackRef}
          className="dashboard-carousel-track"
          role="region"
          aria-label="Recommended assessments"
        >
          {assessments.map((a) => (
            <div key={a.slug} className="dashboard-carousel-item">
              <AssessmentCard assessment={a} compact />
            </div>
          ))}
        </div>

        <button
          type="button"
          className="dashboard-carousel-nav dashboard-carousel-nav--next"
          aria-label="Next assessments"
          disabled={!canNext || isAnimating}
          onClick={() => scroll('next')}
        >
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M4.5 2L8 6L4.5 10"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
