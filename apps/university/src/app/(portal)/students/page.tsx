'use client';

import { Badge, Card, EmptyState, PageHeader, ResponsiveTable, SkeletonTable } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { usePortalData } from '@/lib/use-portal-data';

interface StudentRow {
  anonymousId: string;
  revealLevel: string;
  subjectSlugs: string[];
  subjectNames: string[];
  assessmentsCompleted: number;
  totalFaralins: number;
  performanceBand: string;
  applicationStatus: string;
  firstName?: string;
  lastName?: string;
  schoolName?: string;
  yearGroup?: number;
}

const STATUS_LABELS: Record<string, string> = {
  FOLLOWER: 'Following',
  REFERRAL_CLICKED: 'Referral clicked',
  APPLIED: 'Applied',
  OFFER_RECEIVED: 'Offer received',
  OFFER_ACCEPTED: 'Offer accepted',
  ENROLLED: 'Enrolled',
  WITHDRAWN: 'Withdrawn',
  REJECTED: 'Rejected',
};

export default function StudentsPage() {
  const { data, loading, error, accessDenied } = usePortalData<{
    university: { name: string };
    students: StudentRow[];
  }>('/universities/staff/students');

  if (accessDenied) return <AccessDenied />;
  if (loading) {
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

  const students = data?.students ?? [];
  const universityName = data?.university.name ?? 'your university';

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="Students"
          description={`Anonymous student roster for ${universityName}. Personal details appear only when a student has raised their reveal level.`}
        />

        <Card>
          {error ? (
            <EmptyState compact message={error} />
          ) : students.length === 0 ? (
            <EmptyState compact message="No students following your university yet." />
          ) : (
            <ResponsiveTable<StudentRow>
              columns={[
                { key: 'id', header: 'Anonymous ID', render: (s) => s.anonymousId },
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
              data={students}
              getRowKey={(s) => s.anonymousId}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
