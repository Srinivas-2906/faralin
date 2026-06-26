import { Suspense } from 'react';
import { HomeWideBanner } from '@/components/home-wide-banner';
import {
  UniversitiesCatalog,
  type UniversityListItem,
} from '@/components/universities-catalog';
import { UniversitiesStatsRow } from '@/components/universities-stats-row';
import { getUniversitiesBannerImage } from '@/lib/media';

async function getUniversities(): Promise<UniversityListItem[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/api/universities`, { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch {
    // ignore
  }
  return [];
}

export default async function UniversitiesPage() {
  const universities = await getUniversities();

  return (
    <div className="universities-page">
      <HomeWideBanner
        imageSrc={getUniversitiesBannerImage()}
        imageAlt="University great hall with vaulted ceiling and reading tables"
        eyebrow="Partner universities"
        title="Find your partner university."
      />

      <div className="page-section universities-page-body">
        <div className="container-wide">
          <Suspense fallback={null}>
            <UniversitiesStatsRow />
          </Suspense>

          <Suspense fallback={null}>
            <UniversitiesCatalog universities={universities} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
