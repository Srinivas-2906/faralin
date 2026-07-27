import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { Card, EmptyState, PageHeader } from '@faralin/ui';
import { UNIVERSITY_VALUE_EXPLAINER } from '@faralin/types';
import {
  DashboardPartnerCard,
  type DashboardPartnerUniversity,
} from '@/components/dashboard-partner-card';

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
  const awardAccounts = dashboard?.portfolio.awardAccounts ?? [];
  const faralinsEarned =
    dashboard?.portfolio.coreFaralins ?? dashboard?.portfolio.totalFaralins ?? 0;

  const partnerCards: DashboardPartnerUniversity[] = projections.length
    ? projections.map(
        (p: {
          universitySlug: string;
          universityName: string;
          eligibleCoreFaralins: number;
          estimatedAwardGbp: number;
        }) => {
          const award = awardAccounts.find(
            (a: { universitySlug: string; status: string }) =>
              a.universitySlug === p.universitySlug,
          );
          return {
            universitySlug: p.universitySlug,
            universityName: p.universityName,
            countedFaralins: p.eligibleCoreFaralins,
            estimatedAwardGbp: p.estimatedAwardGbp,
            awardStatus: award?.status,
            awardStatusLabel: award
              ? award.status === 'CONVERTED' || award.status === 'CONFIRMED'
                ? 'Confirmed award'
                : award.status === 'FORFEITED'
                  ? 'Forfeited'
                  : 'Estimate only'
              : 'Estimate only',
          };
        },
      )
    : legacyPartners.map(
        (u: {
          universitySlug: string;
          universityName: string;
          totalFaralins: number;
          estimatedBursaryGbp: number;
        }) => ({
          universitySlug: u.universitySlug,
          universityName: u.universityName,
          countedFaralins: u.totalFaralins,
          estimatedAwardGbp: u.estimatedBursaryGbp,
          awardStatusLabel: 'Estimate only',
        }),
      );

  return (
    <div className="page-section partners-page">
      <div className="container-wide">
        <PageHeader
          title="Your universities"
          description={UNIVERSITY_VALUE_EXPLAINER}
          actions={
            <div className="partners-page-actions">
              <Link href="/dashboard" className="dashboard-section-link">
                ← Dashboard
              </Link>
              <Link href="/universities" className="dashboard-section-link">
                Browse more →
              </Link>
            </div>
          }
        />

        {!dashboard ? (
          <Card>
            <EmptyState message="Connect to the API to load your universities." />
          </Card>
        ) : partnerCards.length === 0 ? (
          <Card>
            <EmptyState
              message="You have not chosen any universities yet."
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
              {partnerCards.length === 1 ? 'university' : 'universities'} ·{' '}
              {faralinsEarned.toLocaleString()} Faralins earned
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
