'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Chip } from '@faralin/ui';

const TRUST_FILTERS = [
  { value: '', label: 'All trust levels' },
  { value: 'PRACTICE', label: 'Practice' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'PARTNER_VERIFIED', label: 'Partner verified' },
] as const;

const DIFFICULTY_FILTERS = [
  { value: '', label: 'All levels' },
  { value: 'FOUNDATION', label: 'Foundation' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'ADVANCED', label: 'Advanced' },
] as const;

interface AssessmentsFiltersProps {
  subjects: Array<{ slug: string; name: string }>;
}

export function AssessmentsFilters({ subjects }: AssessmentsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const trust = searchParams.get('trust') ?? '';
  const difficulty = searchParams.get('difficulty') ?? '';
  const subject = searchParams.get('subject') ?? '';

  const hasActiveFilters = Boolean(trust || difficulty || subject);
  const activeFilterCount = useMemo(
    () => [trust, difficulty, subject].filter(Boolean).length,
    [trust, difficulty, subject],
  );

  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const setFilter = useCallback(
    (key: 'trust' | 'difficulty' | 'subject', value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const query = params.toString();
      router.replace(query ? `/assessments?${query}` : '/assessments', { scroll: false });
    },
    [router, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.replace('/assessments', { scroll: false });
  }, [router]);

  useEffect(() => {
    if (!filtersOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFiltersOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [filtersOpen]);

  return (
    <div className="assessments-stats-actions">
      <div className="assessments-filter-dropdown" ref={filterRef}>
        <button
          type="button"
          className={`assessments-filter-trigger${filtersOpen ? ' assessments-filter-trigger--open' : ''}${activeFilterCount > 0 ? ' assessments-filter-trigger--active' : ''}`}
          aria-expanded={filtersOpen}
          aria-haspopup="dialog"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          Filters
          {activeFilterCount > 0 && (
            <span className="assessments-filter-badge" aria-label={`${activeFilterCount} active filters`}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {filtersOpen && (
          <div className="assessments-filter-panel" role="dialog" aria-label="Filter assessments">
            <div className="assessments-filters-head">
              <p className="assessments-filters-label">Trust level</p>
              <div className="cluster-sm assessments-filter-chips" role="group" aria-label="Filter by trust level">
                {TRUST_FILTERS.map((f) => (
                  <Chip
                    key={f.value || 'all-trust'}
                    selected={trust === f.value}
                    onClick={() => setFilter('trust', f.value)}
                  >
                    {f.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="assessments-filters-head">
              <p className="assessments-filters-label">Difficulty</p>
              <div className="cluster-sm assessments-filter-chips" role="group" aria-label="Filter by difficulty">
                {DIFFICULTY_FILTERS.map((f) => (
                  <Chip
                    key={f.value || 'all-difficulty'}
                    selected={difficulty === f.value}
                    onClick={() => setFilter('difficulty', f.value)}
                  >
                    {f.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="assessments-filters-head">
              <p className="assessments-filters-label">Subject</p>
              <div className="cluster-sm assessments-filter-chips" role="group" aria-label="Filter by subject">
                <Chip selected={!subject} onClick={() => setFilter('subject', '')}>
                  All subjects
                </Chip>
                {subjects.map((s) => (
                  <Chip
                    key={s.slug}
                    selected={subject === s.slug}
                    onClick={() => setFilter('subject', s.slug)}
                  >
                    {s.name}
                  </Chip>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <div className="assessments-filter-panel-footer">
                <button type="button" className="assessments-clear-filters" onClick={clearFilters}>
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
