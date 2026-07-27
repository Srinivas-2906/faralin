'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge, Button, Card, EmptyState, PageHeader, ResponsiveTable, SkeletonTable } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { usePortalData } from '@/components/portal-provider';

interface StudentRow {
  anonymousId: string;
  revealLevel: string;
  subjectSlugs: string[];
  subjectNames: string[];
  assessmentsCompleted: number;
  totalFaralins: number;
  verifiedFaralins: number;
  performanceBand: string;
  applicationStatus: string;
  firstName?: string;
  lastName?: string;
  schoolName?: string;
  yearGroup?: number;
}

const STATUS_LABELS: Record<string, string> = {
  FOLLOWER: 'Following',
  FARALIN_ACTIVE: 'Faralin active',
  REFERRAL_CLICKED: 'Referral clicked',
  APPLIED: 'Applied',
  OFFER_RECEIVED: 'Offer received',
  OFFER_ACCEPTED: 'Offer accepted',
  FIRM: 'Firm choice',
  INSURANCE: 'Insurance choice',
  ENROLLED: 'Enrolled',
  WITHDRAWN: 'Withdrawn',
  REJECTED: 'Rejected',
};

const SORT_OPTIONS = [
  { id: 'faralins-desc', label: 'Faralins (high → low)' },
  { id: 'faralins-asc', label: 'Faralins (low → high)' },
  { id: 'band', label: 'Performance band' },
  { id: 'assessments', label: 'Assessments' },
] as const;

const BAND_ORDER = ['exceptional', 'strong', 'steady', 'developing'];

export default function StudentsPage() {
  const { data, loading, error, accessDenied, refresh, lastUpdated } = usePortalData<{
    university: { name: string };
    students: StudentRow[];
  }>('/universities/staff/students');

  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]['id']>('faralins-desc');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const students = useMemo(() => {
    const rows = [...(data?.students ?? [])];
    if (statusFilter !== 'all') {
      return rows.filter((student) => student.applicationStatus === statusFilter);
    }
    return rows;
  }, [data?.students, statusFilter]);

  const sortedStudents = useMemo(() => {
    const rows = [...students];
    rows.sort((a, b) => {
      if (sort === 'faralins-desc') return b.totalFaralins - a.totalFaralins;
      if (sort === 'faralins-asc') return a.totalFaralins - b.totalFaralins;
      if (sort === 'assessments') return b.assessmentsCompleted - a.assessmentsCompleted;
      return (
        BAND_ORDER.indexOf(a.performanceBand) - BAND_ORDER.indexOf(b.performanceBand)
      );
    });
    return rows;
  }, [students, sort]);

  if (accessDenied) return <AccessDenied />;
  if (loading && !data) {
    return (
      <div className="page-section">
        <div className="container">
          <PageHeader title="Students" description="Loading roster…" />
          <Card>
            <SkeletonTable rows={6} />
          </Card>
        </div>
      </div>
    );
  }

  const universityName = data?.university.name ?? 'your university';

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="Students"
          description={`Anonymous student roster for ${universityName}. Personal details appear only when a student has raised their reveal level.`}
          actions={
            <div className="portal-page-actions">
              {lastUpdated ? (
                <span className="portal-last-updated">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              ) : null}
              <Button type="button" variant="secondary" onClick={() => refresh()}>
                Refresh
              </Button>
            </div>
          }
        />

        <Card>
          <div className="portal-card-toolbar">
            <label className="portal-filter">
              Pipeline
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by pipeline status"
              >
                <option value="all">All statuses</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="portal-filter">
              Sort by
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                aria-label="Sort students"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <EmptyState compact message={error} />
          ) : sortedStudents.length === 0 ? (
            <EmptyState compact message="No students match this filter." />
          ) : (
            <ResponsiveTable<StudentRow>
              columns={[
                {
                  key: 'id',
                  header: 'Anonymous ID',
                  render: (s) => (
                    <Link href={`/students/${s.anonymousId}`} className="portal-student-link">
                      {s.anonymousId}
                    </Link>
                  ),
                },
                {
                  key: 'subjects',
                  header: 'Subjects',
                  render: (s) =>
                    s.subjectNames.length > 0 ? s.subjectNames.join(', ') : '—',
                },
                {
                  key: 'faralins',
                  header: 'Faralins',
                  render: (s) => s.totalFaralins.toLocaleString(),
                },
                {
                  key: 'verified',
                  header: 'Verified',
                  render: (s) => s.verifiedFaralins.toLocaleString(),
                },
                {
                  key: 'band',
                  header: 'Band',
                  render: (s) => <Badge>{s.performanceBand}</Badge>,
                },
                {
                  key: 'pipeline',
                  header: 'Pipeline',
                  render: (s) =>
                    STATUS_LABELS[s.applicationStatus] ?? s.applicationStatus.replace(/_/g, ' '),
                },
                {
                  key: 'assessments',
                  header: 'Assessments',
                  render: (s) => s.assessmentsCompleted,
                },
              ]}
              data={sortedStudents}
              getRowKey={(s) => s.anonymousId}
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
