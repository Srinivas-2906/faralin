import Link from 'next/link';
import { MediaImage } from '@faralin/ui';
import { getUniversityImage } from '@/lib/media';

export interface DashboardPartnerUniversity {
  universitySlug: string;
  universityName: string;
  totalFaralins: number;
  estimatedBursaryGbp: number;
}

type DashboardPartnerCardProps = {
  university: DashboardPartnerUniversity;
};

export function DashboardPartnerCard({ university }: DashboardPartnerCardProps) {
  const { universitySlug, universityName, totalFaralins, estimatedBursaryGbp } = university;

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
        <p className="dashboard-bento-item-meta">
          <span className="dashboard-bento-item-meta-primary">
            {totalFaralins.toLocaleString()} Faralins
          </span>
          <span className="dashboard-bento-item-meta-secondary">
            £{estimatedBursaryGbp.toFixed(2)} est.
          </span>
        </p>
      </div>
    </article>
  );
}
