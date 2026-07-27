/** Global conversion: 100 Core Faralins = £1 base estimated recognition value. */
export const CORE_FARALINS_PER_GBP = 100;

/** Hide cash estimates below this amount on student-facing cards. */
export const MIN_DISPLAY_AWARD_GBP = 1;

export const PLATFORM_LIMITS = {
  maxFollowedUniversities: 10,
  maxFaralinActiveUniversities: 5,
  maxOfferStageUniversities: 2,
  maxConvertedAwards: 1,
} as const;

/** Default recognition thresholds used for overall student progress (not per-university). */
export const DEFAULT_RECOGNITION_TIER_THRESHOLDS = [
  { tier: 'EXPLORER' as const, minVerifiedFaralins: 0, benefitsSummary: 'Starting your recognition journey' },
  { tier: 'BUILDER' as const, minVerifiedFaralins: 500, benefitsSummary: 'Consistent verified activity' },
  { tier: 'ACHIEVER' as const, minVerifiedFaralins: 1500, benefitsSummary: 'Strong portfolio of verified work' },
  { tier: 'CHAMPION' as const, minVerifiedFaralins: 3000, benefitsSummary: 'Outstanding verified recognition' },
];

export const CONDITIONAL_AWARD_DISCLAIMER =
  'This is a conditional estimate, not cash or an admission offer. Final eligibility depends on the university’s published rules and verified enrolment. Only the university where you enrol can confirm and convert an award.';

export const CORE_FARALINS_EXPLAINER =
  'Faralins are your portable achievement record. You earn them once; universities may estimate different values from the same balance.';

export const UNIVERSITY_VALUE_EXPLAINER =
  'You earn Faralins once. Each university may value them differently, but only the university where you enrol can confirm and convert your award.';
