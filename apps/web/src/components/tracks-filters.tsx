'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Chip } from '@faralin/ui';
import { TRACK_DIFFICULTY_LABELS } from '@faralin/types';

const BAND_FILTERS = [
  { value: '', label: 'All tracks' },
  ...Object.entries(TRACK_DIFFICULTY_LABELS).map(([value, label]) => ({ value, label })),
] as const;

export function TracksFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const band = searchParams.get('band') ?? '';

  const setBand = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('band', value);
      } else {
        params.delete('band');
      }
      const query = params.toString();
      router.replace(query ? `/tracks?${query}` : '/tracks', { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="tracks-filter-chips-row" role="group" aria-label="Filter by difficulty">
      {BAND_FILTERS.map((f) => (
        <Chip
          key={f.value || 'all-bands'}
          className="tracks-filter-chip"
          selected={band === f.value}
          onClick={() => setBand(f.value)}
        >
          {f.label}
        </Chip>
      ))}
    </div>
  );
}
