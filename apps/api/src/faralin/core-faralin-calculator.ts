import {
  ASSESSMENT_BASE_CORE_FARALINS,
  DIFFICULTY_MULTIPLIERS,
  IMPROVEMENT_BONUS_CAP,
  IMPROVEMENT_DELTA_DIVISOR,
  TRACK_BASE_CORE_FARALINS,
  TRUST_MULTIPLIERS,
} from '@faralin/types';
import type { AssessmentDifficulty } from '@faralin/types';
import { FaralinTrustLevel } from '@faralin/db';

export interface AssessmentCoreInput {
  difficulty: AssessmentDifficulty;
  accuracyPercent: number;
  improvementDelta: number;
  trustLevel: FaralinTrustLevel;
}

export interface TrackCoreInput {
  difficultyBand: string;
  rubricScorePercent: number;
  trustLevel: FaralinTrustLevel;
}

export function qualityMultiplierFromAccuracy(accuracyPercent: number): number {
  const accuracyFactor = Math.max(0, Math.min(1, accuracyPercent / 100));
  return Math.max(0.5, Math.min(1.2, 0.5 + 0.7 * accuracyFactor));
}

export function improvementBonusFromDelta(improvementDelta: number): number {
  if (improvementDelta <= 0) return 0;
  return Math.round(
    IMPROVEMENT_BONUS_CAP * Math.min(improvementDelta / IMPROVEMENT_DELTA_DIVISOR, 1),
  );
}

export function trustMultiplier(trustLevel: FaralinTrustLevel | string): number {
  const key = trustLevel as keyof typeof TRUST_MULTIPLIERS;
  return TRUST_MULTIPLIERS[key] ?? TRUST_MULTIPLIERS.VERIFIED;
}

export function difficultyMultiplierForAssessment(difficulty: AssessmentDifficulty): number {
  return DIFFICULTY_MULTIPLIERS[difficulty] ?? 1;
}

export function difficultyMultiplierForTrack(difficultyBand: string): number {
  const key = difficultyBand as keyof typeof DIFFICULTY_MULTIPLIERS;
  return DIFFICULTY_MULTIPLIERS[key] ?? DIFFICULTY_MULTIPLIERS.CORE;
}

export function calculateAssessmentCoreFaralins(input: AssessmentCoreInput): {
  coreFaralins: number;
  improvementBonus: number;
} {
  const base = ASSESSMENT_BASE_CORE_FARALINS[input.difficulty] ?? ASSESSMENT_BASE_CORE_FARALINS.STANDARD;
  const quality = qualityMultiplierFromAccuracy(input.accuracyPercent);
  const difficulty = difficultyMultiplierForAssessment(input.difficulty);
  const trust = trustMultiplier(input.trustLevel);
  const improvementBonus = improvementBonusFromDelta(input.improvementDelta);
  const coreFaralins =
    Math.round(base * quality * difficulty * trust) + improvementBonus;

  return { coreFaralins: Math.max(0, coreFaralins), improvementBonus };
}

export function calculateTrackCoreFaralins(input: TrackCoreInput): number {
  const base =
    TRACK_BASE_CORE_FARALINS[input.difficultyBand] ?? TRACK_BASE_CORE_FARALINS.CORE;
  const quality = qualityMultiplierFromAccuracy(input.rubricScorePercent);
  const difficulty = difficultyMultiplierForTrack(input.difficultyBand);
  const trust = trustMultiplier(input.trustLevel);
  return Math.max(0, Math.round(base * quality * difficulty * trust));
}

export function achievementIdempotencyKey(
  activityType: string,
  parts: Record<string, string | number | undefined>,
): string {
  const segment = Object.entries(parts)
    .filter(([, v]) => v != null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
  return `${activityType}|${segment}`;
}
