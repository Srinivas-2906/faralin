'use client';

import { PRESTIGE_TIER_LABELS } from '@faralin/types';
import {
  CatalogFilterChips,
  type CatalogFilterOption,
} from '@/components/catalog-filter-chips';

const TIER_FILTERS: CatalogFilterOption[] = [
  { value: '', label: 'All partners' },
  ...Object.entries(PRESTIGE_TIER_LABELS).map(([value, label]) => ({ value, label })),
];

export function UniversitiesFilters() {
  return (
    <CatalogFilterChips
      options={TIER_FILTERS}
      paramKey="tier"
      ariaLabel="Filter by partner tier"
      basePath="/universities"
    />
  );
}
