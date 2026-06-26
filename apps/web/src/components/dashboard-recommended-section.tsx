'use client';

import { useCallback, useRef, useState } from 'react';
import { Card } from '@faralin/ui';
import { AssessmentCard, type AssessmentListItem } from '@/components/assessment-card';
import { DashboardRecommendedAssessments } from '@/components/dashboard-recommended-assessments';

const PREVIEW_COUNT = 5;
const EXPAND_DURATION_MS = 480;

export function DashboardRecommendedSection({
  assessments,
}: {
  assessments: AssessmentListItem[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  if (assessments.length === 0) return null;

  const previewAssessments = assessments.slice(0, PREVIEW_COUNT);
  const showToggle = assessments.length > PREVIEW_COUNT;

  const toggleExpanded = useCallback(() => {
    const body = bodyRef.current;
    const content = contentRef.current;

    if (!body || !content) {
      setExpanded((value) => !value);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || isAnimating) {
      if (!isAnimating) setExpanded((value) => !value);
      return;
    }

    const startHeight = body.offsetHeight;
    body.style.overflow = 'hidden';
    body.style.height = `${startHeight}px`;
    setIsAnimating(true);

    setExpanded((value) => !value);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const endHeight = content.offsetHeight;
        body.style.transition = `height ${EXPAND_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        body.style.height = `${endHeight}px`;

        window.setTimeout(() => {
          body.style.height = '';
          body.style.overflow = '';
          body.style.transition = '';
          setIsAnimating(false);
        }, EXPAND_DURATION_MS);
      });
    });
  }, [isAnimating]);

  return (
    <section
      className={`dashboard-section${expanded ? ' dashboard-recommended-section--expanded' : ''}`}
    >
      <Card className="dashboard-recommended-panel">
        <header className="dashboard-section-head">
          <h2 className="dashboard-section-title">Recommended for you</h2>
          {showToggle && (
            <button
              type="button"
              className="dashboard-section-link"
              onClick={toggleExpanded}
              aria-expanded={expanded}
              disabled={isAnimating}
            >
              {expanded ? 'Show less ↑' : 'View all →'}
            </button>
          )}
        </header>

        <div ref={bodyRef} className="dashboard-recommended-body">
          <div
            key={expanded ? 'expanded' : 'collapsed'}
            ref={contentRef}
            className="dashboard-recommended-content"
          >
            {expanded ? (
              <div className="dashboard-recommended-grid">
                {assessments.map((assessment) => (
                  <AssessmentCard key={assessment.slug} assessment={assessment} />
                ))}
              </div>
            ) : (
              <DashboardRecommendedAssessments assessments={previewAssessments} />
            )}
          </div>
        </div>
      </Card>
    </section>
  );
}
