'use client';

import { Card, EmptyState, PageHeader, ResponsiveTable } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { AdminPageSkeleton } from '@/components/admin-page-skeleton';
import { useAdminData } from '@/components/admin-provider';

export default function PlatformUniversitiesPage() {
  const { data, loading, error, accessDenied } = useAdminData<
    Array<{ id: string; name: string; slug: string; isDemo: boolean }>
  >('/admin/universities');

  if (accessDenied) return <AccessDenied />;
  if (loading && !data) return <AdminPageSkeleton rows={6} />;

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader title="Universities" description="Partner universities on Faralin" />
        <Card>
          {error ? (
            <PageHeader title="Universities" description={error} />
          ) : !data || data.length === 0 ? (
            <EmptyState compact message="No universities." />
          ) : (
            <ResponsiveTable
              columns={[
                { key: 'name', header: 'Name', render: (u) => u.name },
                { key: 'slug', header: 'Slug', render: (u) => u.slug },
                { key: 'demo', header: 'Demo', render: (u) => (u.isDemo ? 'Yes' : 'No') },
              ]}
              data={data}
              getRowKey={(u) => u.id}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
