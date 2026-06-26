import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { Card, EmptyState } from '@faralin/ui';
import type { AssessmentListItem } from '@/components/assessment-card';
import { DashboardPartnerCard } from '@/components/dashboard-partner-card';
import { DashboardRecommendedSection } from '@/components/dashboard-recommended-section';
import { DashboardUpdateItem } from '@/components/dashboard-update-item';
import { getUserDisplayName } from '@/lib/user-display-name';

function toAssessmentListItem(a: {
  slug: string;
  title: string;
  difficulty: AssessmentListItem['difficulty'];
  trustLevel: AssessmentListItem['trustLevel'];
  estimatedFaralinMin: number;
  estimatedFaralinMax: number;
  durationMinutes: number | null;
  isTimed: boolean;
  subject: { name: string; slug: string };
}): AssessmentListItem {
  return {
    slug: a.slug,
    title: a.title,
    difficulty: a.difficulty,
    trustLevel: a.trustLevel,
    estimatedFaralinMin: a.estimatedFaralinMin,
    estimatedFaralinMax: a.estimatedFaralinMax,
    durationMinutes: a.durationMinutes,
    isTimed: a.isTimed,
    subject: { name: a.subject.name, slug: a.subject.slug },
  };
}

export default async function DashboardPage() {
  const { userId, getToken } = await auth();
  if (!userId) redirect('/sign-in');

  const clerkUser = await currentUser();
  const token = await getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  let dashboard = null;
  try {
    const res = await fetch(`${apiUrl}/api/students/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) dashboard = await res.json();
  } catch {
    // API may not be running
  }

  if (dashboard && !dashboard.profile.onboardingComplete) {
    redirect('/onboarding');
  }

  const verifiedTotal = dashboard
    ? dashboard.portfolio.byUniversity.reduce(
        (sum: number, u: { verifiedFaralins: number }) => sum + u.verifiedFaralins,
        0,
      )
    : 0;

  const allRecommendedAssessments: AssessmentListItem[] = dashboard
    ? dashboard.recommendedAssessments.map(toAssessmentListItem)
    : [];

  const previewUniversities = dashboard
    ? dashboard.portfolio.byUniversity.slice(0, 2)
    : [];

  const previewArticles = dashboard ? dashboard.articles.slice(0, 2) : [];
  const totalUniversities = dashboard?.portfolio.byUniversity.length ?? 0;
  const totalArticles = dashboard?.articles.length ?? 0;
  const displayName = getUserDisplayName(clerkUser, dashboard?.profile);

  return (
    <div className="page-section dashboard-page">
      <div className="container-wide">
        <div className="dashboard-stats-row">
          <h1 className="dashboard-greeting">
            <span className="dashboard-greeting-hello">Hello,</span>{' '}
            <span className="dashboard-greeting-name">{displayName}</span>
          </h1>
          {dashboard ? (
            <div className="assessments-stats" aria-label="Dashboard statistics">
              <div className="assessments-stat">
                <span className="assessments-stat-value">
                  {dashboard.portfolio.totalFaralins.toLocaleString()}
                </span>
                <span className="assessments-stat-label">Total Faralins</span>
              </div>
              <div className="assessments-stat">
                <span className="assessments-stat-value">
                  £{dashboard.portfolio.estimatedBursaryGbp.toFixed(2)}
                </span>
                <span className="assessments-stat-label">Est. bursary</span>
              </div>
              <div className="assessments-stat">
                <span className="assessments-stat-value">
                  {dashboard.portfolio.faralinsThisMonth.toLocaleString()}
                </span>
                <span className="assessments-stat-label">This month</span>
              </div>
              <div className="assessments-stat">
                <span className="assessments-stat-value">
                  {dashboard.portfolio.assessmentsCompleted}
                </span>
                <span className="assessments-stat-label">Assessments</span>
              </div>
              <div className="assessments-stat">
                <span className="assessments-stat-value">
                  {dashboard.portfolio.byUniversity.length}
                </span>
                <span className="assessments-stat-label">Universities</span>
              </div>
              <div className="assessments-stat">
                <span className="assessments-stat-value">{verifiedTotal.toLocaleString()}</span>
                <span className="assessments-stat-label">Verified</span>
              </div>
            </div>
          ) : null}
        </div>

        {dashboard ? (
          <>
            <DashboardRecommendedSection assessments={allRecommendedAssessments} />

            <div className="dashboard-bento">
              <Card className="dashboard-bento-panel">
                <header className="dashboard-section-head">
                  <h2 className="dashboard-section-title">Partners you chose</h2>
                  {totalUniversities > 2 && (
                    <Link href="/universities" className="dashboard-section-link">
                      View all →
                    </Link>
                  )}
                </header>
                <div className="dashboard-bento-body">
                  {dashboard.portfolio.byUniversity.length === 0 ? (
                    <EmptyState compact message="Choose partner universities during onboarding to see them here." />
                  ) : (
                    <div className="dashboard-bento-list">
                      {previewUniversities.map(
                        (u: {
                          universitySlug: string;
                          universityName: string;
                          totalFaralins: number;
                          estimatedBursaryGbp: number;
                        }) => (
                          <DashboardPartnerCard key={u.universitySlug} university={u} />
                        ),
                      )}
                    </div>
                  )}
                </div>
              </Card>

              <Card className="dashboard-bento-panel">
                <header className="dashboard-section-head">
                  <h2 className="dashboard-section-title">Updates</h2>
                  {totalArticles > 2 && (
                    <Link href="/knowledge-center" className="dashboard-section-link">
                      Read more →
                    </Link>
                  )}
                </header>
                <div className="dashboard-bento-body">
                  {dashboard.articles.length === 0 ? (
                    <p className="text-muted">No updates yet.</p>
                  ) : (
                    <div className="dashboard-bento-list">
                      {previewArticles.map(
                        (article: {
                          id: string;
                          title: string;
                          excerpt: string;
                          university: { shortName: string; slug?: string };
                        }) => (
                          <DashboardUpdateItem key={article.id} article={article} />
                        ),
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </>
        ) : (
          <Card>
            <EmptyState message="Connect to the API to load your dashboard." />
          </Card>
        )}
      </div>
    </div>
  );
}
