import { Suspense } from 'react';
import { AssessmentsCatalogInsight } from '@/components/catalog-insight';
import { HomeWideBanner } from '@/components/home-wide-banner';
import { AssessmentsCatalog, type AssessmentListItem } from '@/components/assessments-catalog';
import { AssessmentsFilters } from '@/components/assessments-filters';
import { getSubjectImage } from '@/lib/media';

async function getAssessments(): Promise<AssessmentListItem[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/api/assessments`, { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch {
    // ignore
  }
  return [];
}

function getSubjectFilters(assessments: AssessmentListItem[]) {
  const map = new Map<string, string>();
  for (const a of assessments) {
    map.set(a.subject.slug, a.subject.name);
  }
  return Array.from(map.entries())
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default async function AssessmentsPage() {
  const assessments = await getAssessments();
  const subjects = getSubjectFilters(assessments);

  return (
    <div className="assessments-page">
      <HomeWideBanner
        imageSrc={getSubjectImage('mathematics')}
        imageAlt="Student working on an assessment"
        eyebrow="Assessments"
        title="Prove what you know. Earn what you deserve."
      />

      <div className="page-section assessments-page-body">
        <div className="container-wide">
          <div className="assessments-stats-row">
            <AssessmentsCatalogInsight />

            <Suspense fallback={null}>
              <AssessmentsFilters subjects={subjects} />
            </Suspense>
          </div>

          <Suspense fallback={null}>
            <AssessmentsCatalog assessments={assessments} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
