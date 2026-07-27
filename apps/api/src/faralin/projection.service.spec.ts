import { describe, expect, it } from 'vitest';
import {
  calculateEstimatedAwardGbp,
  clampUniversityBoost,
  CONDITIONAL_AWARD_DISCLAIMER,
  CORE_FARALINS_PER_GBP,
} from '@faralin/types';

describe('Projection math golden case', () => {
  it('maps 30,000 Core Faralins to £225 / £300 / £420 at boosts 0.75 / 1.0 / 1.4', () => {
    const eligibleCoreFaralins = 8000 + 10000 + 12000;
    expect(eligibleCoreFaralins).toBe(30000);

    const boosts = [0.75, 1.0, 1.4];
    const expected = [225, 300, 420];

    boosts.forEach((universityBoost, index) => {
      const gbp = calculateEstimatedAwardGbp({
        eligibleCoreFaralins,
        coreFaralinsPerGbp: CORE_FARALINS_PER_GBP,
        universityBoost,
        subjectAlignmentBoost: 1,
        verificationBoost: 1,
        perStudentCapGbp: null,
      });
      expect(gbp).toBe(expected[index]);
    });
  });

  it('clamps university boost to platform bounds', () => {
    expect(clampUniversityBoost(0.1)).toBe(0.5);
    expect(clampUniversityBoost(2)).toBe(1.5);
    expect(clampUniversityBoost(1)).toBe(1);
  });

  it('applies per-student cap when set', () => {
    const gbp = calculateEstimatedAwardGbp({
      eligibleCoreFaralins: 30000,
      coreFaralinsPerGbp: 100,
      universityBoost: 1.4,
      subjectAlignmentBoost: 1,
      verificationBoost: 1,
      perStudentCapGbp: 300,
    });
    expect(gbp).toBe(300);
  });
});

describe('CONDITIONAL_AWARD_DISCLAIMER copy', () => {
  it('includes enrolment-only conversion message', () => {
    expect(CONDITIONAL_AWARD_DISCLAIMER).toContain('enrol');
    expect(CONDITIONAL_AWARD_DISCLAIMER).toContain('conditional estimate');
  });
});
