'use client';

import { Card, EmptyState, PageHeader, ResponsiveTable } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { AdminPageSkeleton } from '@/components/admin-page-skeleton';
import { useAdminData } from '@/components/admin-provider';

export default function PlatformModerationPage() {
  const { data, loading, error, accessDenied } = useAdminData<
    Array<{
      id: string;
      rubricScore: number | string;
      faralinsEarned: number | null;
      trustLevel: string | null;
      problemTrack: { title: string };
      studentProfile: { anonymousId: string };
    }>
  >('/admin/problem-tracks/moderation');

  if (accessDenied) return <AccessDenied />;
  if (loading && !data) return <AdminPageSkeleton rows={6} />;

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader title="Moderation queue" description="Problem track submissions awaiting review" />
        <Card>
          {error ? (
            <PageHeader title="Moderation queue" description={error} />
          ) : !data || data.length === 0 ? (
            <EmptyState compact message="No submissions awaiting review." />
          ) : (
            <ResponsiveTable
              columns={[
                { key: 'track', header: 'Track', render: (m) => m.problemTrack.title },
                { key: 'student', header: 'Student', render: (m) => m.studentProfile.anonymousId },
                { key: 'score', header: 'Score', render: (m) => `${m.rubricScore}%` },
                { key: 'faralins', header: 'Faralins', render: (m) => m.faralinsEarned ?? 0 },
                { key: 'trust', header: 'Trust', render: (m) => m.trustLevel ?? '—' },
              ]}
              data={data}
              getRowKey={(m) => m.id}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
