import { TrackStepRunner } from '@/components/problem-tracks/track-step-runner';

export default async function TrackAttemptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="page-section">
      <div className="container-wide">
        <TrackStepRunner slug={slug} />
      </div>
    </div>
  );
}
