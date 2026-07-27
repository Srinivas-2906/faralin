import { CORE_FARALINS_PER_GBP } from './platform-config';
import { PROJECTION_BOOST_BOUNDS } from './achievement-values';
import { getTierEconomics } from './university-tiers';

export interface ProjectionCalculationInput {
  eligibleCoreFaralins: number;
  coreFaralinsPerGbp?: number;
  universityBoost: number;
  subjectAlignmentBoost?: number;
  verificationBoost?: number;
  perStudentCapGbp?: number | null;
}

export interface AchievementForProjection {
  coreFaralins: number;
  activityType: string;
  assessmentAttemptId?: string | null;
  problemTrackAttemptId?: string | null;
  assessmentId?: string | null;
  problemTrackId?: string | null;
}

export function clampUniversityBoost(value: number): number {
  return Math.min(
    PROJECTION_BOOST_BOUNDS.universityMax,
    Math.max(PROJECTION_BOOST_BOUNDS.universityMin, value),
  );
}

export function deriveUniversityBoost(
  universitySlug: string,
  faralinsPerGbp: number | null,
  coreFaralinsPerGbp: number = CORE_FARALINS_PER_GBP,
): number {
  if (faralinsPerGbp && faralinsPerGbp > 0) {
    try {
      const tier = getTierEconomics(universitySlug);
      const raw =
        (coreFaralinsPerGbp / faralinsPerGbp) * (tier.assessmentBaseMultiplier / 0.85);
      return clampUniversityBoost(raw);
    } catch {
      return clampUniversityBoost(coreFaralinsPerGbp / faralinsPerGbp);
    }
  }
  return 1;
}

export function calculateEstimatedAwardGbp(input: ProjectionCalculationInput): number {
  const coreFaralinsPerGbp = input.coreFaralinsPerGbp ?? CORE_FARALINS_PER_GBP;
  const subjectAlignmentBoost = input.subjectAlignmentBoost ?? 1;
  const verificationBoost = input.verificationBoost ?? 1;
  const baseGbp = input.eligibleCoreFaralins / coreFaralinsPerGbp;
  const boosted =
    baseGbp * input.universityBoost * subjectAlignmentBoost * verificationBoost;
  const capped =
    input.perStudentCapGbp != null
      ? Math.min(boosted, input.perStudentCapGbp)
      : boosted;
  return Math.round(capped * 100) / 100;
}

export function sumEligibleCoreFaralins(
  achievements: AchievementForProjection[],
  enabledAssessmentIds: Set<string>,
  enabledTrackIds: Set<string>,
): number {
  let eligibleCoreFaralins = 0;
  for (const event of achievements) {
    if (event.assessmentAttemptId || event.assessmentId) {
      const assessmentId = event.assessmentId;
      // Count when assessment is enabled for this uni, or when configs are empty
      // (migration / demo unis with no enable list yet).
      if (
        !assessmentId ||
        enabledAssessmentIds.size === 0 ||
        enabledAssessmentIds.has(assessmentId)
      ) {
        eligibleCoreFaralins += event.coreFaralins;
      }
    } else if (event.problemTrackAttemptId || event.problemTrackId) {
      const trackId = event.problemTrackId;
      if (!trackId || enabledTrackIds.size === 0 || enabledTrackIds.has(trackId)) {
        eligibleCoreFaralins += event.coreFaralins;
      }
    } else if (event.activityType === 'JOURNEY_MILESTONE') {
      eligibleCoreFaralins += event.coreFaralins;
    }
  }
  return eligibleCoreFaralins;
}

export function legacyVerifiedFaralinsToGbp(
  verifiedFaralins: number,
  faralinsPerGbp: number,
): number {
  if (faralinsPerGbp <= 0) return 0;
  return Math.round((verifiedFaralins / faralinsPerGbp) * 100) / 100;
}
