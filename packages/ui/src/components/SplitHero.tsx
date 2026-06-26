import type { ReactNode } from 'react';
import { MediaImage } from './MediaImage';

interface SplitHeroProps {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  imageSrc: string;
  imageAlt: string;
}

export function SplitHero({ eyebrow, title, lead, actions, imageSrc, imageAlt }: SplitHeroProps) {
  return (
    <section className="split-hero-wrap">
      <div className="split-hero container-wide">
        <div className="split-hero-copy">
          {eyebrow && <p className="hero-eyebrow">{eyebrow}</p>}
          <h1 className="display-title" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '1rem' }}>
            {title}
          </h1>
          {lead && <p className="split-hero-lead">{lead}</p>}
          {actions && <div className="cluster">{actions}</div>}
        </div>
        <div className="split-hero-visual">
          <MediaImage src={imageSrc} alt={imageAlt} aspect="4x3" />
        </div>
      </div>
    </section>
  );
}
