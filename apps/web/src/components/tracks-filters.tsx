'use client';

import { TRACK_DIFFICULTY_LABELS } from '@faralin/types';
import { InfoTooltip } from '@faralin/ui';
import {
  CatalogFilterChips,
  type CatalogFilterOption,
} from '@/components/catalog-filter-chips';
import { STUDENT_HELP_COPY } from '@/lib/student-help-copy';

const BAND_FILTERS: CatalogFilterOption[] = [
  { value: '', label: 'All tracks' },
  ...Object.entries(TRACK_DIFFICULTY_LABELS).map(([value, label]) => ({ value, label })),
];

export function TracksFilters() {
  return (
    <div className="catalog-filter-row">
      <p className="catalog-filter-row-label">
        Difficulty
        <InfoTooltip label="About track difficulty">
          {STUDENT_HELP_COPY.guidedInvestigations}
        </InfoTooltip>
      </p>
      <CatalogFilterChips
        options={BAND_FILTERS}
        paramKey="band"
        ariaLabel="Filter by difficulty"
        basePath="/tracks"
      />
    </div>
  );
}
