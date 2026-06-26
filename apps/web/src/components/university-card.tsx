import { MediaImage } from '@faralin/ui';
import { getUniversityImage } from '@/lib/media';

export interface UniversityCardData {
  slug: string;
  name: string;
  shortName?: string | null;
  logoUrl?: string | null;
}

type UniversityCardProps = {
  university: UniversityCardData;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
};

function UniversityCardContent({ university }: { university: UniversityCardData }) {
  return (
    <>
      <div className="assessment-card-visual">
        <MediaImage
          src={getUniversityImage(university.slug, university.logoUrl ?? null)}
          alt={university.name}
          aspect="16x9"
          frameClassName="media-frame--fill"
        />
        <div className="assessment-card-badges-overlay" aria-hidden="true" />
        <div className="media-card-eyebrow assessment-card-visual-eyebrow">
          {university.shortName ?? 'Partner university'}
        </div>
      </div>
      <div className="assessment-card-details">
        <div className="media-card-title">{university.name}</div>
      </div>
    </>
  );
}

export function UniversityCard({
  university,
  selectable = false,
  selected = false,
  onToggle,
}: UniversityCardProps) {
  const className = [
    'media-card',
    'assessment-card-split',
    'university-card-split',
    selectable ? 'university-card-split--selectable' : '',
    selectable && selected ? 'selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (selectable) {
    return (
      <button
        type="button"
        className={className}
        onClick={onToggle}
        aria-pressed={selected}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <UniversityCardContent university={university} />
      </button>
    );
  }

  return (
    <a
      href={`/universities/${university.slug}`}
      className={className}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <UniversityCardContent university={university} />
    </a>
  );
}
