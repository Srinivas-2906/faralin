'use client';

import {
  Badge,
  Card,
  DashboardSkeleton,
  EmptyState,
  PageHeader,
  ProgressBar,
  ResponsiveTable,
  StatCard,
} from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { usePortalData } from '@/lib/use-portal-data';

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
  subjectInterests: Array<{ slug: string; name: string; count: number }>;
  topPerformers: Array<{
    anonymousId: string;
    totalFaralins: number;
    performanceBand: string;
  }>;
  estimatedFutureBursaryGbp: number;
  eventRegistrations: number;
  contentEngagement: { articles: number; events: number };
}

const FUNNEL_STEPS: Array<{ key: keyof DashboardData['funnel']; label: string }> = [
  { key: 'followers', label: 'Followers' },
  { key: 'referralClicked', label: 'Referral clicked' },
  { key: 'applied', label: 'Applied' },
  { key: 'offerReceived', label: 'Offer received' },
  { key: 'offerAccepted', label: 'Offer accepted' },
  { key: 'enrolled', label: 'Enrolled' },
];

function conversionPercent(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round((current / previous) * 100);
}

export default function DashboardPage() {
  const { data: dashboard, loading, error, accessDenied } =
    usePortalData<DashboardData>('/universities/staff/dashboard');

  if (accessDenied) return <AccessDenied />;
  if (loading) return <DashboardSkeleton />;
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

  const {
    university,
    funnel,
    followerCount,
    subjectInterests,
    topPerformers,
    estimatedFutureBursaryGbp,
    eventRegistrations,
    contentEngagement,
  } = dashboard;

  const funnelValues = FUNNEL_STEPS.map((step) => funnel[step.key]);

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
          <StatCard label="Event registrations" value={eventRegistrations} />
          <StatCard label="Published articles" value={contentEngagement.articles} />
          <StatCard label="Upcoming events" value={contentEngagement.events} />
        </div>

        <Card style={{ marginBottom: 'var(--section-gap)' }}>
          <h2 className="section-title">Conversion funnel</h2>
          <div className="portal-funnel-steps">
            {FUNNEL_STEPS.map((step, index) => {
              const value = funnel[step.key];
              const previous = index === 0 ? value : funnelValues[index - 1];
              const pct = conversionPercent(value, previous);
              return (
                <div key={step.key} className="portal-funnel-step">
                  <div className="portal-funnel-meta">
                    <span className="portal-funnel-label">{step.label}</span>
                    {index > 0 ? (
                      <span className="portal-funnel-conversion">{pct}% from previous stage</span>
                    ) : null}
                  </div>
                  <ProgressBar
                    current={value}
                    total={Math.max(funnel.followers, value, 1)}
                    label={`${value} students`}
                  />
                </div>
              );
            })}
          </div>
        </Card>

        <div className="layout-two-col">
          <Card>
            <h2 className="section-title">Subject interests</h2>
            {subjectInterests.length === 0 ? (
              <EmptyState compact message="No data yet." />
            ) : (
              <ResponsiveTable<{ slug: string; name: string; count: number }>
                columns={[
                  { key: 'subject', header: 'Subject', render: (r) => r.name },
                  { key: 'students', header: 'Students', render: (r) => r.count },
                ]}
                data={subjectInterests}
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
