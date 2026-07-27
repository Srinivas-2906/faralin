import { Suspense } from 'react';
import { AssessmentsCatalogToolbar } from '@/components/assessments-filters';
import { HomeWideBanner } from '@/components/home-wide-banner';
import { AssessmentsCatalogLoader } from '@/components/assessments-catalog-loader';
import type { AssessmentListItem } from '@/components/assessments-catalog';
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

export default async function AssessmentsPage() {
  const assessments = await getAssessments();

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
          <Suspense fallback={null}>
            <AssessmentsCatalogToolbar />
          </Suspense>

          <Suspense fallback={null}>
            <AssessmentsCatalogLoader initialAssessments={assessments} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
