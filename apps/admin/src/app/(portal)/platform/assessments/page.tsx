'use client';

import { Card, EmptyState, PageHeader, ResponsiveTable } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { AdminPageSkeleton } from '@/components/admin-page-skeleton';
import { useAdminData } from '@/components/admin-provider';

export default function PlatformAssessmentsPage() {
  const { data, loading, error, accessDenied } = useAdminData<
    Array<{
      id: string;
      title: string;
      slug: string;
      isActive: boolean;
      _count: { questions: number; attempts: number };
    }>
  >('/admin/assessments');

  if (accessDenied) return <AccessDenied />;
  if (loading && !data) return <AdminPageSkeleton rows={6} />;

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader title="Assessments" description="Platform assessment catalogue" />
        <Card>
          {error ? (
            <PageHeader title="Assessments" description={error} />
          ) : !data || data.length === 0 ? (
            <EmptyState compact message="No assessments." />
          ) : (
            <ResponsiveTable
              columns={[
                { key: 'title', header: 'Title', render: (a) => a.title },
                { key: 'questions', header: 'Q', render: (a) => a._count.questions },
                { key: 'attempts', header: 'Attempts', render: (a) => a._count.attempts },
                { key: 'active', header: 'Active', render: (a) => (a.isActive ? 'Yes' : 'No') },
              ]}
              data={data}
              getRowKey={(a) => a.id}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
