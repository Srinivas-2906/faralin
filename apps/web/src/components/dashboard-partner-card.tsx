import Link from 'next/link';
import { MediaImage } from '@faralin/ui';
import { getUniversityImage } from '@/lib/media';

export interface DashboardPartnerUniversity {
  universitySlug: string;
  universityName: string;
  eligibleCoreFaralins?: number;
  totalFaralins?: number;
  verifiedFaralins?: number;
  hearEligibleFaralins?: number;
  recognitionTierLabel?: string;
  recognitionProgressPercent?: number;
  estimatedAwardGbp: number;
  awardStatus?: string;
  awardStatusLabel?: string;
}

type DashboardPartnerCardProps = {
  university: DashboardPartnerUniversity;
};

export function DashboardPartnerCard({ university }: DashboardPartnerCardProps) {
  const {
    universitySlug,
    universityName,
    eligibleCoreFaralins,
    totalFaralins,
    hearEligibleFaralins,
    recognitionTierLabel,
    recognitionProgressPercent,
    estimatedAwardGbp,
    awardStatusLabel,
  } = university;

  const coreDisplay =
    eligibleCoreFaralins != null
      ? `${eligibleCoreFaralins.toLocaleString()} Core Faralins eligible`
      : totalFaralins != null
        ? `${totalFaralins.toLocaleString()} Faralins (legacy)`
        : null;

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
            View →
          </Link>
        </div>
        {awardStatusLabel ? (
          <p className="dashboard-bento-item-meta">
            <span className="dashboard-bento-item-meta-primary">{awardStatusLabel}</span>
          </p>
        ) : null}
        <p className="dashboard-bento-item-meta">
          {coreDisplay ? (
            <span className="dashboard-bento-item-meta-primary">{coreDisplay}</span>
          ) : null}
          <span className="dashboard-bento-item-meta-secondary">
            Est. conditional award £{estimatedAwardGbp.toFixed(2)}
          </span>
        </p>
        {recognitionTierLabel ? (
          <p className="dashboard-bento-item-meta">
            <span className="dashboard-bento-item-meta-primary">
              {recognitionTierLabel} recognition
            </span>
            {recognitionProgressPercent != null && recognitionProgressPercent < 100 ? (
              <span className="dashboard-bento-item-meta-secondary">
                {recognitionProgressPercent}% to next level
              </span>
            ) : null}
          </p>
        ) : null}
        {hearEligibleFaralins != null ? (
          <p className="dashboard-bento-item-conversion">
            {hearEligibleFaralins.toLocaleString()} HEAR-eligible verified Faralins
          </p>
        ) : null}
      </div>
    </article>
  );
}
