import { CatalogInsight } from '@/components/catalog-insight';

export function TracksCatalogInsight() {
  return (
    <CatalogInsight variant="copper" eyebrow="Guided investigations">
      <p className="catalog-insight-line">
        Problem Tracks are not quizzes — they walk you through learn, practice, solve, and reflect
        steps until you produce portfolio-ready work.
        <span className="catalog-insight-hint"> Filter by difficulty →</span>
      </p>
    </CatalogInsight>
  );
}
