import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { Card, EmptyState } from '@faralin/ui';
import type { PortfolioArtifactSummary } from '@faralin/types';
import type { AssessmentListItem } from '@/components/assessment-card';
import { DashboardPartnerCard } from '@/components/dashboard-partner-card';
import { DashboardCompletedTracks } from '@/components/dashboard-completed-tracks';
import { DashboardCombinedRecommended } from '@/components/dashboard-problem-tracks';
import type { ProblemTrackListItem } from '@/components/problem-tracks/track-card';
import { DashboardUpdateItem } from '@/components/dashboard-update-item';
import { DashboardStatsBar } from '@/components/dashboard-stats-bar';
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

  const allRecommendedProblemTracks: ProblemTrackListItem[] = dashboard
    ? (dashboard.recommendedProblemTracks ?? []).map(
        (t: ProblemTrackListItem) => t,
      )
    : [];

  const portfolioArtifacts: PortfolioArtifactSummary[] = dashboard?.portfolioArtifacts ?? [];

  const partnerUniversities = dashboard?.portfolio.byUniversity ?? [];

  const previewArticles = dashboard ? dashboard.articles.slice(0, 2) : [];
  const totalUniversities = partnerUniversities.length;
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
            <DashboardStatsBar
              totalFaralins={dashboard.portfolio.totalFaralins}
              estimatedBursaryGbp={dashboard.portfolio.estimatedBursaryGbp}
              tracksCompleted={dashboard.portfolio.tracksCompleted ?? 0}
              assessmentsCompleted={dashboard.portfolio.assessmentsCompleted}
              verifiedTotal={verifiedTotal}
              hearEligibleFaralins={dashboard.portfolio.hearEligibleFaralins ?? 0}
              partnerUniversityCount={totalUniversities}
            />
          ) : null}
        </div>

        {dashboard ? (
          <>
            <DashboardCombinedRecommended
              assessments={allRecommendedAssessments}
              tracks={allRecommendedProblemTracks}
            />

            <DashboardCompletedTracks artifacts={portfolioArtifacts} />

            <div className="dashboard-bento" id="partners">
              <Card className="dashboard-bento-panel">
                <header className="dashboard-section-head">
                  <h2 className="dashboard-section-title">Partners you chose</h2>
                  {partnerUniversities.length > 0 ? (
                    <Link href="/partners" className="dashboard-section-link">
                      View all →
                    </Link>
                  ) : (
                    <Link href="/universities" className="dashboard-section-link">
                      Browse partners →
                    </Link>
                  )}
                </header>
                <div className="dashboard-bento-body">
                  {partnerUniversities.length === 0 ? (
                    <EmptyState compact message="Choose partner universities during onboarding to see them here." />
                  ) : (
                    <div className="dashboard-bento-list">
                      {partnerUniversities.map(
                        (u: {
                          universitySlug: string;
                          universityName: string;
                          totalFaralins: number;
                          verifiedFaralins: number;
                          hearEligibleFaralins: number;
                          recognitionTierLabel: string;
                          recognitionProgressPercent: number;
                          estimatedBursaryGbp: number;
                          faralinsPerGbp?: number | null;
                        }) => (
                          <DashboardPartnerCard
                            key={u.universitySlug}
                            university={{
                              universitySlug: u.universitySlug,
                              universityName: u.universityName,
                              totalFaralins: u.totalFaralins,
                              verifiedFaralins: u.verifiedFaralins,
                              hearEligibleFaralins: u.hearEligibleFaralins,
                              recognitionTierLabel: u.recognitionTierLabel,
                              recognitionProgressPercent: u.recognitionProgressPercent,
                              estimatedBursaryGbp: u.estimatedBursaryGbp,
                              faralinsPerGbp: u.faralinsPerGbp,
                            }}
                          />
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
