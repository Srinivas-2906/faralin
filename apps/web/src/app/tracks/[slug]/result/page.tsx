import { TrackResultView } from '@/components/problem-tracks/track-step-runner';

export default async function TrackResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const { slug } = await params;
  const { attempt } = await searchParams;

  if (!attempt) {
    return (
      <div className="page-section container-wide">
        <p>Missing attempt ID.</p>
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="container-wide">
        <TrackResultView slug={slug} attemptId={attempt} />
      </div>
    </div>
  );
}
