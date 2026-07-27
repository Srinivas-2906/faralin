import Link from 'next/link';
import { MIN_DISPLAY_AWARD_GBP } from '@faralin/types';
import { InfoTooltip, MediaImage } from '@faralin/ui';
import { getUniversityImage } from '@/lib/media';
import { STUDENT_HELP_COPY } from '@/lib/student-help-copy';

export interface UniversityEstimatePreviewItem {
  universitySlug: string;
  universityName: string;
  estimatedAwardGbp: number;
}

type UniversityEstimatePreviewProps = {
  universities: UniversityEstimatePreviewItem[];
  totalCount: number;
};

export function UniversityEstimatePreview({
  universities,
  totalCount,
}: UniversityEstimatePreviewProps) {
  return (
    <div className="university-preview-list">
      {universities.map((university) => {
        const showCashEstimate = university.estimatedAwardGbp >= MIN_DISPLAY_AWARD_GBP;
        return (
          <Link
            key={university.universitySlug}
            href={`/universities/${university.universitySlug}`}
            className="university-preview-row"
          >
            <div className="university-preview-row-media">
              <MediaImage
                src={getUniversityImage(university.universitySlug)}
                alt={university.universityName}
                aspect="1x1"
              />
            </div>
            <div className="university-preview-row-body">
              <p className="university-preview-row-title">{university.universityName}</p>
              <span
                className={`university-preview-row-value${
                  showCashEstimate ? '' : ' university-preview-row-value--building'
                }`}
              >
                {showCashEstimate
                  ? `£${university.estimatedAwardGbp.toFixed(2)}`
                  : 'Building…'}
                <InfoTooltip
                  label={
                    showCashEstimate
                      ? 'About estimated value'
                      : 'About award building status'
                  }
                >
                  {showCashEstimate
                    ? STUDENT_HELP_COPY.estimatedValue
                    : STUDENT_HELP_COPY.awardBuilding}
                </InfoTooltip>
              </span>
            </div>
          </Link>
        );
      })}

      {totalCount > 0 ? (
        <p className="university-preview-footer">
          <Link href="/partners" className="dashboard-section-link">
            View all {totalCount} {totalCount === 1 ? 'university' : 'universities'} →
          </Link>
        </p>
      ) : null}
    </div>
  );
}
