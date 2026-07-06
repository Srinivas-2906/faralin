import { notFound } from 'next/navigation';
import { TrackHero } from '@/components/problem-tracks/track-step-runner';
import { TRACK_DIFFICULTY_LABELS } from '@faralin/types';

export default async function TrackDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const res = await fetch(`${apiUrl}/api/problem-tracks/${slug}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) notFound();
  const track = await res.json();

  return (
    <div className="page-section">
      <div className="container-wide">
        <TrackHero
          track={{
            ...track,
            difficultyBand: track.difficultyBand as keyof typeof TRACK_DIFFICULTY_LABELS,
          }}
        />
      </div>
    </div>
  );
}
