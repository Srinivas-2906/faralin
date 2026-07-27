'use client';

import { PRESTIGE_TIER_LABELS } from '@faralin/types';
import {
  CatalogFilterChips,
  type CatalogFilterOption,
} from '@/components/catalog-filter-chips';

const TIER_CHIP_LABELS: Record<string, string> = {
  ESTABLISHED: 'Established',
  ACCESSIBLE: 'Accessible',
};

const TIER_FILTERS: CatalogFilterOption[] = [
  { value: '', label: 'All' },
  ...Object.entries(PRESTIGE_TIER_LABELS).map(([value, label]) => ({
    value,
    label: TIER_CHIP_LABELS[value] ?? label,
  })),
];

export function UniversitiesFilters() {
  return (
    <CatalogFilterChips
      options={TIER_FILTERS}
      paramKey="tier"
      ariaLabel="Filter by tier"
      basePath="/universities"
    />
  );
}
