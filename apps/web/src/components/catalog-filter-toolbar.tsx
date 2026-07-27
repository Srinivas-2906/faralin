import type { ReactNode } from 'react';
import { CatalogInsight } from '@/components/catalog-insight';

type CatalogFilterToolbarProps = {
  insight: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
};

export function CatalogFilterToolbar({ insight, children, actions }: CatalogFilterToolbarProps) {
  return (
    <div className="catalog-filter-toolbar">
      <div className="catalog-filter-toolbar-head">
        {insight}
        {actions ? <div className="catalog-filter-toolbar-actions">{actions}</div> : null}
      </div>
      {children ? <div className="catalog-filter-toolbar-rows">{children}</div> : null}
    </div>
  );
}
