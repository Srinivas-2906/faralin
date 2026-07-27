import type { ReactNode } from 'react';
import { cloneElement, isValidElement } from 'react';

type CatalogFilterToolbarProps = {
  insight: ReactNode;
  filters?: ReactNode;
  filterPanel?: ReactNode;
  actions?: ReactNode;
};

type CatalogInsightLikeProps = {
  filters?: ReactNode;
};

function insightWithFilters(insight: ReactNode, filters?: ReactNode) {
  if (!filters || !isValidElement<CatalogInsightLikeProps>(insight)) return insight;
  return cloneElement(insight, { filters });
}

export function CatalogFilterToolbar({
  insight,
  filters,
  filterPanel,
  actions,
}: CatalogFilterToolbarProps) {
  return (
    <div className="catalog-filter-toolbar">
      <div className="catalog-filter-toolbar-head">
        {insightWithFilters(insight, filters)}
        {actions ? <div className="catalog-filter-toolbar-actions">{actions}</div> : null}
      </div>
      {filterPanel ? <div className="catalog-filter-toolbar-panel">{filterPanel}</div> : null}
    </div>
  );
}
