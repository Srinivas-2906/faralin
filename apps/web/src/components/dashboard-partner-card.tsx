import Link from 'next/link';
import { MIN_DISPLAY_AWARD_GBP } from '@faralin/types';
import { MediaImage } from '@faralin/ui';
import { getUniversityImage } from '@/lib/media';

export interface DashboardPartnerUniversity {
  universitySlug: string;
  universityName: string;
  countedFaralins?: number;
  estimatedAwardGbp: number;
  awardStatus?: string;
  awardStatusLabel?: string;
}

type DashboardPartnerCardProps = {
  university: DashboardPartnerUniversity;
};

function shortUniversityName(name: string): string {
  return name.replace(/^University of /i, '').replace(/ University$/i, '');
}

export function DashboardPartnerCard({ university }: DashboardPartnerCardProps) {
  const {
    universitySlug,
    universityName,
    countedFaralins,
    estimatedAwardGbp,
    awardStatus,
    awardStatusLabel,
  } = university;

  const shortName = shortUniversityName(universityName);
  const showCashEstimate = estimatedAwardGbp >= MIN_DISPLAY_AWARD_GBP;
  const isConfirmed =
    awardStatus === 'CONVERTED' || awardStatus === 'CONFIRMED';
  const statusLabel =
    awardStatusLabel ??
    (isConfirmed ? 'Confirmed award' : awardStatus === 'FORFEITED' ? 'Forfeited' : 'Estimate only');

  return (
    <article className="dashboard-bento-item">
      <div className="dashboard-bento-item-media">
        <MediaImage
          src={getUniversityImage(universitySlug)}
          alt={universityName}
          aspect="4x3"
        />
      </div>
      <div className="dashboard-bento-item-body">
        <div className="dashboard-bento-item-top">
          <p className="dashboard-bento-item-title">{universityName}</p>
          <Link href={`/universities/${universitySlug}`} className="dashboard-bento-item-link">
            View details →
          </Link>
        </div>

        {showCashEstimate ? (
          <p className="dashboard-bento-item-award">
            Estimated value: £{estimatedAwardGbp.toFixed(2)}
          </p>
        ) : (
          <p className="dashboard-bento-item-award">Your award is building</p>
        )}

        {countedFaralins != null ? (
          <p className="dashboard-bento-item-meta">
            <span className="dashboard-bento-item-meta-secondary dashboard-bento-item-meta-secondary--solo">
              Based on {countedFaralins.toLocaleString()} of your Faralins
            </span>
          </p>
        ) : null}

        {!showCashEstimate ? (
          <p className="dashboard-bento-item-meta">
            <span className="dashboard-bento-item-meta-secondary dashboard-bento-item-meta-secondary--solo">
              Complete more verified activities to unlock a university value estimate.
            </span>
          </p>
        ) : null}

        <p className="dashboard-bento-item-meta">
          <span className="dashboard-bento-item-meta-primary">{statusLabel}</span>
        </p>

        <p className="dashboard-bento-item-conversion">
          Confirmed only if you enrol at {shortName} and meet its award requirements.
        </p>
      </div>
    </article>
  );
}
