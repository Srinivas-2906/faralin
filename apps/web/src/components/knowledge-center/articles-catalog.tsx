'use client';

import { Fragment, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmptyState } from '@faralin/ui';
import { chunk, useCatalogGridColumns } from '@/lib/catalog-grid';
import type { KnowledgeArticleListItem } from '@/lib/knowledge';
import { ArticleCard } from './article-card';

export function ArticlesCatalog({ articles }: { articles: KnowledgeArticleListItem[] }) {
  const searchParams = useSearchParams();
  const gridRef = useRef<HTMLDivElement>(null);
  const columns = useCatalogGridColumns(gridRef);
  const subject = searchParams.get('subject') ?? '';

  const filtered = useMemo(() => {
    if (!subject) return articles;
    return articles.filter((article) => article.subjectTags.includes(subject));
  }, [articles, subject]);

  const rows = useMemo(() => chunk(filtered, columns), [filtered, columns]);

  if (articles.length === 0) {
    return <EmptyState message="No articles available yet." />;
  }

  return (
    <div id="catalog" className="assessments-catalog">
      {filtered.length === 0 ? (
        <EmptyState message="No articles match this subject filter." />
      ) : (
        <div ref={gridRef} className="assessments-catalog-grid">
          {rows.map((row, rowIndex) => (
            <Fragment key={rowIndex}>
              {rowIndex > 0 && (
                <hr className="assessment-catalog-row-divider" aria-hidden="true" />
              )}
              <div className="assessment-card-row">
                {row.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
