'use client';

import Link from 'next/link';
import { Card } from '@faralin/ui';
import type { AssessmentListItem } from '@/components/assessment-card';
import type { ProblemTrackListItem } from '@/components/problem-tracks/track-card';
import { DashboardRecommendedSection } from '@/components/dashboard-recommended-section';
import { DashboardRecommendedTracks } from '@/components/dashboard-recommended-tracks';

export function DashboardProblemTracksSection({
  tracks,
}: {
  tracks: ProblemTrackListItem[];
}) {
  if (tracks.length === 0) return null;

  return (
    <section className="dashboard-section dashboard-tracks-section">
      <Card className="dashboard-recommended-panel">
        <header className="dashboard-section-head">
          <h2 className="dashboard-section-title">Recommended Problem Tracks</h2>
          <Link href="/tracks" className="dashboard-section-link">
            View all →
          </Link>
        </header>
        <DashboardRecommendedTracks tracks={tracks.slice(0, 5)} />
      </Card>
    </section>
  );
}

export function DashboardCombinedRecommended({
  assessments,
  tracks,
}: {
  assessments: AssessmentListItem[];
  tracks: ProblemTrackListItem[];
}) {
  return (
    <>
      <DashboardProblemTracksSection tracks={tracks} />
      <DashboardRecommendedSection assessments={assessments} />
    </>
  );
}
