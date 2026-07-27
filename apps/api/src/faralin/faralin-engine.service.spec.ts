import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { isDualWriteLegacyEnabled } from './achievement-ledger.service';
import {
  FaralinEngineService,
  SECTION_MILESTONE_REASON_PREFIX,
  isSectionMilestoneReason,
  trackCompletionReason,
} from './faralin-engine.service';

function buildEngine(prisma: Record<string, unknown>) {
  return new FaralinEngineService(prisma as never);
}

describe('faralin helpers', () => {
  it('identifies section milestone reasons', () => {
    expect(isSectionMilestoneReason(`${SECTION_MILESTONE_REASON_PREFIX}abc`)).toBe(true);
    expect(isSectionMilestoneReason('Recognition from Track')).toBe(false);
    expect(isSectionMilestoneReason(null)).toBe(false);
  });

  it('builds track completion reason', () => {
    expect(trackCompletionReason('Climate Essay')).toBe('Recognition from Climate Essay');
  });
});

describe('FaralinEngineService.applyBonusRules', () => {
  const engine = buildEngine({});

  it('applies score above, perfect score, and first attempt bonuses', () => {
    const rules = [
      { type: 'SCORE_ABOVE' as const, threshold: 80, amount: 10 },
      { type: 'PERFECT_SCORE' as const, amount: 25 },
      { type: 'FIRST_ATTEMPT' as const, amount: 5 },
    ];
    expect(engine.applyBonusRules(rules, { accuracyPercent: 100, isFirstAttempt: true })).toBe(40);
    expect(engine.applyBonusRules(rules, { accuracyPercent: 70, isFirstAttempt: false })).toBe(0);
    expect(engine.applyBonusRules(rules, { accuracyPercent: 85, isFirstAttempt: true })).toBe(15);
  });
});

describe('FaralinEngineService.processTrackAttemptCompletion', () => {
  let createMock: ReturnType<typeof vi.fn>;
  let countMock: ReturnType<typeof vi.fn>;
  let engine: FaralinEngineService;

  const attempt = {
    id: 'attempt-1',
    isVoided: false,
    completedAt: new Date(),
    status: 'SCORED',
    faralinsEarned: 100,
    rubricScore: 85,
    problemTrackId: 'track-1',
    studentProfileId: 'student-1',
    problemTrack: {
      title: 'Research Track',
      subjectId: 'subject-1',
      trustLevel: 'VERIFIED',
    },
    studentProfile: {
      universitySelections: [{ universityId: 'uni-1' }],
    },
  };

  beforeEach(() => {
    createMock = vi.fn().mockResolvedValue({});
    countMock = vi.fn();

    const prisma = {
      problemTrackAttempt: {
        findUnique: vi.fn().mockResolvedValue(attempt),
        count: vi.fn().mockResolvedValue(0),
      },
      faralinTransaction: {
        count: countMock,
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 50 } }),
        create: createMock,
      },
      universityProblemTrackConfig: {
        findUnique: vi.fn().mockResolvedValue({ enabled: true, bonusRules: [] }),
      },
      faralinRule: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      studentProfile: {
        findUnique: vi.fn().mockResolvedValue({ userId: 'user-1' }),
      },
      university: {
        findUnique: vi.fn().mockResolvedValue({ shortName: 'Oxford' }),
      },
      notification: {
        create: vi.fn().mockResolvedValue({}),
      },
    };

    engine = buildEngine(prisma);
  });

  it('skips when a non-section transaction already exists', async () => {
    countMock.mockResolvedValueOnce(1);
    await engine.processTrackAttemptCompletion('attempt-1');
    expect(createMock).not.toHaveBeenCalled();
    expect(countMock).toHaveBeenCalledWith({
      where: {
        problemTrackAttemptId: 'attempt-1',
        NOT: { reason: { startsWith: SECTION_MILESTONE_REASON_PREFIX } },
      },
    });
  });

  it('creates track completion reward when only section milestones exist', async () => {
    countMock.mockResolvedValueOnce(0);
    await engine.processTrackAttemptCompletion('attempt-1');
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock.mock.calls[0][0].data.amount).toBe(100);
    expect(createMock.mock.calls[0][0].data.reason).toBe('Recognition from Research Track');
    expect(createMock.mock.calls[0][0].data.balanceAfter).toBe(150);
  });

  it('adds track bonus rules to completion payout', async () => {
    countMock.mockResolvedValueOnce(0);
    const prisma = (engine as unknown as { prisma: Record<string, unknown> }).prisma as {
      universityProblemTrackConfig: { findUnique: ReturnType<typeof vi.fn> };
    };
    prisma.universityProblemTrackConfig.findUnique.mockResolvedValue({
      enabled: true,
      bonusRules: [{ type: 'SCORE_ABOVE', threshold: 80, amount: 20 }],
    });
    await engine.processTrackAttemptCompletion('attempt-1');
    expect(createMock.mock.calls[0][0].data.amount).toBe(120);
  });
});

describe('FaralinEngineService.processSectionMilestone', () => {
  it('records balanceAfter on section milestone transactions', async () => {
    const createMock = vi.fn().mockResolvedValue({});
    const prisma = {
      problemTrackAttempt: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          isVoided: false,
          problemTrackId: 'track-1',
          studentProfileId: 'student-1',
          problemTrack: { trustLevel: 'VERIFIED' },
          studentProfile: {
            universitySelections: [{ universityId: 'uni-1' }],
          },
        }),
      },
      faralinTransaction: {
        count: vi.fn().mockResolvedValue(0),
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 30 } }),
        create: createMock,
      },
      universityProblemTrackConfig: {
        findUnique: vi.fn().mockResolvedValue({ enabled: true }),
      },
    };

    const engine = buildEngine(prisma);
    await engine.processSectionMilestone('attempt-1', 'section-a', 15);

    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: 15,
        balanceAfter: 45,
        reason: `${SECTION_MILESTONE_REASON_PREFIX}section-a`,
      }),
    });
  });
});

describe('FaralinEngineService.processJourneyMilestoneBonus', () => {
  it('awards bonusFaralins once per journey milestone', async () => {
    const createMock = vi.fn().mockResolvedValue({});
    const countMock = vi.fn().mockResolvedValue(0);
    const prisma = {
      studentUniversitySelection: {
        findMany: vi.fn().mockResolvedValue([{ universityId: 'uni-1' }]),
      },
      universityProblemTrackJourneyConfig: {
        findMany: vi.fn().mockResolvedValue([
          {
            universityId: 'uni-1',
            journeyId: 'journey-1',
            journey: {
              id: 'journey-1',
              slug: 'research-path',
              milestones: [
                {
                  trackSlug: 'climate-essay',
                  sortOrder: 1,
                  label: 'Climate Essay',
                  bonusFaralins: 25,
                  badgeLabel: 'Starter',
                },
              ],
            },
          },
        ]),
      },
      faralinTransaction: {
        count: countMock,
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 0 } }),
        create: createMock,
      },
      studentProfile: {
        findUnique: vi.fn().mockResolvedValue({ userId: 'user-1' }),
      },
      university: {
        findUnique: vi.fn().mockResolvedValue({ shortName: 'Bath' }),
      },
      notification: {
        create: vi.fn().mockResolvedValue({}),
      },
    };

    const engine = buildEngine(prisma);
    await engine.processJourneyMilestoneBonus('student-1', 'climate-essay');

    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'BONUS',
        amount: 25,
        reason: 'journey:journey-1:milestone:1',
      }),
    });
  });
});

describe('FaralinEngineService.processAttemptCompletion', () => {
  it('creates conditional assessment transactions for enabled universities', async () => {
    const createMock = vi.fn().mockResolvedValue({});
    const prisma = {
      assessmentAttempt: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'aa-1',
          isVoided: false,
          completedAt: new Date(),
          assessmentId: 'assessment-1',
          studentProfileId: 'student-1',
          accuracyPercent: 80,
          improvementDelta: 10,
          trustLevel: 'VERIFIED',
          assessment: {
            title: 'Math Quiz',
            subjectId: 'subject-1',
            difficulty: 'STANDARD',
          },
          studentProfile: {
            universitySelections: [{ universityId: 'uni-1' }],
          },
        }),
        count: vi.fn().mockResolvedValue(0),
      },
      faralinTransaction: {
        count: vi.fn().mockResolvedValue(0),
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 0 } }),
        create: createMock,
      },
      universityAssessmentConfig: {
        findUnique: vi.fn().mockResolvedValue({ enabled: true, bonusRules: [] }),
      },
      faralinRule: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'rule-1',
            assessmentId: 'assessment-1',
            subjectId: null,
            problemTrackId: null,
            trustLevel: null,
            difficulty: null,
            baseAmount: 100,
            scoreMultiplier: 1,
            improvementBonus: 20,
            difficultyMultiplier: 1,
            isActive: true,
            effectiveFrom: new Date(Date.now() - 86400000),
            effectiveTo: null,
          },
        ]),
      },
      studentProfile: {
        findUnique: vi.fn().mockResolvedValue({ userId: 'user-1' }),
      },
      university: {
        findUnique: vi.fn().mockResolvedValue({ shortName: 'UCL' }),
      },
      notification: {
        create: vi.fn().mockResolvedValue({}),
      },
    };

    const engine = buildEngine(prisma);
    await engine.processAttemptCompletion('aa-1');

    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        assessmentAttemptId: 'aa-1',
        status: 'CONDITIONAL',
        type: 'EARNED',
        amount: 90,
      }),
    });
  });
});

describe('dual-write orchestration', () => {
  const original = process.env.FARALIN_DUAL_WRITE_LEGACY;

  afterEach(() => {
    if (original === undefined) delete process.env.FARALIN_DUAL_WRITE_LEGACY;
    else process.env.FARALIN_DUAL_WRITE_LEGACY = original;
  });

  it('legacy FaralinEngine fan-out is gated by AchievementLedgerService', () => {
    delete process.env.FARALIN_DUAL_WRITE_LEGACY;
    expect(isDualWriteLegacyEnabled()).toBe(false);

    process.env.FARALIN_DUAL_WRITE_LEGACY = 'true';
    expect(isDualWriteLegacyEnabled()).toBe(true);
  });
});
