'use client';

import { Fragment, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmptyState } from '@faralin/ui';
import { UniversityCard } from '@/components/university-card';
import { chunk, useCatalogGridColumns } from '@/lib/catalog-grid';

import type { UniversityPrestigeTier } from '@faralin/types';

export interface UniversityListItem {
  slug: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  description: string | null;
  applyUrl: string | null;
  conversionRule: { faralinsPerGbp: number } | null;
  prestigeTier?: UniversityPrestigeTier | null;
  guardianRank2025?: number | null;
}

export function UniversitiesCatalog({ universities }: { universities: UniversityListItem[] }) {
  const searchParams = useSearchParams();
  const gridRef = useRef<HTMLDivElement>(null);
  const columns = useCatalogGridColumns(gridRef);

  const query = (searchParams.get('q') ?? '').trim().toLowerCase();
  const tier = searchParams.get('tier') ?? '';

  const filtered = useMemo(() => {
    return universities.filter((u) => {
      if (tier && u.prestigeTier !== tier) return false;
      if (!query) return true;
      const haystack = [u.name, u.shortName, u.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [universities, query, tier]);

  const rows = useMemo(() => chunk(filtered, columns), [filtered, columns]);

  if (universities.length === 0) {
    return <EmptyState message="No partner universities available." />;
  }

  return (
    <div id="catalog" className="universities-catalog">
      {filtered.length === 0 ? (
        <EmptyState message="No universities match your search. Try a different name or clear the search." />
      ) : (
        <div ref={gridRef} className="assessments-catalog-grid">
          {rows.map((row, rowIndex) => (
            <Fragment key={rowIndex}>
              {rowIndex > 0 && (
                <hr className="assessment-catalog-row-divider" aria-hidden="true" />
              )}
              <div className="assessment-card-row">
                {row.map((u) => (
                  <UniversityCard key={u.slug} university={u} />
                ))}
              </div>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
