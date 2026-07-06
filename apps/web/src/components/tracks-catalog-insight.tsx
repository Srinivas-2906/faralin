import { CatalogInsight } from '@/components/catalog-insight';

export function TracksCatalogInsight() {
  return (
    <CatalogInsight variant="copper" eyebrow="Guided investigations">
      <p className="catalog-insight-line">
        Guided investigations — learn, solve, and reflect.
        <span className="catalog-insight-hint"> Filter by difficulty →</span>
      </p>
    </CatalogInsight>
  );
}
