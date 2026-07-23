'use client';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  ResponsiveTable,
  StatCard,
} from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { PortalPageSkeleton } from '@/components/portal-page-skeleton';
import { usePortalData } from '@/components/portal-provider';

interface FaralinDistribution {
  awardedThisMonth: number;
  outstandingFaralins: number;
  outstandingLiabilityGbp: number;
  convertedFaralins: number;
  averagePerStudent: number;
  faralinsPerGbp: number | null;
}

interface AssessmentSummary {
  totalCompleted: number;
  uniqueAssessments: number;
  overallCompletionRate: number;
}

interface AssessmentBreakdownRow {
  slug: string;
  title: string;
  subjectName: string;
  studentsCompleted: number;
  averageScorePercent: number | null;
  averageFaralins: number;
  completionRate: number;
}

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
  faralinDistribution: FaralinDistribution;
  assessmentSummary: AssessmentSummary;
  assessmentBreakdown: AssessmentBreakdownRow[];
  eventRegistrations: number;
  contentEngagement: { articles: number; events: number };
}

const FUNNEL_STEPS: Array<{ key: keyof DashboardData['funnel']; label: string }> = [
  { key: 'followers', label: 'Followers' },
  { key: 'referralClicked', label: 'Referral' },
  { key: 'applied', label: 'Applied' },
  { key: 'offerReceived', label: 'Offer' },
  { key: 'offerAccepted', label: 'Accepted' },
  { key: 'enrolled', label: 'Enrolled' },
];

function conversionPercent(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round((current / previous) * 100);
}

function SubjectBarChart({
  items,
}: {
  items: Array<{ slug: string; name: string; count: number }>;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);
  return (
    <div className="portal-bar-chart">
      {items.map((item) => (
        <div key={item.slug} className="bar-row">
          <div className="bar-row-label">
            <span>{item.name}</span>
            <span>{item.count}</span>
          </div>
          <div className="bar-row-track">
            <div
              className="bar-row-fill portal-bar-fill"
              style={{ width: `${Math.round((item.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data: dashboard, loading, error, accessDenied, refresh, lastUpdated } =
    usePortalData<DashboardData>('/universities/staff/dashboard', 60_000);

  if (accessDenied) return <AccessDenied />;
  if (loading && !dashboard) return <PortalPageSkeleton rows={5} />;
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
    faralinDistribution,
    assessmentSummary,
    assessmentBreakdown,
    eventRegistrations,
    contentEngagement,
  } = dashboard;

  const enrolledRate =
    funnel.followers > 0 ? Math.round((funnel.enrolled / funnel.followers) * 100) : 0;

  const conversionLabel = faralinDistribution.faralinsPerGbp
    ? `${faralinDistribution.faralinsPerGbp.toLocaleString()} Faralins ≈ £1`
    : '—';

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title={university.name}
          description="University dashboard · Anonymous student view"
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

        <h2 className="section-title portal-section-heading">Faralin distribution</h2>
        <div className="stat-grid portal-stat-grid portal-faralin-grid">
          <StatCard
            label="Faralins awarded this month"
            value={faralinDistribution.awardedThisMonth.toLocaleString()}
          />
          <StatCard
            label="Outstanding Faralins"
            value={faralinDistribution.outstandingFaralins.toLocaleString()}
          />
          <StatCard
            label="Outstanding liability"
            value={`£${faralinDistribution.outstandingLiabilityGbp.toFixed(2)}`}
            copper
          />
          <StatCard
            label="Faralins converted"
            value={faralinDistribution.convertedFaralins.toLocaleString()}
          />
          <StatCard
            label="Average reward per student"
            value={faralinDistribution.averagePerStudent.toLocaleString()}
          />
          <StatCard label="Conversion rate" value={conversionLabel} />
        </div>
        <p className="portal-faralin-disclaimer">
          Faralins are conditional recognition value. Liability reflects verified, non-practice
          awards. Student Faralin totals may include practice recognition not counted toward
          liability.
        </p>

        <div className="stat-grid portal-stat-grid" style={{ marginBottom: 'var(--section-gap)' }}>
          <StatCard
            label="Students following"
            value={followerCount}
            footer={<span className="portal-stat-footer">{enrolledRate}% reach enrolled</span>}
          />
          <StatCard label="Event registrations" value={eventRegistrations} />
          <StatCard label="Published articles" value={contentEngagement.articles} />
          <StatCard label="Upcoming events" value={contentEngagement.events} />
        </div>

        <Card className="portal-assessment-card" style={{ marginBottom: 'var(--section-gap)' }}>
          <h2 className="section-title">Assessment breakdown</h2>
          <div className="portal-assessment-summary">
            <span>
              <strong>{assessmentSummary.totalCompleted.toLocaleString()}</strong> completed
            </span>
            <span>
              <strong>{assessmentSummary.uniqueAssessments}</strong> unique assessments
            </span>
            <span>
              <strong>{assessmentSummary.overallCompletionRate}%</strong> overall completion
            </span>
          </div>
          {assessmentBreakdown.length === 0 ? (
            <EmptyState compact message="No assessment activity from followers yet." />
          ) : (
            <ResponsiveTable<AssessmentBreakdownRow>
              columns={[
                {
                  key: 'assessment',
                  header: 'Assessment',
                  render: (row) => (
                    <div>
                      <div>{row.title}</div>
                      <div className="portal-table-meta">{row.subjectName}</div>
                    </div>
                  ),
                },
                {
                  key: 'students',
                  header: 'Students',
                  render: (row) => row.studentsCompleted.toLocaleString(),
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
                  key: 'completion',
                  header: 'Completion',
                  render: (row) => `${row.completionRate}%`,
                },
              ]}
              data={assessmentBreakdown}
              getRowKey={(row) => row.slug}
            />
          )}
        </Card>

        <Card style={{ marginBottom: 'var(--section-gap)' }}>
          <h2 className="section-title">Conversion funnel</h2>
          <div className="portal-funnel-horizontal">
            {FUNNEL_STEPS.map((step, index) => {
              const value = funnel[step.key];
              const previous = index === 0 ? value : funnel[FUNNEL_STEPS[index - 1].key];
              const pct = conversionPercent(value, previous);
              return (
                <div key={step.key} className="portal-funnel-pill-wrap">
                  {index > 0 ? (
                    <span className="portal-funnel-connector" aria-hidden="true">
                      {pct}%
                    </span>
                  ) : null}
                  <div className="portal-funnel-pill">
                    <span className="portal-funnel-pill-value">{value}</span>
                    <span className="portal-funnel-pill-label">{step.label}</span>
                  </div>
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
              <SubjectBarChart items={subjectInterests} />
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
