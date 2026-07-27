export const PRESTIGE_TIER_LABELS = {
  ELITE: 'Highly selective',
  PREMIER: 'Selective',
  ESTABLISHED: 'Established partner',
  ACCESSIBLE: 'Accessible partner',
} as const;

export type UniversityPrestigeTier = keyof typeof PRESTIGE_TIER_LABELS;

export const RANKING_SOURCE = 'Guardian University Guide 2025';

export interface UniversityRankingMeta {
  guardianRank2025: number;
  prestigeTier: UniversityPrestigeTier;
}

export interface TierEconomics {
  faralinsPerGbp: number;
  minVerifiedPercent: number;
  baseAmount: number;
  scoreMultiplier: number;
  improvementBonus: number;
  difficultyMultiplier: number;
  assessmentBaseMultiplier: number;
  trackScoreMultiplier: number;
}

/** Guardian University Guide 2025 ranks for seeded partner universities. */
export const UNIVERSITY_RANKINGS: Record<string, UniversityRankingMeta> = {
  oxford: { guardianRank2025: 1, prestigeTier: 'ELITE' },
  cambridge: { guardianRank2025: 3, prestigeTier: 'ELITE' },
  lse: { guardianRank2025: 4, prestigeTier: 'ELITE' },
  imperial: { guardianRank2025: 5, prestigeTier: 'ELITE' },
  durham: { guardianRank2025: 6, prestigeTier: 'PREMIER' },
  bath: { guardianRank2025: 7, prestigeTier: 'PREMIER' },
  warwick: { guardianRank2025: 8, prestigeTier: 'PREMIER' },
  ucl: { guardianRank2025: 9, prestigeTier: 'PREMIER' },
  edinburgh: { guardianRank2025: 15, prestigeTier: 'PREMIER' },
  bristol: { guardianRank2025: 16, prestigeTier: 'PREMIER' },
  exeter: { guardianRank2025: 18, prestigeTier: 'ESTABLISHED' },
  sheffield: { guardianRank2025: 20, prestigeTier: 'ESTABLISHED' },
  southampton: { guardianRank2025: 20, prestigeTier: 'ESTABLISHED' },
  'kings-college-london': { guardianRank2025: 21, prestigeTier: 'ESTABLISHED' },
  leeds: { guardianRank2025: 28, prestigeTier: 'ESTABLISHED' },
  birmingham: { guardianRank2025: 28, prestigeTier: 'ESTABLISHED' },
  nottingham: { guardianRank2025: 28, prestigeTier: 'ESTABLISHED' },
  manchester: { guardianRank2025: 35, prestigeTier: 'ESTABLISHED' },
  newcastle: { guardianRank2025: 30, prestigeTier: 'ACCESSIBLE' },
  cardiff: { guardianRank2025: 37, prestigeTier: 'ACCESSIBLE' },
};

const FARALINS_PER_GBP_BY_SLUG: Record<string, number> = {
  oxford: 200,
  cambridge: 195,
  lse: 190,
  imperial: 185,
  durham: 165,
  bath: 160,
  warwick: 155,
  ucl: 150,
  edinburgh: 140,
  bristol: 135,
  exeter: 110,
  sheffield: 105,
  southampton: 100,
  'kings-college-london': 115,
  leeds: 108,
  birmingham: 105,
  nottingham: 102,
  manchester: 120,
  newcastle: 92,
  cardiff: 90,
};

const TIER_DEFAULTS: Record<
  UniversityPrestigeTier,
  Omit<TierEconomics, 'faralinsPerGbp' | 'minVerifiedPercent'>
> = {
  ELITE: {
    baseAmount: 82,
    scoreMultiplier: 1.2,
    improvementBonus: 40,
    difficultyMultiplier: 1.3,
    assessmentBaseMultiplier: 0.65,
    trackScoreMultiplier: 0.85,
  },
  PREMIER: {
    baseAmount: 100,
    scoreMultiplier: 1.1,
    improvementBonus: 48,
    difficultyMultiplier: 1.18,
    assessmentBaseMultiplier: 0.85,
    trackScoreMultiplier: 0.95,
  },
  ESTABLISHED: {
    baseAmount: 115,
    scoreMultiplier: 1.04,
    improvementBonus: 56,
    difficultyMultiplier: 1.1,
    assessmentBaseMultiplier: 1.0,
    trackScoreMultiplier: 1.0,
  },
  ACCESSIBLE: {
    baseAmount: 130,
    scoreMultiplier: 1.0,
    improvementBonus: 68,
    difficultyMultiplier: 1.03,
    assessmentBaseMultiplier: 1.15,
    trackScoreMultiplier: 1.15,
  },
};

const MIN_VERIFIED_BY_TIER: Record<UniversityPrestigeTier, number> = {
  ELITE: 80,
  PREMIER: 73,
  ESTABLISHED: 68,
  ACCESSIBLE: 64,
};

export function getUniversityRankingMeta(slug: string): UniversityRankingMeta | null {
  return UNIVERSITY_RANKINGS[slug] ?? null;
}

export function getTierEconomics(slug: string): TierEconomics {
  const meta = getUniversityRankingMeta(slug);
  if (!meta) {
    throw new Error(`Unknown university slug for tier economics: ${slug}`);
  }

  const defaults = TIER_DEFAULTS[meta.prestigeTier];
  const faralinsPerGbp = FARALINS_PER_GBP_BY_SLUG[slug] ?? 110;

  return {
    faralinsPerGbp,
    minVerifiedPercent: MIN_VERIFIED_BY_TIER[meta.prestigeTier],
    ...defaults,
  };
}

export function buildConversionDisclaimer(shortName: string): string {
  return `Estimated ${shortName} bursary value is subject to admission, eligibility, and university terms.`;
}

export function buildAssessmentRule(rules: TierEconomics) {
  return {
    baseAmount: Math.round(rules.baseAmount * rules.assessmentBaseMultiplier),
    scoreMultiplier: rules.scoreMultiplier,
    improvementBonus: Math.round(rules.improvementBonus * rules.assessmentBaseMultiplier),
    difficultyMultiplier: rules.difficultyMultiplier,
  };
}

export function estimateTypicalAssessmentFaralins(rules: TierEconomics): { min: number; max: number } {
  const assessment = buildAssessmentRule(rules);
  const calc = (accuracy: number, improvement: number) => {
    const accuracyFactor = Math.max(0, Math.min(1, accuracy));
    const scoreComponent = assessment.baseAmount * accuracyFactor * assessment.scoreMultiplier;
    const difficultyComponent = scoreComponent * assessment.difficultyMultiplier;
    const improvementComponent =
      improvement > 0
        ? assessment.improvementBonus * Math.min(improvement / 20, 1)
        : 0;
    return Math.round(difficultyComponent + improvementComponent);
  };

  return {
    min: calc(0.65, 0),
    max: calc(0.95, 20),
  };
}
