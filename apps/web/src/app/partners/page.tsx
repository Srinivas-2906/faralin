import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { Card, EmptyState, PageHeader } from '@faralin/ui';
import { DashboardPartnerCard } from '@/components/dashboard-partner-card';

type PartnerUniversity = {
  universitySlug: string;
  universityName: string;
  totalFaralins: number;
  verifiedFaralins: number;
  hearEligibleFaralins: number;
  recognitionTierLabel: string;
  recognitionProgressPercent: number;
  estimatedBursaryGbp: number;
  faralinsPerGbp?: number | null;
};

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

  const partnerUniversities: PartnerUniversity[] = dashboard?.portfolio.byUniversity ?? [];
  const totalFaralins = dashboard?.portfolio.totalFaralins ?? 0;

  return (
    <div className="page-section partners-page">
      <div className="container-wide">
        <PageHeader
          title="Partners you chose"
          description="Each partner university keeps its own recognition balance. Totals here match your dashboard — they are not shared across universities."
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

        {!dashboard ? (
          <Card>
            <EmptyState message="Connect to the API to load your partners." />
          </Card>
        ) : partnerUniversities.length === 0 ? (
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
              {partnerUniversities.length}{' '}
              {partnerUniversities.length === 1 ? 'partner' : 'partners'} ·{' '}
              {totalFaralins.toLocaleString()} total Faralins combined
            </p>
            <Card className="partners-page-card">
              <div className="dashboard-bento-list partners-page-list">
                {partnerUniversities.map((u) => (
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
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
