'use client';

import { Card, EmptyState, PageHeader, ResponsiveTable } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { AdminPageSkeleton } from '@/components/admin-page-skeleton';
import { useAdminData } from '@/components/admin-provider';

export default function PlatformRulesPage() {
  const { data, loading, error, accessDenied } = useAdminData<
    Array<{ id: string; baseAmount: number; isActive: boolean; university: { name: string } }>
  >('/admin/faralin-rules');

  if (accessDenied) return <AccessDenied />;
  if (loading && !data) return <AdminPageSkeleton rows={6} />;

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader title="Faralin rules" description="Recognition rules by university" />
        <Card>
          {error ? (
            <PageHeader title="Faralin rules" description={error} />
          ) : !data || data.length === 0 ? (
            <EmptyState compact message="No rules configured." />
          ) : (
            <ResponsiveTable
              columns={[
                { key: 'uni', header: 'University', render: (r) => r.university.name },
                { key: 'base', header: 'Base', render: (r) => r.baseAmount },
                { key: 'active', header: 'Active', render: (r) => (r.isActive ? 'Yes' : 'No') },
              ]}
              data={data.slice(0, 50)}
              getRowKey={(r) => r.id}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
