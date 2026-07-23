import {
  RECOGNITION_TIER_ORDER,
  type StudentRecognitionTier,
} from '@faralin/types';

export interface RecognitionTierRow {
  tier: StudentRecognitionTier;
  minVerifiedFaralins: number;
  benefitsSummary: string | null;
}

export function computeRecognitionTier(
  verifiedFaralins: number,
  configs: RecognitionTierRow[],
): {
  currentTier: StudentRecognitionTier;
  currentLabel: string;
  nextTier: StudentRecognitionTier | null;
  nextThreshold: number | null;
  progressPercent: number;
} {
  const sorted = [...configs].sort((a, b) => a.minVerifiedFaralins - b.minVerifiedFaralins);
  if (sorted.length === 0) {
    return {
      currentTier: 'EXPLORER',
      currentLabel: 'Explorer',
      nextTier: 'BUILDER',
      nextThreshold: 500,
      progressPercent: Math.min(100, Math.round((verifiedFaralins / 500) * 100)),
    };
  }

  let current = sorted[0];
  for (const row of sorted) {
    if (verifiedFaralins >= row.minVerifiedFaralins) current = row;
  }

  const currentIndex = RECOGNITION_TIER_ORDER.indexOf(current.tier);
  const nextTier = RECOGNITION_TIER_ORDER[currentIndex + 1] ?? null;
  const nextConfig = nextTier ? sorted.find((r) => r.tier === nextTier) : null;
  const nextThreshold = nextConfig?.minVerifiedFaralins ?? null;

  let progressPercent = 100;
  if (nextThreshold != null) {
    const span = nextThreshold - current.minVerifiedFaralins;
    progressPercent =
      span > 0
        ? Math.min(100, Math.round(((verifiedFaralins - current.minVerifiedFaralins) / span) * 100))
        : 100;
  }

  return {
    currentTier: current.tier,
    currentLabel: current.tier.charAt(0) + current.tier.slice(1).toLowerCase(),
    nextTier,
    nextThreshold,
    progressPercent,
  };
}
