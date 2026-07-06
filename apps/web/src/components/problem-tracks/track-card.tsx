import { Badge, MediaImage } from '@faralin/ui';
import { TRACK_DIFFICULTY_LABELS } from '@faralin/types';
import { getAssessmentImage, getAssessmentImageFallback } from '@/lib/media';
import { trustBadgeVariant, TRUST_LEVEL_SHORT_LABELS } from '@/components/assessment-card';

export interface ProblemTrackListItem {
  slug: string;
  title: string;
  subtitle: string | null;
  difficultyBand: keyof typeof TRACK_DIFFICULTY_LABELS;
  trustLevel: keyof typeof TRUST_LEVEL_SHORT_LABELS;
  maxFaralins: number;
  estimatedHoursMin: number;
  estimatedHoursMax: number;
  timeCapHours: number;
  yearLevels: string[];
  partnerUniversityCategories: string[];
  skills?: string[];
  subject: { name: string; slug: string };
  secondarySubjectSlug?: string | null;
}

export function ProblemTrackCard({
  track,
  compact = false,
  variant = 'catalog',
}: {
  track: ProblemTrackListItem;
  compact?: boolean;
  variant?: 'catalog' | 'dashboard';
}) {
  const compactClass = compact || variant === 'dashboard' ? ' assessment-card-split--compact' : '';
  const trackClass = variant === 'dashboard' ? ' track-card--dashboard' : ' track-card--catalog';
  const subjectClass = ` track-card--${track.subject.slug}`;

  return (
    <a
      href={`/tracks/${track.slug}`}
      className={`media-card assessment-card-split track-card${compactClass}${trackClass}${variant === 'catalog' ? subjectClass : ''}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="assessment-card-visual">
        <MediaImage
          src={getAssessmentImage(track.slug, track.subject.slug)}
          alt={track.title}
          aspect="16x9"
          frameClassName="media-frame--fill"
          fallbackSrc={getAssessmentImageFallback(track.subject.slug)}
        />
        <div className="assessment-card-badges-overlay" aria-hidden="true" />
        <div className="assessment-card-badges">
          <Badge>{TRACK_DIFFICULTY_LABELS[track.difficultyBand]}</Badge>
          <Badge variant={trustBadgeVariant(track.trustLevel)}>
            {TRUST_LEVEL_SHORT_LABELS[track.trustLevel]}
          </Badge>
        </div>
      </div>
      <div className="assessment-card-details">
        <div className="media-card-eyebrow">
          {track.subject.name}
          {track.secondarySubjectSlug ? ` · ${track.secondarySubjectSlug}` : ''}
        </div>
        <div className="media-card-title">{track.title}</div>
        {variant === 'catalog' && track.subtitle ? (
          <p className="track-card__subtitle">{track.subtitle}</p>
        ) : null}
        <div className="media-card-meta">
          Up to {track.maxFaralins.toLocaleString()} Faralins · {track.estimatedHoursMin}–
          {track.estimatedHoursMax}h
        </div>
        {variant === 'catalog' && track.skills?.length ? (
          <div className="track-card__skills">
            {track.skills.slice(0, 3).map((skill) => (
              <span key={skill} className="track-card__skill-chip">
                {skill}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </a>
  );
}
