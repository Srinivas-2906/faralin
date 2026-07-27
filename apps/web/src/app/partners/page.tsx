import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { Card, EmptyState, PageHeader } from '@faralin/ui';
import {
  DashboardPartnerCard,
  type DashboardPartnerUniversity,
} from '@/components/dashboard-partner-card';
import { ConditionalAwardDisclaimer } from '@/components/conditional-award-disclaimer';

export default async function PartnersPage() {
  const { userId, getToken } = await auth();
  if (!userId) redirect('/sign-in');

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

  const legacyPartners = dashboard?.portfolio.byUniversity ?? [];
  const projections = dashboard?.portfolio.projections ?? [];
  const coreFaralins = dashboard?.portfolio.coreFaralins ?? dashboard?.portfolio.totalFaralins ?? 0;

  const partnerCards: DashboardPartnerUniversity[] = projections.length
    ? projections.map(
        (p: {
          universitySlug: string;
          universityName: string;
          eligibleCoreFaralins: number;
          estimatedAwardGbp: number;
        }) => {
          const legacy = legacyPartners.find(
            (u: { universitySlug: string }) => u.universitySlug === p.universitySlug,
          );
          return {
            universitySlug: p.universitySlug,
            universityName: p.universityName,
            eligibleCoreFaralins: p.eligibleCoreFaralins,
            estimatedAwardGbp: p.estimatedAwardGbp,
            hearEligibleFaralins: legacy?.hearEligibleFaralins,
            recognitionTierLabel: legacy?.recognitionTierLabel,
            recognitionProgressPercent: legacy?.recognitionProgressPercent,
          };
        },
      )
    : legacyPartners.map(
        (u: {
          universitySlug: string;
          universityName: string;
          totalFaralins: number;
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

  return (
    <div className="page-section partners-page">
      <div className="container-wide">
        <PageHeader
          title="Partners you follow"
          description="Each university shows a conditional award estimate based on your Core Faralins and its current rules. These are projections, not separate balances or guaranteed scholarships."
          actions={
            <div className="partners-page-actions">
              <Link href="/dashboard" className="dashboard-section-link">
                ← Dashboard
              </Link>
              <Link href="/universities" className="dashboard-section-link">
                Browse more partners →
              </Link>
            </div>
          }
        />

        <ConditionalAwardDisclaimer compact className="partners-page-disclaimer" />

        {!dashboard ? (
          <Card>
            <EmptyState message="Connect to the API to load your partners." />
          </Card>
        ) : partnerCards.length === 0 ? (
          <Card>
            <EmptyState
              message="You have not chosen any partner universities yet."
              action={
                <Link href="/onboarding" className="dashboard-section-link">
                  Complete onboarding →
                </Link>
              }
            />
          </Card>
        ) : (
          <>
            <p className="partners-page-summary">
              {partnerCards.length}{' '}
              {partnerCards.length === 1 ? 'partner' : 'partners'} ·{' '}
              {coreFaralins.toLocaleString()} Core Faralins earned
            </p>
            <Card className="partners-page-card">
              <div className="dashboard-bento-list partners-page-list">
                {partnerCards.map((u) => (
                  <DashboardPartnerCard key={u.universitySlug} university={u} />
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
