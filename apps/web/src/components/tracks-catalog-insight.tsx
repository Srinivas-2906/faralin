'use client';

import { CatalogInsight } from '@/components/catalog-insight';
import { STUDENT_HELP_COPY } from '@/lib/student-help-copy';

export function TracksCatalogInsight() {
  return (
    <CatalogInsight
      variant="copper"
      eyebrow="Guided investigations"
      tooltipLabel="About guided investigations"
      tooltipContent={STUDENT_HELP_COPY.guidedInvestigations}
    >
      <p className="catalog-insight-line">
        Guided investigations — learn, solve, and reflect.
      </p>
    </CatalogInsight>
  );
}
