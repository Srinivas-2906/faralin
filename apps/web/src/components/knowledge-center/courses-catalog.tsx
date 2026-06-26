'use client';

import { Fragment, useMemo, useRef } from 'react';
import { EmptyState } from '@faralin/ui';
import { chunk, useCatalogGridColumns } from '@/lib/catalog-grid';
import type { CourseListItem } from '@/lib/knowledge';
import { CourseCard } from './course-card';

export function CoursesCatalog({ courses }: { courses: CourseListItem[] }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const columns = useCatalogGridColumns(gridRef);
  const rows = useMemo(() => chunk(courses, columns), [courses, columns]);

  if (courses.length === 0) {
    return <EmptyState message="No courses available yet." />;
  }

  return (
    <div id="catalog" className="assessments-catalog">
      <div ref={gridRef} className="assessments-catalog-grid">
        {rows.map((row, rowIndex) => (
          <Fragment key={rowIndex}>
            {rowIndex > 0 && (
              <hr className="assessment-catalog-row-divider" aria-hidden="true" />
            )}
            <div className="assessment-card-row">
              {row.map((course) => (
                <CourseCard key={course.slug} course={course} />
              ))}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
