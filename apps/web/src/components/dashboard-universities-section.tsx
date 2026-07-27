'use client';

import Link from 'next/link';
import { InfoTooltip } from '@faralin/ui';
import { STUDENT_HELP_COPY } from '@/lib/student-help-copy';
import {
  UniversityEstimatePreview,
  type UniversityEstimatePreviewItem,
} from '@/components/university-estimate-preview';

type DashboardUniversitiesSectionProps = {
  previewUniversities: UniversityEstimatePreviewItem[];
  totalCount: number;
};

export function DashboardUniversitiesSection({
  previewUniversities,
  totalCount,
}: DashboardUniversitiesSectionProps) {
  return (
    <>
      <header className="dashboard-section-head">
        <span className="dashboard-section-head-with-info">
          <h2 className="dashboard-section-title">Your universities</h2>
          <InfoTooltip label="About your universities">
            {STUDENT_HELP_COPY.universitiesSection}
          </InfoTooltip>
        </span>
        {totalCount > 0 ? (
          <Link href="/partners" className="dashboard-section-link">
            View all →
          </Link>
        ) : (
          <Link href="/universities" className="dashboard-section-link">
            Browse universities →
          </Link>
        )}
      </header>
      <UniversityEstimatePreview
        universities={previewUniversities}
        totalCount={totalCount}
      />
    </>
  );
}
