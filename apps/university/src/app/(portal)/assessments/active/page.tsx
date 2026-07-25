'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Badge, Button, Card, EmptyState, PageHeader, ResponsiveTable } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { PortalPageSkeleton } from '@/components/portal-page-skeleton';
import { usePortalData } from '@/components/portal-provider';

interface ActiveAssessmentRow {
  id: string;
  slug: string;
  title: string;
  categoryLabel: string;
  isCompulsory: boolean;
  baseReward: number | null;
  studentsCompleted: number;
  completionRate: number;
  averageScorePercent: number | null;
  averageFaralins: number;
  averageTimeMinutes: number | null;
}

interface ActiveData {
  assigned: number;
  assessments: ActiveAssessmentRow[];
  summary: {
    totalCompleted: number;
    uniqueAssessments: number;
    overallCompletionRate: number;
  };
}

export default function ActiveAssessmentsPage() {
  const { data, loading, error, accessDenied, refresh } =
    usePortalData<ActiveData>('/universities/staff/assessments/active');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  if (accessDenied) return <AccessDenied />;
  if (loading && !data) return <PortalPageSkeleton rows={4} />;

  const rows = data?.assessments ?? [];

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="Active Assessments"
          description="Enabled assessments and follower completion analytics."
          actions={
            <div className="portal-page-actions">
              <Button type="button" variant="secondary" onClick={() => refresh()}>
                Refresh
              </Button>
              <Link href="/assessments/library" className="btn btn-secondary">
                Manage library
              </Link>
            </div>
          }
        />

        {data ? (
          <p className="portal-faralin-disclaimer">
            {data.assigned.toLocaleString()} followers assigned ·{' '}
            {data.summary.totalCompleted.toLocaleString()} completions ·{' '}
            {data.summary.overallCompletionRate}% overall completion
          </p>
        ) : null}

        <Card>
          {error ? (
            <EmptyState compact message={error} />
          ) : rows.length === 0 ? (
            <EmptyState
              compact
              message="No assessments enabled yet. Enable templates from the Assessment Library."
            />
          ) : (
            <ResponsiveTable<ActiveAssessmentRow>
              columns={[
                { key: 'title', header: 'Assessment', render: (row) => row.title },
                { key: 'category', header: 'Category', render: (row) => row.categoryLabel },
                {
                  key: 'assigned',
                  header: 'Assigned',
                  render: () => (data?.assigned ?? 0).toLocaleString(),
                },
                {
                  key: 'completed',
                  header: 'Completed',
                  render: (row) => row.studentsCompleted.toLocaleString(),
                },
                {
                  key: 'completion',
                  header: 'Completion',
                  render: (row) => `${row.completionRate}%`,
                },
                {
                  key: 'score',
                  header: 'Avg score',
                  render: (row) =>
                    row.averageScorePercent != null ? `${row.averageScorePercent}%` : '—',
                },
                {
                  key: 'faralins',
                  header: 'Avg Faralins',
                  render: (row) => row.averageFaralins.toLocaleString(),
                },
                {
                  key: 'time',
                  header: 'Avg time',
                  render: (row) =>
                    row.averageTimeMinutes != null ? `${row.averageTimeMinutes} mins` : '—',
                },
                {
                  key: 'compulsory',
                  header: 'Compulsory',
                  render: (row) => (row.isCompulsory ? <Badge>Yes</Badge> : 'No'),
                },
              ]}
              data={rows}
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
