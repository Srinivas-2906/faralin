import type { ReactNode } from 'react';

type CatalogInsightProps = {
  variant: 'copper';
  eyebrow: string;
  children: ReactNode;
};

export function CatalogInsight({ variant, eyebrow, children }: CatalogInsightProps) {
  return (
    <div className={`catalog-insight catalog-insight--${variant}`}>
      <p className="catalog-insight-eyebrow">{eyebrow}</p>
      <div className="catalog-insight-body">{children}</div>
    </div>
  );
}

export function AssessmentsCatalogInsight() {
  return (
    <CatalogInsight variant="copper" eyebrow="Trust levels">
      <p className="catalog-insight-line">
        Progress from practice to verified work that partner universities can see.
        <span className="catalog-insight-hint"> Use filters →</span>
      </p>
    </CatalogInsight>
  );
}

export function UniversitiesCatalogInsight() {
  return (
    <CatalogInsight variant="copper" eyebrow="Find your partner">
      <p className="catalog-insight-line">
        Compare Faralin conversion rates and apply when you are ready.
        <span className="catalog-insight-hint"> Use search →</span>
      </p>
    </CatalogInsight>
  );
}
