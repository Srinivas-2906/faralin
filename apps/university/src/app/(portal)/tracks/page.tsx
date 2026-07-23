'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, EmptyState, PageHeader, ResponsiveTable } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { PortalPageSkeleton } from '@/components/portal-page-skeleton';
import { useStaffApi } from '@/lib/use-staff-api';

interface TrackRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  subjectName: string;
  difficultyBand: string;
  maxFaralins: number;
  config: { enabled: boolean; isCompulsory: boolean };
  baseReward: number;
}

export default function TracksPage() {
  const { staffFetch, accessDenied } = useStaffApi();
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await staffFetch<{ tracks: TrackRow[] }>('/universities/staff/tracks/library');
      if (data) setTracks(data.tracks);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tracks');
    } finally {
      setLoading(false);
    }
  }, [staffFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleEnabled = async (track: TrackRow) => {
    await staffFetch(`/universities/staff/tracks/${track.id}/config`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled: !track.config.enabled }),
    });
    await load();
  };

  if (accessDenied) return <AccessDenied />;
  if (loading) return <PortalPageSkeleton rows={4} />;

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="Problem Trackers"
          description="Enable structured journeys for your followers."
          actions={
            <Button type="button" variant="secondary" onClick={() => load()}>
              Refresh
            </Button>
          }
        />

        <Card>
          {error ? (
            <EmptyState compact message={error} />
          ) : tracks.length === 0 ? (
            <EmptyState compact message="No problem tracks available." />
          ) : (
            <ResponsiveTable<TrackRow>
              columns={[
                {
                  key: 'title',
                  header: 'Track',
                  render: (row) => (
                    <div>
                      <div>{row.title}</div>
                      {row.subtitle ? (
                        <div className="portal-table-meta">{row.subtitle}</div>
                      ) : null}
                    </div>
                  ),
                },
                { key: 'subject', header: 'Subject', render: (row) => row.subjectName },
                { key: 'band', header: 'Band', render: (row) => row.difficultyBand },
                {
                  key: 'reward',
                  header: 'Max Faralins',
                  render: (row) => row.baseReward.toLocaleString(),
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
                      onClick={() => toggleEnabled(row)}
                    >
                      {row.config.enabled ? 'Disable' : 'Enable'}
                    </Button>
                  ),
                },
              ]}
              data={tracks}
              getRowKey={(row) => row.id}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
