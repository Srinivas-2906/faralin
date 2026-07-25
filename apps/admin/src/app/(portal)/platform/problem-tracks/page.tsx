'use client';

import { useState } from 'react';
import { Card, EmptyState, PageHeader, ResponsiveTable } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { AdminPageSkeleton } from '@/components/admin-page-skeleton';
import { useAdminData } from '@/components/admin-provider';

const PAGE_SIZE = 20;

export default function PlatformProblemTracksPage() {
  const { data, loading, error, accessDenied } = useAdminData<
    Array<{
      id: string;
      trackId: string;
      title: string;
      slug: string;
      isActive: boolean;
      maxFaralins: number;
      _count: { attempts: number };
    }>
  >('/admin/problem-tracks');
  const [page, setPage] = useState(1);

  if (accessDenied) return <AccessDenied />;
  if (loading && !data) return <AdminPageSkeleton rows={6} />;

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader title="Problem tracks" description="Published problem track catalogue" />
        <Card>
          {error ? (
            <PageHeader title="Problem tracks" description={error} />
          ) : !data || data.length === 0 ? (
            <EmptyState compact message="No problem tracks." />
          ) : (
            <ResponsiveTable
              columns={[
                { key: 'trackId', header: 'ID', render: (t) => t.trackId },
                { key: 'title', header: 'Title', render: (t) => t.title },
                { key: 'max', header: 'Max Faralins', render: (t) => t.maxFaralins },
                { key: 'attempts', header: 'Attempts', render: (t) => t._count.attempts },
                { key: 'active', header: 'Active', render: (t) => (t.isActive ? 'Yes' : 'No') },
              ]}
              data={data}
              getRowKey={(t) => t.id}
              paginated
              page={page}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              maxHeight="520px"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
