import type { ReactNode } from 'react';

interface PromoCardProps {
  href: string;
  title: ReactNode;
  subtitle?: ReactNode;
  variant?: 'copper' | 'crimson' | 'eucalyptus' | 'ink';
}

export function PromoCard({ href, title, subtitle, variant = 'copper' }: PromoCardProps) {
  return (
    <a href={href} className={`promo-card promo-card--${variant}`}>
      <div className="promo-card-copy">
        <p className="promo-card-title">{title}</p>
        {subtitle && <p className="promo-card-subtitle">{subtitle}</p>}
      </div>
      <span className="promo-card-arrow" aria-hidden="true">
        →
      </span>
    </a>
  );
}
