import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FaralinTrustLevel } from '@faralin/db';
import {
  AchievementLedgerService,
  isDualWriteLegacyEnabled,
} from './achievement-ledger.service';

function buildLedger(deps: {
  prisma: Record<string, unknown>;
  projectionService?: { recalculateForStudent: ReturnType<typeof vi.fn> };
  faralinEngine?: {
    processAttemptCompletion: ReturnType<typeof vi.fn>;
  };
}) {
  return new AchievementLedgerService(
    deps.prisma as never,
    (deps.projectionService ?? { recalculateForStudent: vi.fn() }) as never,
    (deps.faralinEngine ?? { processAttemptCompletion: vi.fn() }) as never,
  );
}

describe('isDualWriteLegacyEnabled', () => {
  const original = process.env.FARALIN_DUAL_WRITE_LEGACY;

  afterEach(() => {
    if (original === undefined) delete process.env.FARALIN_DUAL_WRITE_LEGACY;
    else process.env.FARALIN_DUAL_WRITE_LEGACY = original;
  });

  it('defaults to true when unset', () => {
    delete process.env.FARALIN_DUAL_WRITE_LEGACY;
    expect(isDualWriteLegacyEnabled()).toBe(true);
  });

  it('returns false when explicitly disabled', () => {
    process.env.FARALIN_DUAL_WRITE_LEGACY = 'false';
    expect(isDualWriteLegacyEnabled()).toBe(false);
  });
});

describe('AchievementLedgerService.processAssessmentCompletion', () => {
  let attemptFindMock: ReturnType<typeof vi.fn>;
  let eventFindMock: ReturnType<typeof vi.fn>;
  let createMock: ReturnType<typeof vi.fn>;
  let notificationCreateMock: ReturnType<typeof vi.fn>;
  let recalculateMock: ReturnType<typeof vi.fn>;
  let legacyMock: ReturnType<typeof vi.fn>;
  let ledger: AchievementLedgerService;
  const originalDualWrite = process.env.FARALIN_DUAL_WRITE_LEGACY;

  beforeEach(() => {
    attemptFindMock = vi.fn();
    eventFindMock = vi.fn();
    createMock = vi.fn();
    notificationCreateMock = vi.fn();
    recalculateMock = vi.fn();
    legacyMock = vi.fn();
    ledger = buildLedger({
      prisma: {
        assessmentAttempt: { findUnique: attemptFindMock },
        achievementEvent: {
          findUnique: eventFindMock,
          create: createMock,
        },
        studentProfile: {
          findUnique: vi.fn().mockResolvedValue({ userId: 'user-1' }),
        },
        notification: { create: notificationCreateMock },
      },
      projectionService: { recalculateForStudent: recalculateMock },
      faralinEngine: { processAttemptCompletion: legacyMock },
    });
    process.env.FARALIN_DUAL_WRITE_LEGACY = 'true';
  });

  afterEach(() => {
    if (originalDualWrite === undefined) delete process.env.FARALIN_DUAL_WRITE_LEGACY;
    else process.env.FARALIN_DUAL_WRITE_LEGACY = originalDualWrite;
  });

  const completedAttempt = {
    id: 'attempt-1',
    studentProfileId: 'student-1',
    isVoided: false,
    completedAt: new Date(),
    accuracyPercent: 85,
    improvementDelta: 10,
    trustLevel: FaralinTrustLevel.VERIFIED,
    score: 17,
    assessment: {
      subjectId: 'subject-1',
      difficulty: 'STANDARD',
      title: 'Sample assessment',
    },
  };

  it('creates one achievement event and recalculates projections', async () => {
    attemptFindMock.mockResolvedValue(completedAttempt);
    eventFindMock.mockResolvedValue(null);
    createMock.mockResolvedValue({ id: 'event-1' });

    const result = await ledger.processAssessmentCompletion('attempt-1');

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(recalculateMock).toHaveBeenCalledWith('student-1');
    expect(legacyMock).toHaveBeenCalledWith('attempt-1');
    expect(result?.coreFaralins).toBeGreaterThan(0);
  });

  it('is idempotent when achievement already exists', async () => {
    attemptFindMock.mockResolvedValue(completedAttempt);
    eventFindMock.mockResolvedValue({ id: 'event-1', coreFaralins: 240 });

    const result = await ledger.processAssessmentCompletion('attempt-1');

    expect(createMock).not.toHaveBeenCalled();
    expect(recalculateMock).not.toHaveBeenCalled();
    expect(legacyMock).not.toHaveBeenCalled();
    expect(result).toEqual({ coreFaralins: 240 });
  });

  it('skips legacy fan-out when dual-write is disabled', async () => {
    process.env.FARALIN_DUAL_WRITE_LEGACY = 'false';
    attemptFindMock.mockResolvedValue(completedAttempt);
    eventFindMock.mockResolvedValue(null);
    createMock.mockResolvedValue({ id: 'event-1' });

    await ledger.processAssessmentCompletion('attempt-1');

    expect(legacyMock).not.toHaveBeenCalled();
    expect(notificationCreateMock).toHaveBeenCalled();
  });
});
