import { Suspense } from 'react';
import Link from 'next/link';
import { HomeWideBanner } from '@/components/home-wide-banner';
import { CatalogFilterToolbar } from '@/components/catalog-filter-toolbar';
import { TracksCatalogInsight } from '@/components/tracks-catalog-insight';
import { TracksFilters } from '@/components/tracks-filters';
import { ProblemTrackCard, type ProblemTrackListItem } from '@/components/problem-tracks/track-card';
import { Card, EmptyState } from '@faralin/ui';
import { getSubjectImage } from '@/lib/media';

async function getTracks(): Promise<ProblemTrackListItem[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/api/problem-tracks`, { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch {
    // API may be offline
  }
  return [];
}

export default async function TracksPage({
  searchParams,
}: {
  searchParams: Promise<{ band?: string }>;
}) {
  const { band } = await searchParams;
  const allTracks = await getTracks();
  const tracks = band
    ? allTracks.filter((t) => t.difficultyBand === band)
    : allTracks;

  return (
    <div className="tracks-page">
      <HomeWideBanner
        imageSrc={getSubjectImage('physics')}
        imageAlt="Students investigating solar power for a science block"
        eyebrow="Problem Tracks"
        title="Learn something real. Solve something meaningful."
      />

      <div className="page-section tracks-page-body">
        <div className="container-wide">
          <Suspense fallback={null}>
            <CatalogFilterToolbar insight={<TracksCatalogInsight filters={<TracksFilters />} />} />
          </Suspense>

          {tracks.length === 0 ? (
            <Card>
              <EmptyState
                message={
                  allTracks.length === 0
                    ? 'No Problem Tracks available yet. Start the API and run db:seed.'
                    : 'No tracks match this difficulty filter.'
                }
              />
            </Card>
          ) : (
            <div className="assessments-catalog-grid tracks-catalog-grid">
              {tracks.map((track) => (
                <ProblemTrackCard key={track.slug} track={track} />
              ))}
            </div>
          )}

          <p className="tracks-page-footer text-muted">
            Each track includes learn blocks, practice, a main solve, personal application, reflection,
            and a portfolio output.{' '}
            <Link href="/dashboard#completed-tracks">View completed tracks on your dashboard</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
