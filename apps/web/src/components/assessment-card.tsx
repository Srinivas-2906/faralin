import { Badge, MediaImage } from '@faralin/ui';
import { DIFFICULTY_LABELS } from '@faralin/types';
import { getAssessmentImage, getAssessmentImageFallback } from '@/lib/media';

export const TRUST_LEVEL_SHORT_LABELS = {
  PRACTICE: 'Practice',
  VERIFIED: 'Verified',
  PARTNER_VERIFIED: 'Partner',
} as const;

export interface AssessmentListItem {
  slug: string;
  title: string;
  difficulty: keyof typeof DIFFICULTY_LABELS;
  trustLevel: keyof typeof TRUST_LEVEL_SHORT_LABELS;
  estimatedFaralinMin: number;
  estimatedFaralinMax: number;
  durationMinutes: number | null;
  isTimed: boolean;
  subject: { name: string; slug: string };
}

export function trustBadgeVariant(trustLevel: AssessmentListItem['trustLevel']) {
  if (trustLevel === 'PARTNER_VERIFIED') return 'copper' as const;
  if (trustLevel !== 'PRACTICE') return 'verified' as const;
  return 'default' as const;
}

export function AssessmentCard({
  assessment,
  compact = false,
}: {
  assessment: AssessmentListItem;
  compact?: boolean;
}) {
  return (
    <a
      href={`/assessments/${assessment.slug}`}
      className={`media-card assessment-card-split${compact ? ' assessment-card-split--compact' : ''}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="assessment-card-visual">
        <MediaImage
          src={getAssessmentImage(assessment.slug, assessment.subject.slug)}
          alt={assessment.title}
          aspect="16x9"
          frameClassName="media-frame--fill"
          fallbackSrc={getAssessmentImageFallback(assessment.subject.slug)}
        />
        <div className="assessment-card-badges-overlay" aria-hidden="true" />
        <div className="assessment-card-badges">
          <Badge>{DIFFICULTY_LABELS[assessment.difficulty]}</Badge>
          <Badge variant={trustBadgeVariant(assessment.trustLevel)}>
            {TRUST_LEVEL_SHORT_LABELS[assessment.trustLevel]}
          </Badge>
        </div>
      </div>
      <div className="assessment-card-details">
        <div className="media-card-eyebrow">{assessment.subject.name}</div>
        <div className="media-card-title">{assessment.title}</div>
        <div className="media-card-meta">
          {`${assessment.estimatedFaralinMin}–${assessment.estimatedFaralinMax} Faralins`}
        </div>
      </div>
    </a>
  );
}
