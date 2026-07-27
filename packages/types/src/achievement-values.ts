import type { AssessmentDifficulty } from './achievement-types';

export const ASSESSMENT_BASE_CORE_FARALINS: Record<AssessmentDifficulty, number> = {
  FOUNDATION: 100,
  STANDARD: 200,
  ADVANCED: 350,
};

export const TRACK_BASE_CORE_FARALINS: Record<string, number> = {
  FOUNDATION: 500,
  CORE: 900,
  ADVANCED: 900,
  SCHOLAR: 1500,
  FELLOWSHIP: 1500,
};

export const TRUST_MULTIPLIERS = {
  PRACTICE: 0.5,
  VERIFIED: 1.0,
  PARTNER_VERIFIED: 1.25,
} as const;

export const DIFFICULTY_MULTIPLIERS = {
  FOUNDATION: 1.0,
  STANDARD: 1.1,
  ADVANCED: 1.3,
  CORE: 1.1,
  SCHOLAR: 1.4,
  FELLOWSHIP: 1.5,
} as const;

export const IMPROVEMENT_BONUS_CAP = 68;
export const IMPROVEMENT_DELTA_DIVISOR = 20;

export const PROJECTION_BOOST_BOUNDS = {
  universityMin: 0.5,
  universityMax: 1.5,
  subjectMin: 1.0,
  subjectMax: 1.25,
  verificationMin: 1.0,
  verificationMax: 1.2,
} as const;
