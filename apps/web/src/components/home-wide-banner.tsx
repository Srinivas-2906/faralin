import Link from 'next/link';
import type { ReactNode } from 'react';

interface HomeWideBannerProps {
  imageSrc: string;
  imageAlt: string;
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  href?: string;
  ctaLabel?: string;
}

export function HomeWideBanner({
  imageSrc,
  imageAlt,
  eyebrow,
  title,
  subtitle,
  href,
  ctaLabel,
}: HomeWideBannerProps) {
  return (
    <div className="home-wide-banner">
      <div
        className="home-wide-banner-bg"
        style={{ backgroundImage: `url(${imageSrc})` }}
        role="img"
        aria-label={imageAlt}
      />
      <div className="home-wide-banner-scrim" aria-hidden="true" />
      <div className="home-wide-banner-content container-wide">
        {eyebrow && <p className="home-wide-banner-eyebrow">{eyebrow}</p>}
        <h2 className="home-wide-banner-title">{title}</h2>
        {subtitle && <p className="home-wide-banner-subtitle">{subtitle}</p>}
        {href && ctaLabel && (
          <Link href={href} className="btn btn-copper home-wide-banner-cta">
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
