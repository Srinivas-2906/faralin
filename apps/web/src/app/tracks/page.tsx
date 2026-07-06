import Link from 'next/link';
import { ProblemTrackCard, type ProblemTrackListItem } from '@/components/problem-tracks/track-card';
import { Card, EmptyState } from '@faralin/ui';

export default async function TracksPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  let tracks: ProblemTrackListItem[] = [];

  try {
    const res = await fetch(`${apiUrl}/api/problem-tracks`, { next: { revalidate: 60 } });
    if (res.ok) tracks = await res.json();
  } catch {
    // API may be offline
  }

  return (
    <div className="page-section">
      <div className="container-wide">
        <header className="catalog-header">
          <h1>Problem Tracks</h1>
          <p className="text-muted catalog-lead">
            Learn something real. Solve something meaningful. Prove how you think. Earn recognition.
          </p>
        </header>

        {tracks.length === 0 ? (
          <Card>
            <EmptyState message="No Problem Tracks available yet. Start the API and run db:seed." />
          </Card>
        ) : (
          <div className="assessments-catalog-grid tracks-catalog-grid">
            {tracks.map((track) => (
              <ProblemTrackCard key={track.slug} track={track} />
            ))}
          </div>
        )}

        <p className="text-muted" style={{ marginTop: '2rem' }}>
          Problem Tracks are guided investigations — not quizzes. Each track includes learn blocks,
          practice, a main solve, personal application, reflection, and portfolio output.{' '}
          <Link href="/dashboard">View your dashboard</Link>
        </p>
      </div>
    </div>
  );
}
