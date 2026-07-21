'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Card, EmptyState, PageHeader, ResponsiveTable, Skeleton } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { useStaffApi } from '@/lib/use-staff-api';

const STATUS_OPTIONS = [
  'FOLLOWER',
  'REFERRAL_CLICKED',
  'APPLIED',
  'OFFER_RECEIVED',
  'OFFER_ACCEPTED',
  'ENROLLED',
  'WITHDRAWN',
  'REJECTED',
] as const;

interface ApplicationRow {
  id: string;
  studentProfileId: string;
  anonymousId: string;
  displayName: string;
  status: string;
  updatedAt: string;
}

export default function ApplicationsPage() {
  const { staffFetch, accessDenied } = useStaffApi();
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await staffFetch<ApplicationRow[]>('/applications/staff');
      if (data) setApplications(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [staffFetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(studentProfileId: string, status: string) {
    setSavingId(studentProfileId);
    try {
      await staffFetch(`/applications/staff/${studentProfileId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setApplications((prev) =>
        prev.map((a) => (a.studentProfileId === studentProfileId ? { ...a, status } : a)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setSavingId(null);
    }
  }

  if (accessDenied) return <AccessDenied />;
  if (loading) {
    return (
      <div className="page-section">
        <div className="container">
          <Skeleton variant="title" width="35%" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="Applications"
          description="Admissions pipeline — students are shown by anonymous ID only."
        />

        {error && (
          <div style={{ marginBottom: '1rem' }}>
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <Card>
          {applications.length === 0 ? (
            <EmptyState compact message="No applications in the pipeline yet." />
          ) : (
            <ResponsiveTable<ApplicationRow>
              columns={[
                { key: 'id', header: 'Anonymous ID', render: (a) => a.anonymousId },
                {
                  key: 'status',
                  header: 'Status',
                  render: (a) => (
                    <select
                      value={a.status}
                      disabled={savingId === a.studentProfileId}
                      onChange={(e) => updateStatus(a.studentProfileId, e.target.value)}
                      aria-label={`Status for ${a.anonymousId}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  ),
                },
                {
                  key: 'updated',
                  header: 'Updated',
                  render: (a) => new Date(a.updatedAt).toLocaleDateString(),
                },
              ]}
              data={applications}
              getRowKey={(a) => a.id}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
