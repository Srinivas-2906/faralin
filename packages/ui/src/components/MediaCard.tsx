import type { ReactNode } from 'react';
import { MediaImage } from './MediaImage';
import { PartnerPennant } from './PartnerPennant';

interface MediaCardProps {
  imageSrc: string;
  imageAlt: string;
  title: ReactNode;
  meta?: ReactNode;
  eyebrow?: ReactNode;
  horizontal?: boolean;
  href?: string;
  children?: ReactNode;
  aspect?: '16x9' | '4x3' | '1x1';
  variant?: 'default' | 'dark';
  size?: 'default' | 'large';
  overlay?: boolean;
  photoStyle?: 'default' | 'hero';
  ribbon?: boolean;
}

export function MediaCard({
  imageSrc,
  imageAlt,
  title,
  meta,
  eyebrow,
  horizontal = false,
  href,
  children,
  aspect = '16x9',
  variant = 'default',
  size = 'default',
  overlay = false,
  photoStyle = 'default',
  ribbon,
}: MediaCardProps) {
  const body = (
    <div className={`media-card-body${overlay ? ' media-card-body--overlay' : ''}`}>
      {eyebrow && <div className="media-card-eyebrow">{eyebrow}</div>}
      <div className="media-card-title">{title}</div>
      {meta && <div className="media-card-meta">{meta}</div>}
      {children}
    </div>
  );

  const inner = overlay ? (
    <div className="media-card-visual">
      <MediaImage src={imageSrc} alt={imageAlt} aspect={aspect} frameClassName="media-frame--fill" />
      <div className="media-card-scrim" aria-hidden="true" />
      {photoStyle === 'hero' && <div className="media-card-photo-accent" aria-hidden="true" />}
      {ribbon && (
        <span className="media-card-ribbon" aria-hidden="true">
          <PartnerPennant />
        </span>
      )}
      {body}
    </div>
  ) : (
    <>
      <MediaImage src={imageSrc} alt={imageAlt} aspect={horizontal ? '1x1' : aspect} />
      {body}
    </>
  );

  const className = [
    'media-card',
    horizontal ? 'media-card--horizontal' : '',
    variant === 'dark' ? 'media-card--dark' : '',
    size === 'large' ? 'media-card--large' : '',
    overlay ? 'media-card--overlay' : '',
    photoStyle === 'hero' ? 'media-card--hero-photo' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <a href={href} className={className} style={{ textDecoration: 'none', color: 'inherit' }}>
        {inner}
      </a>
    );
  }

  return <article className={className}>{inner}</article>;
}
