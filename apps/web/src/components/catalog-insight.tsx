'use client';

import type { ReactNode } from 'react';
import { InfoTooltip } from '@faralin/ui';
import { STUDENT_HELP_COPY } from '@/lib/student-help-copy';

type CatalogInsightProps = {
  variant: 'copper';
  eyebrow: string;
  tooltipLabel?: string;
  tooltipContent?: ReactNode;
  filters?: ReactNode;
  children?: ReactNode;
};

export function CatalogInsight({
  variant,
  eyebrow,
  tooltipLabel,
  tooltipContent,
  filters,
  children,
}: CatalogInsightProps) {
  return (
    <div className={`catalog-insight catalog-insight--${variant}`}>
      <p className="catalog-insight-eyebrow">
        {eyebrow}
        {tooltipLabel && tooltipContent ? (
          <InfoTooltip label={tooltipLabel}>{tooltipContent}</InfoTooltip>
        ) : null}
      </p>
      {filters ? <div className="catalog-insight-filters">{filters}</div> : null}
      {children ? <div className="catalog-insight-body">{children}</div> : null}
    </div>
  );
}

export function AssessmentsCatalogInsight({ filters }: { filters?: ReactNode }) {
  return (
    <CatalogInsight
      variant="copper"
      eyebrow="Assessments"
      tooltipLabel="About assessments"
      tooltipContent={STUDENT_HELP_COPY.assessmentsCatalog}
      filters={filters}
    />
  );
}

export function UniversitiesCatalogInsight({ filters }: { filters?: ReactNode }) {
  return (
    <CatalogInsight
      variant="copper"
      eyebrow="Partner universities"
      tooltipLabel="About partner universities"
      tooltipContent={STUDENT_HELP_COPY.universitiesCatalog}
      filters={filters}
    />
  );
}
