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

  const grouped = useMemo(() => {
    const groups: Record<string, ApplicationRow[]> = {};
    for (const application of filtered) {
      if (!groups[application.status]) groups[application.status] = [];
      groups[application.status].push(application);
    }
    return groups;
  }, [filtered]);

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

        <div className="portal-stack">
        <Card>
          <div className="portal-card-toolbar">
            <input
              type="search"
              className="portal-search"
              placeholder="Search anonymous ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search applications"
            />
            <div className="portal-tabs" role="tablist" aria-label="Pipeline filters">
              {PIPELINE_TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  className={`portal-tab${tab === item.id ? ' portal-tab-active' : ''}`}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {filtered.length === 0 ? (
          <Card>
            <EmptyState compact message="No applications match this filter." />
          </Card>
        ) : tab === 'all' ? (
          Object.entries(grouped).map(([status, rows]) => (
            <Card key={status}>
              <h2 className="section-title">
                {STATUS_OPTIONS.find((option) => option.value === status)?.label ??
                  status.replace(/_/g, ' ')}{' '}
                <Badge>{rows.length}</Badge>
              </h2>
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
                    render: (a) => new Date(a.updatedAt).toLocaleDateString(),
                  },
                ]}
                data={rows}
                getRowKey={(a) => a.id}
              />
            </Card>
          ))
        ) : (
          <Card>
            <ResponsiveTable<ApplicationRow>
              columns={[
                { key: 'id', header: 'Anonymous ID', render: (a) => a.anonymousId },
                {
                  key: 'subjects',
                  header: 'Subjects',
                  render: (a) => (a.subjectNames.length > 0 ? a.subjectNames.join(', ') : '—'),
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
                  render: (a) => new Date(a.updatedAt).toLocaleDateString(),
                },
              ]}
              data={filtered}
              getRowKey={(a) => a.id}
            />
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
