import { describe, expect, it } from 'vitest';
import {
  calculateAssessmentCoreFaralins,
  calculateTrackCoreFaralins,
  improvementBonusFromDelta,
  qualityMultiplierFromAccuracy,
} from './core-faralin-calculator';
import { FaralinTrustLevel } from '@faralin/db';

describe('CoreFaralinCalculator', () => {
  it('computes assessment core faralins with quality and trust multipliers', () => {
    const { coreFaralins, improvementBonus } = calculateAssessmentCoreFaralins({
      difficulty: 'STANDARD',
      accuracyPercent: 85,
      improvementDelta: 10,
      trustLevel: FaralinTrustLevel.VERIFIED,
    });

    expect(improvementBonus).toBeGreaterThan(0);
    expect(coreFaralins).toBeGreaterThan(200);
  });

  it('caps quality multiplier between 0.5 and 1.2', () => {
    expect(qualityMultiplierFromAccuracy(0)).toBe(0.5);
    expect(qualityMultiplierFromAccuracy(100)).toBeCloseTo(1.2, 5);
  });

  it('caps improvement bonus', () => {
    expect(improvementBonusFromDelta(100)).toBeLessThanOrEqual(68);
  });

  it('computes track core faralins from rubric score', () => {
    const core = calculateTrackCoreFaralins({
      difficultyBand: 'SCHOLAR',
      rubricScorePercent: 90,
      trustLevel: FaralinTrustLevel.VERIFIED,
    });
    expect(core).toBeGreaterThan(1000);
  });
});
