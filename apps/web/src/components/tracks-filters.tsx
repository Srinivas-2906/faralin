'use client';

import { TRACK_DIFFICULTY_LABELS } from '@faralin/types';
import {
  CatalogFilterGroups,
  type CatalogFilterGroup,
} from '@/components/catalog-filter-groups';
import type { CatalogFilterOption } from '@/components/catalog-filter-chips';
import { STUDENT_HELP_COPY } from '@/lib/student-help-copy';

const BAND_FILTERS: CatalogFilterOption[] = [
  { value: '', label: 'All tracks' },
  ...Object.entries(TRACK_DIFFICULTY_LABELS).map(([value, label]) => ({ value, label })),
];

const TRACK_GROUPS: CatalogFilterGroup[] = [
  {
    id: 'difficulty',
    label: 'Difficulty',
    paramKey: 'band',
    options: BAND_FILTERS,
    tooltipLabel: 'About track difficulty',
    tooltipContent: STUDENT_HELP_COPY.guidedInvestigations,
  },
];

export function TracksFilters() {
  return <CatalogFilterGroups basePath="/tracks" groups={TRACK_GROUPS} />;
}
