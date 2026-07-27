import { PLATFORM_LIMITS } from './platform-config';

export type UniversityAwardAccountStatus =
  | 'PROJECTED'
  | 'ELIGIBLE'
  | 'RESERVED'
  | 'CONFIRMED'
  | 'CONVERTED'
  | 'EXPIRED'
  | 'FORFEITED';

export interface UniversityAwardAccountSummary {
  universityId: string;
  universityName: string;
  universitySlug: string;
  status: UniversityAwardAccountStatus;
  eligibleCoreFaralins: number;
  projectedAwardGbp: number;
  reservedAt: string | null;
  confirmedAt: string | null;
  convertedAt: string | null;
  forfeitedAt: string | null;
}

export const UNIVERSITY_AWARD_ACCOUNT_STATUS_LABELS: Record<
  UniversityAwardAccountStatus,
  string
> = {
  PROJECTED: 'Projected estimate',
  ELIGIBLE: 'Eligible',
  RESERVED: 'Reserved (offer stage)',
  CONFIRMED: 'Confirmed',
  CONVERTED: 'Converted award',
  EXPIRED: 'Expired',
  FORFEITED: 'Forfeited',
};

/** Pipeline statuses that count toward the Faralin-active university cap. */
export const FARALIN_ACTIVE_APPLICATION_STATUSES = [
  'FARALIN_ACTIVE',
  'REFERRAL_CLICKED',
  'APPLIED',
  'OFFER_RECEIVED',
  'OFFER_ACCEPTED',
  'FIRM',
  'INSURANCE',
  'ENROLLED',
] as const;

/** Offer-stage statuses (firm / insurance / accepted offer). Max 2. */
export const OFFER_STAGE_APPLICATION_STATUSES = [
  'FIRM',
  'INSURANCE',
  'OFFER_ACCEPTED',
] as const;

/** Terminal statuses that no longer occupy funnel slots. */
export const TERMINAL_APPLICATION_STATUSES = [
  'WITHDRAWN',
  'REJECTED',
] as const;

export const AWARD_ACCOUNT_ACTIVE_STATUSES: UniversityAwardAccountStatus[] = [
  'PROJECTED',
  'ELIGIBLE',
  'RESERVED',
  'CONFIRMED',
];

export function isFaralinActiveApplicationStatus(status: string): boolean {
  return (FARALIN_ACTIVE_APPLICATION_STATUSES as readonly string[]).includes(status);
}

export function isOfferStageApplicationStatus(status: string): boolean {
  return (OFFER_STAGE_APPLICATION_STATUSES as readonly string[]).includes(status);
}

export function awardStatusForApplicationStatus(
  applicationStatus: string,
): UniversityAwardAccountStatus | null {
  switch (applicationStatus) {
    case 'FOLLOWER':
      return 'PROJECTED';
    case 'FARALIN_ACTIVE':
    case 'REFERRAL_CLICKED':
    case 'APPLIED':
    case 'OFFER_RECEIVED':
      return 'ELIGIBLE';
    case 'OFFER_ACCEPTED':
    case 'FIRM':
    case 'INSURANCE':
      return 'RESERVED';
    case 'ENROLLED':
      return 'CONVERTED';
    case 'WITHDRAWN':
    case 'REJECTED':
      return 'EXPIRED';
    default:
      return null;
  }
}

export { PLATFORM_LIMITS };
