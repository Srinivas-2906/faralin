'use client';

import type { ReactNode } from 'react';
import { InfoTooltip } from '@faralin/ui';
import { STUDENT_HELP_COPY } from '@/lib/student-help-copy';

type CatalogInsightProps = {
  variant: 'copper';
  eyebrow: string;
  tooltipLabel?: string;
  tooltipContent?: ReactNode;
  children?: ReactNode;
};

export function CatalogInsight({
  variant,
  eyebrow,
  tooltipLabel,
  tooltipContent,
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
      {children ? <div className="catalog-insight-body">{children}</div> : null}
    </div>
  );
}

export function AssessmentsCatalogInsight() {
  return (
    <CatalogInsight
      variant="copper"
      eyebrow="Assessments"
      tooltipLabel="About assessments"
      tooltipContent={STUDENT_HELP_COPY.assessmentsCatalog}
    />
  );
}

export function UniversitiesCatalogInsight() {
  return (
    <CatalogInsight
      variant="copper"
      eyebrow="Partner universities"
      tooltipLabel="About partner universities"
      tooltipContent={STUDENT_HELP_COPY.universitiesCatalog}
    />
  );
}
