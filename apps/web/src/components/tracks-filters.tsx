'use client';

import { TRACK_DIFFICULTY_LABELS } from '@faralin/types';
import {
  CatalogFilterChips,
  type CatalogFilterOption,
} from '@/components/catalog-filter-chips';

const BAND_FILTERS: CatalogFilterOption[] = [
  { value: '', label: 'All tracks' },
  ...Object.entries(TRACK_DIFFICULTY_LABELS).map(([value, label]) => ({ value, label })),
];

export function TracksFilters() {
  return (
    <CatalogFilterChips
      options={BAND_FILTERS}
      paramKey="band"
      ariaLabel="Filter by track"
      basePath="/tracks"
    />
  );
}
