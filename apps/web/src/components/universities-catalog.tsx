'use client';

import { Fragment, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmptyState } from '@faralin/ui';
import { UniversityCard } from '@/components/university-card';
import { chunk, useCatalogGridColumns } from '@/lib/catalog-grid';

export interface UniversityListItem {
  slug: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  description: string | null;
  applyUrl: string | null;
  conversionRule: { faralinsPerGbp: number } | null;
}

export function UniversitiesCatalog({ universities }: { universities: UniversityListItem[] }) {
  const searchParams = useSearchParams();
  const gridRef = useRef<HTMLDivElement>(null);
  const columns = useCatalogGridColumns(gridRef);

  const query = (searchParams.get('q') ?? '').trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query) return universities;
    return universities.filter((u) => {
      const haystack = [u.name, u.shortName, u.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [universities, query]);

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
