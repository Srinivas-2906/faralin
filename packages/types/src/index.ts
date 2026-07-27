export const TRUST_LEVEL_LABELS = {
  PRACTICE: 'Practice recognition',
  VERIFIED: 'Verified recognition',
  PARTNER_VERIFIED: 'Partner-verified recognition',
} as const;

export const APPLICATION_STATUS_LABELS = {
  FOLLOWER: 'Following',
  REFERRAL_CLICKED: 'Application link opened',
  APPLIED: 'Applied',
  OFFER_RECEIVED: 'Offer received',
  OFFER_ACCEPTED: 'Offer accepted',
  ENROLLED: 'Enrolled',
  WITHDRAWN: 'Withdrawn',
  REJECTED: 'Not successful',
} as const;

export const DIFFICULTY_LABELS = {
  FOUNDATION: 'Foundation',
  STANDARD: 'Standard',
  ADVANCED: 'Advanced',
} as const;

export const TRACK_DIFFICULTY_LABELS = {
  FOUNDATION: 'Foundation Track',
  CORE: 'Core Track',
  ADVANCED: 'Advanced Track',
  SCHOLAR: 'Scholar Track',
  FELLOWSHIP: 'Fellowship Track',
} as const;

export const PROBLEM_SECTION_TYPE_LABELS = {
  ORIENTATION: 'Orientation',
  STORY: 'Story',
  CORE_QUESTION: 'Core question',
  LEARN: 'Learn',
  PRACTICE: 'Practice',
  SOLVE: 'Solve',
  PERSONALISE: 'Personal application',
  REFLECT: 'Reflection',
  FINAL_BUILDER: 'Final builder',
  REVIEW: 'Review',
  SUBMIT: 'Submit',
} as const;

export const SUBMISSION_TRUST_LABELS = {
  HIGH: 'High trust',
  MEDIUM: 'Medium trust',
  LOW: 'Low trust',
} as const;

export type ProblemSectionType =
  | 'ORIENTATION'
  | 'STORY'
  | 'CORE_QUESTION'
  | 'LEARN'
  | 'PRACTICE'
  | 'SOLVE'
  | 'PERSONALISE'
  | 'REFLECT'
  | 'FINAL_BUILDER'
  | 'REVIEW'
  | 'SUBMIT';

export type InputFieldType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'table'
  | 'equation'
  | 'diagram'
  | 'upload'
  | 'multiple_choice'
  | 'code';

export interface ProblemTrackInputField {
  id: string;
  label: string;
  type: InputFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validationRules?: Record<string, unknown>;
}

export interface ProblemTrackSection {
  id: string;
  type: ProblemSectionType;
  title: string;
  content: string;
  inputs: ProblemTrackInputField[];
  aiPolicy: {
    allowed: string[];
    forbidden: string[];
  };
  unlockRules?: { requiresSectionId?: string }[];
  sectionRewardFaralins?: number;
}

export interface RubricCategory {
  name: string;
  weight: number;
  descriptors: {
    excellent: string;
    strong: string;
    developing: string;
    weak: string;
  };
}

export interface AwardBand {
  minScore: number;
  percentOfMax: number;
  label: string;
}

export type {
  AchievementActivityType,
  AchievementVerificationStatus,
  AssessmentDifficulty,
  UniversityProjectionStatus,
  UniversityProjectionSummary,
} from './achievement-types';

export type {
  UniversityAwardAccountStatus,
  UniversityAwardAccountSummary,
} from './award-account';
export {
  AWARD_ACCOUNT_ACTIVE_STATUSES,
  FARALIN_ACTIVE_APPLICATION_STATUSES,
  OFFER_STAGE_APPLICATION_STATUSES,
  TERMINAL_APPLICATION_STATUSES,
  UNIVERSITY_AWARD_ACCOUNT_STATUS_LABELS,
  awardStatusForApplicationStatus,
  isFaralinActiveApplicationStatus,
  isOfferStageApplicationStatus,
} from './award-account';

import type { UniversityProjectionSummary } from './achievement-types';
import type { UniversityAwardAccountSummary } from './award-account';

export interface PortfolioSummary {
  /** Portable achievement total (Layer 1 ledger). */
  coreFaralins: number;
  coreFaralinsThisMonth: number;
  /** Conditional university estimates (Layer 2 projections). */
  projections: UniversityProjectionSummary[];
  /** Layer 3 award account lifecycle per university. */
  awardAccounts: UniversityAwardAccountSummary[];
  /** @deprecated Use coreFaralins during migration. Legacy per-uni transaction sum. */
  totalFaralins: number;
  faralinsThisMonth: number;
  assessmentsCompleted: number;
  tracksCompleted: number;
  /** @deprecated Sum of projection estimates; use projections[] instead. */
  estimatedBursaryGbp: number;
  /** @deprecated Legacy per-university transaction balances during dual-write. */
  byUniversity: UniversityBalance[];
}

export interface PortfolioArtifactSummary {
  id: string;
  title: string;
  slug: string;
  subjectName: string;
  difficultyBand: string;
  rubricScore: number;
  faralinsEarned: number;
  skillsDemonstrated: string[];
  trustLevel: string;
  moderationStatus: string;
  completedAt: string;
}

export const ARTICLE_TYPE_LABELS = {
  NEWS: 'News',
  BLOG: 'Blog',
  SCHOLARSHIP: 'Scholarship',
  ADVICE: 'Advice',
  STUDENT_STORY: 'Student story',
  COURSE_GUIDE: 'Course guide',
  CHALLENGE_BRIEF: 'Challenge brief',
} as const;

export const COURSE_LEVEL_LABELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
} as const;

export const EVENT_TYPE_LABELS = {
  WEBINAR: 'Webinar',
  OPEN_DAY: 'Open day',
  TASTER: 'Taster session',
  CHALLENGE: 'Challenge',
} as const;

export {
  calculateEstimatedAwardGbp,
  clampUniversityBoost,
  deriveUniversityBoost,
  legacyVerifiedFaralinsToGbp,
  sumEligibleCoreFaralins,
} from './projection-math';
export type {
  AchievementForProjection,
  ProjectionCalculationInput,
} from './projection-math';

export {
  ASSESSMENT_BASE_CORE_FARALINS,
  DIFFICULTY_MULTIPLIERS,
  IMPROVEMENT_BONUS_CAP,
  IMPROVEMENT_DELTA_DIVISOR,
  PROJECTION_BOOST_BOUNDS,
  TRACK_BASE_CORE_FARALINS,
  TRUST_MULTIPLIERS,
} from './achievement-values';
export {
  CONDITIONAL_AWARD_DISCLAIMER,
  CORE_FARALINS_EXPLAINER,
  CORE_FARALINS_PER_GBP,
  PLATFORM_LIMITS,
} from './platform-config';
import { PLATFORM_LIMITS } from './platform-config';

/** @deprecated Use PLATFORM_LIMITS.maxFollowedUniversities */
export const MAX_UNIVERSITY_SELECTIONS = PLATFORM_LIMITS.maxFollowedUniversities;

export {
  buildAssessmentRule,
  buildConversionDisclaimer,
  estimateTypicalAssessmentFaralins,
  getTierEconomics,
  getUniversityRankingMeta,
  PRESTIGE_TIER_LABELS,
  RANKING_SOURCE,
  UNIVERSITY_RANKINGS,
} from './university-tiers';
export type { TierEconomics, UniversityPrestigeTier, UniversityRankingMeta } from './university-tiers';

export interface UniversityBalance {
  universityId: string;
  universityName: string;
  universitySlug: string;
  totalFaralins: number;
  verifiedFaralins: number;
  estimatedBursaryGbp: number;
  faralinsPerGbp: number | null;
  disclaimer: string;
}

export interface AnonymousStudentView {
  anonymousId: string;
  revealLevel: string;
  subjectSlugs: string[];
  assessmentsCompleted: number;
  totalFaralins: number;
  performanceBand: 'developing' | 'steady' | 'strong' | 'exceptional';
}

export interface UniversityFunnelStats {
  followers: number;
  referralClicked: number;
  applied: number;
  offerReceived: number;
  offerAccepted: number;
  enrolled: number;
}

export const TICKET_STATUS_LABELS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  WAITING: 'Waiting',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
} as const;

export const TICKET_PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
} as const;

export const TICKET_CHANNEL_LABELS = {
  EMAIL: 'Email',
  PHONE: 'Phone',
  CHAT: 'Chat',
  INTERNAL: 'Internal',
  OTHER: 'Other',
} as const;

export const SUPPORT_CONVERSATION_PHASE_LABELS = {
  BOT: 'Bot assist',
  WAITING_AGENT: 'Waiting for agent',
  AGENT: 'Live with agent',
  RESOLVED: 'Resolved',
} as const;

export const SUPPORT_REQUESTER_TYPE_LABELS = {
  STUDENT: 'Student',
  UNIVERSITY_STAFF: 'University staff',
  INTERNAL: 'Internal',
} as const;

export * from './assessment-access';
