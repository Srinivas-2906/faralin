'use client';

import { Fragment, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmptyState } from '@faralin/ui';
import { chunk, useCatalogGridColumns } from '@/lib/catalog-grid';
import { AssessmentCard, type AssessmentListItem } from '@/components/assessment-card';

export type { AssessmentListItem };

export function AssessmentsCatalog({ assessments }: { assessments: AssessmentListItem[] }) {
  const searchParams = useSearchParams();
  const gridRef = useRef<HTMLDivElement>(null);
  const columns = useCatalogGridColumns(gridRef);

  const trust = searchParams.get('trust') ?? '';
  const difficulty = searchParams.get('difficulty') ?? '';
  const subject = searchParams.get('subject') ?? '';
  const subjectsParam = searchParams.get('subjects') ?? '';
  const subjectSlugs = subjectsParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const filtered = useMemo(() => {
    return assessments.filter((a) => {
      if (subjectSlugs.length > 0 && !subjectSlugs.includes(a.subject.slug)) return false;
      if (trust && a.trustLevel !== trust) return false;
      if (difficulty && a.difficulty !== difficulty) return false;
      if (subject && a.subject.slug !== subject) return false;
      return true;
    });
  }, [assessments, trust, difficulty, subject, subjectsParam]);

  const rows = useMemo(() => chunk(filtered, columns), [filtered, columns]);

  if (assessments.length === 0) {
    return <EmptyState message="No assessments available." />;
  }

  return (
    <div id="catalog" className="assessments-catalog">
      {filtered.length === 0 ? (
        <EmptyState message="No assessments match your filters. Try clearing a filter or choosing a different subject." />
      ) : (
        <div ref={gridRef} className="assessments-catalog-grid">
          {rows.map((row, rowIndex) => (
            <Fragment key={rowIndex}>
              {rowIndex > 0 && (
                <hr className="assessment-catalog-row-divider" aria-hidden="true" />
              )}
              <div className="assessment-card-row">
                {row.map((a) => (
                  <AssessmentCard key={a.slug} assessment={a} />
                ))}
              </div>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
