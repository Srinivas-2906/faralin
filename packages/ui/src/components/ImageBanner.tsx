import type { ReactNode } from 'react';

interface ImageBannerProps {
  imageSrc: string;
  imageAlt: string;
  title: ReactNode;
  subtitle?: ReactNode;
}

export function ImageBanner({ imageSrc, imageAlt, title, subtitle }: ImageBannerProps) {
  return (
    <div className="image-banner">
      <div
        className="image-banner-bg"
        style={{ backgroundImage: `url(${imageSrc})` }}
        role="img"
        aria-label={imageAlt}
      />
      <div className="image-banner-scrim" />
      <div className="image-banner-content">
        <h1 className="display-title">{title}</h1>
        {subtitle && <p style={{ opacity: 0.9, marginTop: '0.5rem', maxWidth: '36rem' }}>{subtitle}</p>}
      </div>
    </div>
  );
}
