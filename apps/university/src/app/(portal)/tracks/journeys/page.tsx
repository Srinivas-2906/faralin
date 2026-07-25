'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, EmptyState, PageHeader, ResponsiveTable } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { PortalPageSkeleton } from '@/components/portal-page-skeleton';
import { useStaffApi } from '@/lib/use-staff-api';

interface JourneyRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  milestones: Array<{ trackSlug: string; label: string; sortOrder: number }>;
  config: { enabled: boolean };
}

export default function TrackJourneysPage() {
  const { staffFetch, accessDenied } = useStaffApi();
  const [journeys, setJourneys] = useState<JourneyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const data = await staffFetch<{ journeys: JourneyRow[] }>('/universities/staff/journeys/library');
    if (data) setJourneys(data.journeys);
    setLoading(false);
  }, [staffFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (journey: JourneyRow) => {
    await staffFetch(`/universities/staff/journeys/${journey.id}/config`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled: !journey.config.enabled }),
    });
    await load();
  };

  if (accessDenied) return <AccessDenied />;
  if (loading) return <PortalPageSkeleton rows={3} />;

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="Track Journeys"
          description="Enable structured problem-track pathways for your students."
          actions={
            <Button type="button" variant="secondary" onClick={() => load()}>
              Refresh
            </Button>
          }
        />
        <Card>
          {journeys.length === 0 ? (
            <EmptyState compact message="No journeys available." />
          ) : (
            <ResponsiveTable<JourneyRow>
              columns={[
                { key: 'title', header: 'Journey', render: (row) => row.title },
                {
                  key: 'milestones',
                  header: 'Tracks',
                  render: (row) => row.milestones.map((m) => m.label).join(' → '),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => (
                    <Badge>{row.config.enabled ? 'Enabled' : 'Disabled'}</Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <Button
                      type="button"
                      variant={row.config.enabled ? 'secondary' : 'primary'}
                      onClick={() => toggle(row)}
                    >
                      {row.config.enabled ? 'Disable' : 'Enable'}
                    </Button>
                  ),
                },
              ]}
              data={journeys}
              getRowKey={(row) => row.id}
              paginated
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              maxHeight="520px"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
