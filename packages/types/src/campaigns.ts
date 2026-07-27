import { PROJECTION_BOOST_BOUNDS } from './achievement-values';
import { clampUniversityBoost } from './projection-math';

export type CampaignDeliveryType = 'BURSARY' | 'FEE_WAIVER' | 'SCHOLARSHIP' | 'OTHER';

export type UkJurisdiction = 'ENGLAND' | 'SCOTLAND' | 'WALES' | 'NORTHERN_IRELAND';

export type ConsentScope =
  | 'ANONYMOUS_ANALYTICS'
  | 'ANONYMOUS_SKILL_PROFILE'
  | 'SHARED_PORTFOLIO'
  | 'APPLICATION_EVIDENCE'
  | 'OFFER_VERIFICATION'
  | 'ENROLMENT_RECONCILIATION';

export const CONSENT_SCOPE_LABELS: Record<ConsentScope, string> = {
  ANONYMOUS_ANALYTICS: 'Anonymous analytics',
  ANONYMOUS_SKILL_PROFILE: 'Anonymous skill profile',
  SHARED_PORTFOLIO: 'Shared portfolio',
  APPLICATION_EVIDENCE: 'Application evidence',
  OFFER_VERIFICATION: 'Offer verification',
  ENROLMENT_RECONCILIATION: 'Enrolment reconciliation',
};

export const CAMPAIGN_DELIVERY_TYPE_LABELS: Record<CampaignDeliveryType, string> = {
  BURSARY: 'Bursary',
  FEE_WAIVER: 'Fee waiver',
  SCHOLARSHIP: 'Scholarship',
  OTHER: 'Other',
};

export interface UniversityCampaignSummary {
  id: string;
  universityId: string;
  name: string;
  slug: string;
  isActive: boolean;
  budgetGbp: number;
  perStudentCapGbp: number | null;
  spentGbp: number;
  universityBoost: number;
  subjectAlignmentBoost: number;
  subjectFilters: string[] | null;
  startsAt: string;
  endsAt: string;
  deliveryType: CampaignDeliveryType;
}

export interface CreateCampaignInput {
  name: string;
  slug: string;
  budgetGbp: number;
  perStudentCapGbp?: number | null;
  universityBoost: number;
  subjectAlignmentBoost?: number;
  subjectFilters?: string[] | null;
  startsAt: string;
  endsAt: string;
  deliveryType?: CampaignDeliveryType;
  isActive?: boolean;
}

export function validateCampaignBoosts(
  universityBoost: number,
  subjectAlignmentBoost: number = 1,
): { universityBoost: number; subjectAlignmentBoost: number } {
  return {
    universityBoost: clampUniversityBoost(universityBoost),
    subjectAlignmentBoost: Math.min(
      PROJECTION_BOOST_BOUNDS.universityMax,
      Math.max(PROJECTION_BOOST_BOUNDS.universityMin, subjectAlignmentBoost),
    ),
  };
}

export function isCampaignActiveNow(
  campaign: { isActive: boolean; startsAt: Date | string; endsAt: Date | string },
  now: Date = new Date(),
): boolean {
  if (!campaign.isActive) return false;
  const startsAt = new Date(campaign.startsAt);
  const endsAt = new Date(campaign.endsAt);
  return startsAt <= now && endsAt >= now;
}
