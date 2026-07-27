'use client';

import { CatalogInsight } from '@/components/catalog-insight';
import { STUDENT_HELP_COPY } from '@/lib/student-help-copy';
import type { ReactNode } from 'react';

export function TracksCatalogInsight({ filters }: { filters?: ReactNode }) {
  return (
    <CatalogInsight
      variant="copper"
      eyebrow="Guided investigations"
      tooltipLabel="About guided investigations"
      tooltipContent={STUDENT_HELP_COPY.guidedInvestigations}
      filters={filters}
    />
  );
}
