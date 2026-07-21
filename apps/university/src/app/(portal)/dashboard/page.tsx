'use client';

import { useEffect, useState } from 'react';
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  ResponsiveTable,
  Skeleton,
  StatCard,
} from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { useStaffApi } from '@/lib/use-staff-api';

interface DashboardData {
  university: { name: string };
  funnel: {
    followers: number;
    referralClicked: number;
    applied: number;
    offerReceived: number;
    offerAccepted: number;
    enrolled: number;
  };
  followerCount: number;
  subjectInterests: Record<string, number>;
  topPerformers: Array<{
    anonymousId: string;
    totalFaralins: number;
    performanceBand: string;
  }>;
  estimatedFutureBursaryGbp: number;
  contentEngagement: { articles: number; events: number };
}

export default function DashboardPage() {
  const { staffFetch, accessDenied } = useStaffApi();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await staffFetch<DashboardData>('/universities/staff/dashboard');
        if (data) setDashboard(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [staffFetch]);

  if (accessDenied) return <AccessDenied />;
  if (loading) {
    return (
      <div className="page-section">
        <div className="container">
          <Skeleton variant="title" width="40%" style={{ marginBottom: '2rem' }} />
          <div className="stat-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="stat" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (error || !dashboard) {
    return (
      <div className="page-section">
        <div className="container">
          <Card>
            <PageHeader title="Dashboard" description={error || 'Unable to load dashboard.'} />
          </Card>
        </div>
      </div>
    );
  }

  const { university, funnel, followerCount, subjectInterests, topPerformers, estimatedFutureBursaryGbp, contentEngagement } =
    dashboard;

  const subjectRows = Object.entries(subjectInterests).map(([slug, count]) => ({
    slug,
    count: count as number,
  }));

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title={university.name}
          description="University dashboard · Anonymous student view"
        />

        <div className="stat-grid" style={{ marginBottom: 'var(--section-gap)' }}>
          <StatCard label="Students following" value={followerCount} />
          <StatCard
            label="Est. future bursary liability"
            value={`£${estimatedFutureBursaryGbp.toFixed(2)}`}
            copper
          />
          <StatCard label="Published articles" value={contentEngagement.articles} />
          <StatCard label="Upcoming events" value={contentEngagement.events} />
        </div>

        <Card style={{ marginBottom: 'var(--section-gap)' }}>
          <h2 className="section-title">Conversion funnel</h2>
          <div className="stat-grid">
            {[
              { label: 'Followers', value: funnel.followers },
              { label: 'Referral clicked', value: funnel.referralClicked },
              { label: 'Applied', value: funnel.applied },
              { label: 'Offer received', value: funnel.offerReceived },
              { label: 'Offer accepted', value: funnel.offerAccepted },
              { label: 'Enrolled', value: funnel.enrolled },
            ].map((step) => (
              <div key={step.label}>
                <div className="stat-label">{step.label}</div>
                <div className="stat-value stat-value--compact">{step.value}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="layout-two-col">
          <Card>
            <h2 className="section-title">Subject interests</h2>
            {subjectRows.length === 0 ? (
              <EmptyState compact message="No data yet." />
            ) : (
              <ResponsiveTable<{ slug: string; count: number }>
                columns={[
                  { key: 'subject', header: 'Subject', render: (r) => r.slug },
                  { key: 'students', header: 'Students', render: (r) => r.count },
                ]}
                data={subjectRows}
                getRowKey={(r) => r.slug}
              />
            )}
          </Card>

          <Card>
            <h2 className="section-title">Top performers (anonymous)</h2>
            {topPerformers.length === 0 ? (
              <EmptyState compact message="No students yet." />
            ) : (
              <ResponsiveTable<{
                anonymousId: string;
                totalFaralins: number;
                performanceBand: string;
              }>
                columns={[
                  { key: 'id', header: 'Anonymous ID', render: (s) => s.anonymousId },
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
                ]}
                data={topPerformers}
                getRowKey={(s) => s.anonymousId}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
