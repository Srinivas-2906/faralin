'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  ResponsiveTable,
  SkeletonTable,
} from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { useStaffApi } from '@/lib/use-staff-api';

const STATUS_OPTIONS = [
  { value: 'FOLLOWER', label: 'Following' },
  { value: 'REFERRAL_CLICKED', label: 'Referral clicked' },
  { value: 'APPLIED', label: 'Applied' },
  { value: 'OFFER_RECEIVED', label: 'Offer received' },
  { value: 'OFFER_ACCEPTED', label: 'Offer accepted' },
  { value: 'ENROLLED', label: 'Enrolled' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
  { value: 'REJECTED', label: 'Rejected' },
] as const;

interface ApplicationRow {
  id: string;
  studentProfileId: string;
  anonymousId: string;
  displayName: string;
  status: string;
  pipelineLabel: string;
  subjectNames: string[];
  totalFaralins: number;
  performanceBand: string;
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
        prev.map((a) =>
          a.studentProfileId === studentProfileId
            ? {
                ...a,
                status,
                pipelineLabel:
                  STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status,
              }
            : a,
        ),
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
          <PageHeader title="Applications" description="Loading pipeline…" />
          <Card>
            <SkeletonTable rows={5} />
          </Card>
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
                  key: 'subjects',
                  header: 'Subjects',
                  render: (a) =>
                    a.subjectNames.length > 0 ? a.subjectNames.join(', ') : '—',
                },
                {
                  key: 'faralins',
                  header: 'Faralins',
                  render: (a) => a.totalFaralins.toLocaleString(),
                },
                {
                  key: 'band',
                  header: 'Band',
                  render: (a) => <Badge>{a.performanceBand}</Badge>,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (a) => (
                    <div>
                      <Badge variant="copper">{a.pipelineLabel}</Badge>
                      <div className="portal-status-actions" style={{ marginTop: '0.5rem' }}>
                        {STATUS_OPTIONS.map((option) => (
                          <Button
                            key={option.value}
                            type="button"
                            variant={a.status === option.value ? 'copper' : 'secondary'}
                            disabled={savingId === a.studentProfileId}
                            onClick={() => updateStatus(a.studentProfileId, option.value)}
                            aria-pressed={a.status === option.value}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
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
