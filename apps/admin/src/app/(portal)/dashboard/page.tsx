'use client';

import Link from 'next/link';
import { Card, PageHeader, StatCard } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { AdminPageSkeleton } from '@/components/admin-page-skeleton';
import { useAdminContext, useAdminData } from '@/components/admin-provider';

interface SupportDashboard {
  open: number;
  unassigned: number;
  overdueSla: number;
  resolvedToday: number;
  myAssigned: number;
}

interface PlatformOverview {
  users: number;
  students: number;
  universities: number;
  moderationQueue: number;
}

export default function DashboardPage() {
  const { context, accessDenied: contextDenied } = useAdminContext();
  const {
    data: supportStats,
    loading: supportLoading,
    error: supportError,
    accessDenied: supportDenied,
    lastUpdated,
  } = useAdminData<SupportDashboard>('/support/dashboard', 60000);

  const {
    data: platformStats,
    loading: platformLoading,
    error: platformError,
  } = useAdminData<PlatformOverview>(
    context?.isAdmin ? '/admin/overview' : '',
    context?.isAdmin ? 120000 : undefined,
  );

  const accessDenied = contextDenied || supportDenied;

  if (accessDenied) return <AccessDenied />;
  if (supportLoading && !supportStats) return <AdminPageSkeleton />;

  if (supportError || !supportStats) {
    return (
      <div className="page-section">
        <div className="container">
          <Card>
            <PageHeader title="Dashboard" description={supportError || 'Failed to load dashboard'} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="Dashboard"
          description="Support operations overview"
          actions={
            lastUpdated ? (
              <span className="admin-last-updated">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            ) : null
          }
        />

        <div className="stat-grid admin-stat-grid" style={{ marginBottom: 'var(--section-gap)' }}>
          <StatCard label="Open tickets" value={supportStats.open} />
          <StatCard label="Unassigned" value={supportStats.unassigned} />
          <StatCard label="Overdue SLA" value={supportStats.overdueSla} />
          <StatCard label="My queue" value={supportStats.myAssigned} />
          <StatCard label="Resolved today" value={supportStats.resolvedToday} />
        </div>

        <div className="admin-toolbar" style={{ marginBottom: 'var(--section-gap)' }}>
          <Link href="/tickets/new" className="btn btn-primary">
            Log new case
          </Link>
          <Link href="/tickets/queue" className="btn btn-secondary">
            View my queue
          </Link>
        </div>

        {context?.isAdmin ? (
          <Card>
            <PageHeader
              title="Platform overview"
              description="Key counts across the Faralin platform"
            />
            {platformLoading && !platformStats ? (
              <p style={{ color: 'var(--faralin-muted)' }}>Loading platform stats…</p>
            ) : platformError ? (
              <p style={{ color: 'var(--faralin-muted)' }}>{platformError}</p>
            ) : platformStats ? (
              <div className="stat-grid admin-stat-grid">
                <StatCard label="Users" value={platformStats.users} />
                <StatCard label="Students" value={platformStats.students} />
                <StatCard label="Universities" value={platformStats.universities} />
                <StatCard label="Moderation queue" value={platformStats.moderationQueue} />
              </div>
            ) : null}
          </Card>
        ) : null}
      </div>
    </div>
  );
}
