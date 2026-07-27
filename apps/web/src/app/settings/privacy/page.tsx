import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { Card, PageHeader } from '@faralin/ui';
import { ConsentSettingsCard } from '@/components/consent-settings-card';

export default async function PrivacySettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="page-section">
      <div className="container-wide">
        <PageHeader
          title="Privacy & sharing"
          description="Choose what partner universities can see as you move through applications."
          actions={
            <Link href="/dashboard" className="dashboard-section-link">
              ← Dashboard
            </Link>
          }
        />
        <Card>
          <ConsentSettingsCard />
        </Card>
      </div>
    </div>
  );
}
