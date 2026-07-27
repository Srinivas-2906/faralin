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
import { ConditionalAwardDisclaimer } from '@/components/conditional-award-disclaimer';
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
  const projections = dashboard?.portfolio.projections ?? [];
  const awardAccounts = dashboard?.portfolio.awardAccounts ?? [];
  const coreFaralins = dashboard?.portfolio.coreFaralins ?? dashboard?.portfolio.totalFaralins ?? 0;

  const partnerCards = projections.length
    ? projections.map(
        (p: {
          universitySlug: string;
          universityName: string;
          eligibleCoreFaralins: number;
          estimatedAwardGbp: number;
        }) => {
          const legacy = partnerUniversities.find(
            (u: { universitySlug: string }) => u.universitySlug === p.universitySlug,
          );
          const award = awardAccounts.find(
            (a: { universitySlug: string; status: string }) =>
              a.universitySlug === p.universitySlug,
          );
          const awardStatusLabel = award
            ? award.status === 'CONVERTED'
              ? 'Converted award'
              : award.status === 'FORFEITED'
                ? 'Forfeited'
                : award.status === 'RESERVED'
                  ? 'Reserved (offer stage)'
                  : award.status === 'ELIGIBLE'
                    ? 'Eligible'
                    : award.status === 'CONFIRMED'
                      ? 'Confirmed'
                      : 'Projected estimate'
            : undefined;
          return {
            universitySlug: p.universitySlug,
            universityName: p.universityName,
            eligibleCoreFaralins: p.eligibleCoreFaralins,
            estimatedAwardGbp: p.estimatedAwardGbp,
            hearEligibleFaralins: legacy?.hearEligibleFaralins,
            recognitionTierLabel: legacy?.recognitionTierLabel,
            recognitionProgressPercent: legacy?.recognitionProgressPercent,
            awardStatus: award?.status,
            awardStatusLabel,
          };
        },
      )
    : partnerUniversities.map(
        (u: {
          universitySlug: string;
          universityName: string;
          totalFaralins: number;
          verifiedFaralins: number;
          hearEligibleFaralins: number;
          recognitionTierLabel: string;
          recognitionProgressPercent: number;
          estimatedBursaryGbp: number;
        }) => ({
          universitySlug: u.universitySlug,
          universityName: u.universityName,
          totalFaralins: u.totalFaralins,
          estimatedAwardGbp: u.estimatedBursaryGbp,
          hearEligibleFaralins: u.hearEligibleFaralins,
          recognitionTierLabel: u.recognitionTierLabel,
          recognitionProgressPercent: u.recognitionProgressPercent,
        }),
      );

  const maxProjectionGbp = projections.length
    ? Math.max(...projections.map((p: { estimatedAwardGbp: number }) => p.estimatedAwardGbp))
    : dashboard?.portfolio.estimatedBursaryGbp ?? 0;

  const previewArticles = dashboard ? dashboard.articles.slice(0, 2) : [];
  const totalUniversities = partnerCards.length;
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
              coreFaralins={coreFaralins}
              estimatedBursaryGbp={maxProjectionGbp}
              tracksCompleted={dashboard.portfolio.tracksCompleted ?? 0}
              assessmentsCompleted={dashboard.portfolio.assessmentsCompleted}
              verifiedTotal={verifiedTotal}
              hearEligibleFaralins={dashboard.portfolio.hearEligibleFaralins ?? 0}
              partnerUniversityCount={totalUniversities}
              projectionCount={projections.length}
            />
          ) : null}
        </div>

        {dashboard ? (
          <>
            <ConditionalAwardDisclaimer compact className="dashboard-disclaimer" />
            <DashboardCombinedRecommended
              assessments={allRecommendedAssessments}
              tracks={allRecommendedProblemTracks}
            />

            <DashboardCompletedTracks artifacts={portfolioArtifacts} />

            <div className="dashboard-bento" id="partners">
              <Card className="dashboard-bento-panel">
                <header className="dashboard-section-head">
                  <h2 className="dashboard-section-title">Partners you chose</h2>
                  {partnerCards.length > 0 ? (
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
                  {partnerCards.length === 0 ? (
                    <EmptyState compact message="Choose partner universities during onboarding to see them here." />
                  ) : (
                    <div className="dashboard-bento-list">
                      {partnerCards.map(
                        (u: {
                          universitySlug: string;
                          universityName: string;
                          eligibleCoreFaralins?: number;
                          totalFaralins?: number;
                          hearEligibleFaralins?: number;
                          recognitionTierLabel?: string;
                          recognitionProgressPercent?: number;
                          estimatedAwardGbp: number;
                          awardStatus?: string;
                          awardStatusLabel?: string;
                        }) => (
                          <DashboardPartnerCard
                            key={u.universitySlug}
                            university={u}
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
                  {totalArticles > 2 ? (
                    <Link href="/knowledge-center" className="dashboard-section-link">
                      Read more →
                    </Link>
                  ) : null}
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

            <p className="text-muted" style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>
              <Link href="/settings/privacy" className="dashboard-section-link">
                Privacy & sharing settings →
              </Link>
            </p>
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
