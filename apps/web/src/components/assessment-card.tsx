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
  category?: string;
  seriesSlug?: string | null;
  levelOrder?: number | null;
  levelLabel?: string | null;
  lockState?: string;
  lockReason?: string | null;
  prerequisiteAssessment?: { slug: string; title: string } | null;
  subject: { name: string; slug: string };
  availableUniversities?: Array<{ universityId: string; slug: string; shortName: string }>;
  previewReward?: number | null;
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
        {assessment.levelLabel ? (
          <div className="media-card-meta">{assessment.levelLabel}</div>
        ) : null}
        <div className="media-card-meta">
          {assessment.lockState === 'LOCKED' && assessment.lockReason ? (
            <span className="assessment-lock-notice">{assessment.lockReason}</span>
          ) : assessment.previewReward != null ? (
            `From ${assessment.previewReward} Faralins`
          ) : (
            `${assessment.estimatedFaralinMin}–${assessment.estimatedFaralinMax} Faralins`
          )}
        </div>
        {assessment.availableUniversities && assessment.availableUniversities.length > 0 ? (
          <div className="media-card-meta assessment-availability">
            Available at {assessment.availableUniversities.map((u) => u.shortName).join(', ')}
          </div>
        ) : null}
      </div>
    </a>
  );
}
