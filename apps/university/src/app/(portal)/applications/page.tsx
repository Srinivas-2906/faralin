'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  ResponsiveTable,
  SkeletonTable,
  Tabs,
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

const PIPELINE_TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active pipeline' },
  { id: 'FOLLOWER', label: 'Following' },
  { id: 'APPLIED', label: 'Applied' },
  { id: 'ENROLLED', label: 'Enrolled' },
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
  const [success, setSuccess] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<(typeof PIPELINE_TABS)[number]['id']>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesQuery =
        !q ||
        application.anonymousId.toLowerCase().includes(q) ||
        application.displayName.toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (tab === 'all') return true;
      if (tab === 'active') {
        return !['WITHDRAWN', 'REJECTED', 'FOLLOWER'].includes(application.status);
      }
      return application.status === tab;
    });
  }, [applications, query, tab]);

  const applicationColumns = [
    { key: 'id', header: 'Anonymous ID', render: (a: ApplicationRow) => a.anonymousId },
    {
      key: 'subjects',
      header: 'Subjects',
      render: (a: ApplicationRow) =>
        a.subjectNames.length > 0 ? a.subjectNames.join(', ') : '—',
    },
    {
      key: 'faralins',
      header: 'Faralins',
      render: (a: ApplicationRow) => a.totalFaralins.toLocaleString(),
    },
    {
      key: 'band',
      header: 'Band',
      render: (a: ApplicationRow) => <Badge>{a.performanceBand}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (a: ApplicationRow) => (
        <select
          className="portal-status-select"
          value={a.status}
          disabled={savingId === a.studentProfileId}
          onChange={(e) => updateStatus(a.studentProfileId, e.target.value)}
          aria-label={`Status for ${a.anonymousId}`}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'updated',
      header: 'Updated',
      render: (a: ApplicationRow) => new Date(a.updatedAt).toLocaleDateString(),
    },
  ] as const;

  async function updateStatus(studentProfileId: string, status: string) {
    setSavingId(studentProfileId);
    setSuccess('');
    const previous = applications.find((a) => a.studentProfileId === studentProfileId);
    setApplications((prev) =>
      prev.map((a) =>
        a.studentProfileId === studentProfileId
          ? {
              ...a,
              status,
              pipelineLabel:
                STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status,
            }
          : a,
      ),
    );
    try {
      await staffFetch(`/applications/staff/${studentProfileId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setSuccess(`Updated ${previous?.anonymousId ?? 'application'}`);
    } catch (e) {
      if (previous) {
        setApplications((prev) =>
          prev.map((a) => (a.studentProfileId === studentProfileId ? previous : a)),
        );
      }
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
          actions={
            <Button type="button" variant="secondary" onClick={() => load()}>
              Refresh
            </Button>
          }
        />

        {error && (
          <div style={{ marginBottom: '1rem' }}>
            <Alert variant="error">{error}</Alert>
          </div>
        )}
        {success && (
          <div style={{ marginBottom: '1rem' }}>
            <Alert variant="success">{success}</Alert>
          </div>
        )}

        <Card>
          <div className="portal-card-toolbar">
            <input
              type="search"
              className="portal-search"
              placeholder="Search anonymous ID…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              aria-label="Search applications"
            />
            <Tabs
              ariaLabel="Pipeline filters"
              activeId={tab}
              onChange={(id) => {
                setTab(id as typeof tab);
                setPage(1);
              }}
              tabs={PIPELINE_TABS.map((item) => ({ id: item.id, label: item.label }))}
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact message="No applications match this filter." />
          ) : (
            <ResponsiveTable<ApplicationRow>
              columns={[...applicationColumns]}
              data={filtered}
              getRowKey={(a) => a.id}
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
