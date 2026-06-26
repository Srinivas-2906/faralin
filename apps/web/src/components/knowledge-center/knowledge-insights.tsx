import {
  AssessmentsCatalogInsight,
  CatalogInsight,
  UniversitiesCatalogInsight,
} from '@/components/catalog-insight';

export function BlogsCatalogInsight() {
  return (
    <CatalogInsight variant="copper" eyebrow="Editorial">
      <p className="catalog-insight-line">
        Guides and explainers on recognition, portfolios, and applying with confidence.
        <span className="catalog-insight-hint"> Browse blogs →</span>
      </p>
    </CatalogInsight>
  );
}

export function NewsCatalogInsight() {
  return (
    <CatalogInsight variant="copper" eyebrow="Partner updates">
      <p className="catalog-insight-line">
        News and announcements from universities you follow on Faralin.
        <span className="catalog-insight-hint"> Read news →</span>
      </p>
    </CatalogInsight>
  );
}

export function CoursesCatalogInsight() {
  return (
    <CatalogInsight variant="copper" eyebrow="Video courses">
      <p className="catalog-insight-line">
        Structured video lessons with progress tracking — learn at your own pace.
        <span className="catalog-insight-hint"> Start learning →</span>
      </p>
    </CatalogInsight>
  );
}

export function ResourcesCatalogInsight() {
  return (
    <CatalogInsight variant="copper" eyebrow="Study materials">
      <p className="catalog-insight-line">
        Worksheets, guides, and reference packs from our partner All Newtons.
        <span className="catalog-insight-hint"> Open resources →</span>
      </p>
    </CatalogInsight>
  );
}

export { AssessmentsCatalogInsight, UniversitiesCatalogInsight };
