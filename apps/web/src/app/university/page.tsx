import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Badge, Card, EmptyState, PageHeader, ResponsiveTable, StatCard } from '@faralin/ui';

export default async function UniversityPortalPage() {
  const { userId, getToken } = await auth();
  if (!userId) redirect('/sign-in');

  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  let dashboard = null;
  try {
    const res = await fetch(`${apiUrl}/api/universities/staff/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) dashboard = await res.json();
  } catch {
    // API unavailable
  }

  if (!dashboard) {
    return (
      <div className="page-section">
        <div className="container">
          <Card>
            <PageHeader
              title="University portal"
              description="Access requires a university staff account. Contact Faralin admin if you need access."
            />
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
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                  {step.value}
                </div>
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
                  { key: 'id', header: 'ID', render: (s) => s.anonymousId },
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
