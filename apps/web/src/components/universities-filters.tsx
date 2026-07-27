'use client';

import { InfoTooltip } from '@faralin/ui';
import { PRESTIGE_TIER_LABELS } from '@faralin/types';
import {
  CatalogFilterChips,
  type CatalogFilterOption,
} from '@/components/catalog-filter-chips';
import { STUDENT_HELP_COPY } from '@/lib/student-help-copy';

const TIER_FILTERS: CatalogFilterOption[] = [
  { value: '', label: 'All partners' },
  ...Object.entries(PRESTIGE_TIER_LABELS).map(([value, label]) => ({ value, label })),
];

export function UniversitiesFilters() {
  return (
    <div className="catalog-filter-row">
      <p className="catalog-filter-row-label">
        Partner tier
        <InfoTooltip label="About partner tiers">{STUDENT_HELP_COPY.universityTier}</InfoTooltip>
      </p>
      <CatalogFilterChips
        options={TIER_FILTERS}
        paramKey="tier"
        ariaLabel="Filter by partner tier"
        basePath="/universities"
      />
    </div>
  );
}
