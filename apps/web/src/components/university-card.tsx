import { MediaImage } from '@faralin/ui';
import type { UniversityPrestigeTier } from '@faralin/types';
import { PRESTIGE_TIER_LABELS } from '@faralin/types';
import {
  exampleGbpAtFaralins,
  formatFaralinPerGbp,
} from '@faralin/utils';
import { getUniversityImage } from '@/lib/media';

export interface UniversityCardData {
  slug: string;
  name: string;
  shortName?: string | null;
  logoUrl?: string | null;
  conversionRule?: { faralinsPerGbp: number } | null;
  prestigeTier?: UniversityPrestigeTier | null;
  guardianRank2025?: number | null;
}

type UniversityCardProps = {
  university: UniversityCardData;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
};

function tierBadgeLabel(university: UniversityCardData): string | null {
  if (!university.prestigeTier) return null;
  const tier = PRESTIGE_TIER_LABELS[university.prestigeTier];
  if (university.guardianRank2025) {
    return `${tier} · #${university.guardianRank2025}`;
  }
  return tier;
}

function UniversityCardContent({ university }: { university: UniversityCardData }) {
  const tierLabel = tierBadgeLabel(university);
  const faralinsPerGbp = university.conversionRule?.faralinsPerGbp;

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
        {tierLabel && (
          <div className={`university-card-tier university-card-tier--${university.prestigeTier?.toLowerCase()}`}>
            {tierLabel}
          </div>
        )}
      </div>
      <div className="assessment-card-details">
        <div className="media-card-title">{university.name}</div>
        {faralinsPerGbp && (
          <div className="university-card-conversion">
            <p className="university-card-conversion-rate">{formatFaralinPerGbp(faralinsPerGbp)}</p>
            <p className="university-card-conversion-example">{exampleGbpAtFaralins(faralinsPerGbp)}</p>
          </div>
        )}
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
