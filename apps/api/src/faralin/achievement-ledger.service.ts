import { Injectable } from '@nestjs/common';
import {
  AchievementActivityType,
  AchievementVerificationStatus,
  FaralinTrustLevel,
  NotificationType,
} from '@faralin/db';
import { PrismaService } from '../prisma/prisma.service';
import { FaralinEngineService } from './faralin-engine.service';
import { ProjectionService } from './projection.service';
import {
  achievementIdempotencyKey,
  calculateAssessmentCoreFaralins,
  calculateTrackCoreFaralins,
} from './core-faralin-calculator';

export function isDualWriteLegacyEnabled(): boolean {
  const flag = process.env.FARALIN_DUAL_WRITE_LEGACY;
  // Production default: ledger-only. Set FARALIN_DUAL_WRITE_LEGACY=true during migration.
  if (flag === undefined || flag === '') return false;
  return flag !== 'false' && flag !== '0';
}

@Injectable()
export class AchievementLedgerService {
  constructor(
    private prisma: PrismaService,
    private projectionService: ProjectionService,
    private faralinEngine: FaralinEngineService,
  ) {}

  async processAssessmentCompletion(attemptId: string): Promise<{ coreFaralins: number } | null> {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { assessment: true },
    });

    if (!attempt || attempt.isVoided || !attempt.completedAt) return null;

    const idempotencyKey = achievementIdempotencyKey('ASSESSMENT', {
      attemptId,
    });

    const existing = await this.prisma.achievementEvent.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return { coreFaralins: existing.coreFaralins };
    }

    const accuracy = Number(attempt.accuracyPercent ?? 0);
    const improvement = Number(attempt.improvementDelta ?? 0);
    const { coreFaralins, improvementBonus } = calculateAssessmentCoreFaralins({
      difficulty: attempt.assessment.difficulty,
      accuracyPercent: accuracy,
      improvementDelta: improvement,
      trustLevel: attempt.trustLevel,
    });

    if (coreFaralins <= 0) return null;

    const verificationStatus: AchievementVerificationStatus =
      attempt.trustLevel === 'PRACTICE' ? 'PENDING' : 'VERIFIED';

    await this.prisma.achievementEvent.create({
      data: {
        studentProfileId: attempt.studentProfileId,
        activityType: AchievementActivityType.ASSESSMENT,
        idempotencyKey,
        assessmentAttemptId: attemptId,
        subjectId: attempt.assessment.subjectId,
        difficulty: attempt.assessment.difficulty,
        rawScore: attempt.score,
        normalizedScore: accuracy / 100,
        trustLevel: attempt.trustLevel,
        verificationStatus,
        coreFaralins,
        improvementBonus,
        completedAt: attempt.completedAt,
        metadata: { accuracy, improvement, assessmentTitle: attempt.assessment.title },
      },
    });

    await this.projectionService.recalculateForStudent(attempt.studentProfileId);

    if (isDualWriteLegacyEnabled()) {
      await this.faralinEngine.processAttemptCompletion(attemptId);
    } else {
      await this.notifyCoreFaralinsEarned(
        attempt.studentProfileId,
        coreFaralins,
        `Recognition recorded from ${attempt.assessment.title}`,
      );
    }

    return { coreFaralins };
  }

  async processSectionMilestone(
    attemptId: string,
    sectionId: string,
    rewardFaralins: number,
  ): Promise<void> {
    if (rewardFaralins <= 0) return;

    const attempt = await this.prisma.problemTrackAttempt.findUnique({
      where: { id: attemptId },
      include: { problemTrack: true },
    });
    if (!attempt || attempt.isVoided) return;

    const idempotencyKey = achievementIdempotencyKey('PROBLEM_TRACK_SECTION', {
      attemptId,
      sectionId,
    });

    const existing = await this.prisma.achievementEvent.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return;

    await this.prisma.achievementEvent.create({
      data: {
        studentProfileId: attempt.studentProfileId,
        activityType: AchievementActivityType.PROBLEM_TRACK_SECTION,
        idempotencyKey,
        problemTrackAttemptId: attemptId,
        sectionId,
        subjectId: attempt.problemTrack.subjectId,
        trustLevel: attempt.problemTrack.trustLevel,
        verificationStatus: 'VERIFIED',
        coreFaralins: rewardFaralins,
        completedAt: new Date(),
        metadata: { sectionId, trackTitle: attempt.problemTrack.title },
      },
    });

    await this.projectionService.recalculateForStudent(attempt.studentProfileId);

    if (isDualWriteLegacyEnabled()) {
      await this.faralinEngine.processSectionMilestone(attemptId, sectionId, rewardFaralins);
    }
  }

  async processTrackCompletion(attemptId: string): Promise<{ coreFaralins: number } | null> {
    const attempt = await this.prisma.problemTrackAttempt.findUnique({
      where: { id: attemptId },
      include: { problemTrack: true },
    });

    if (!attempt || attempt.isVoided || !attempt.completedAt) return null;
    if (attempt.status !== 'SCORED' && attempt.status !== 'APPROVED') return null;

    const idempotencyKey = achievementIdempotencyKey('PROBLEM_TRACK', { attemptId });
    const existing = await this.prisma.achievementEvent.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return { coreFaralins: existing.coreFaralins };

    const rubricScore = Number(attempt.rubricScore ?? 0);
    const coreFaralins = calculateTrackCoreFaralins({
      difficultyBand: attempt.problemTrack.difficultyBand,
      rubricScorePercent: rubricScore,
      trustLevel: attempt.problemTrack.trustLevel,
    });

    if (coreFaralins <= 0) return null;

    await this.prisma.achievementEvent.create({
      data: {
        studentProfileId: attempt.studentProfileId,
        activityType: AchievementActivityType.PROBLEM_TRACK,
        idempotencyKey,
        problemTrackAttemptId: attemptId,
        subjectId: attempt.problemTrack.subjectId,
        rawScore: attempt.rubricScore,
        normalizedScore: Math.max(0, Math.min(1, rubricScore / 100)),
        trustLevel: attempt.problemTrack.trustLevel,
        verificationStatus: 'VERIFIED',
        coreFaralins,
        completedAt: attempt.completedAt,
        metadata: {
          rubricScore,
          awardBand: attempt.awardBandLabel,
          trackTitle: attempt.problemTrack.title,
        },
      },
    });

    await this.projectionService.recalculateForStudent(attempt.studentProfileId);

    if (isDualWriteLegacyEnabled()) {
      await this.faralinEngine.processTrackAttemptCompletion(attemptId);
    } else {
      await this.notifyCoreFaralinsEarned(
        attempt.studentProfileId,
        coreFaralins,
        `Recognition recorded from ${attempt.problemTrack.title}`,
      );
    }

    return { coreFaralins };
  }

  async processJourneyMilestoneBonus(
    studentProfileId: string,
    trackSlug: string,
  ): Promise<void> {
    const selections = await this.prisma.studentUniversitySelection.findMany({
      where: { studentProfileId },
    });
    if (!selections.length) return;

    const universityIds = selections.map((s) => s.universityId);
    const journeyConfigs = await this.prisma.universityProblemTrackJourneyConfig.findMany({
      where: { universityId: { in: universityIds }, enabled: true },
      include: { journey: true },
    });

    for (const config of journeyConfigs) {
      const milestones = config.journey.milestones as Array<{
        trackSlug: string;
        sortOrder: number;
        label: string;
        bonusFaralins?: number;
      }>;

      const milestone = milestones.find((m) => m.trackSlug === trackSlug);
      if (!milestone?.bonusFaralins || milestone.bonusFaralins <= 0) continue;

      const idempotencyKey = achievementIdempotencyKey('JOURNEY_MILESTONE', {
        studentProfileId,
        universityId: config.universityId,
        journeyId: config.journeyId,
        sortOrder: milestone.sortOrder,
      });

      const existing = await this.prisma.achievementEvent.findUnique({
        where: { idempotencyKey },
      });
      if (existing) continue;

      await this.prisma.achievementEvent.create({
        data: {
          studentProfileId,
          activityType: AchievementActivityType.JOURNEY_MILESTONE,
          idempotencyKey,
          trustLevel: FaralinTrustLevel.VERIFIED,
          verificationStatus: 'VERIFIED',
          coreFaralins: milestone.bonusFaralins,
          completedAt: new Date(),
          metadata: {
            journeyId: config.journeyId,
            journeySlug: config.journey.slug,
            milestoneLabel: milestone.label,
            trackSlug,
            universityId: config.universityId,
          },
        },
      });
    }

    await this.projectionService.recalculateForStudent(studentProfileId);

    if (isDualWriteLegacyEnabled()) {
      await this.faralinEngine.processJourneyMilestoneBonus(studentProfileId, trackSlug);
    }
  }

  async getCoreFaralinTotals(studentProfileId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [verifiedSum, monthSum] = await Promise.all([
      this.prisma.achievementEvent.aggregate({
        where: {
          studentProfileId,
          verificationStatus: 'VERIFIED',
        },
        _sum: { coreFaralins: true },
      }),
      this.prisma.achievementEvent.aggregate({
        where: {
          studentProfileId,
          verificationStatus: 'VERIFIED',
          completedAt: { gte: startOfMonth },
        },
        _sum: { coreFaralins: true },
      }),
    ]);

    return {
      coreFaralins: verifiedSum._sum.coreFaralins ?? 0,
      coreFaralinsThisMonth: monthSum._sum.coreFaralins ?? 0,
    };
  }

  private async notifyCoreFaralinsEarned(
    studentProfileId: string,
    coreFaralins: number,
    body: string,
  ) {
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      select: { userId: true },
    });
    if (!studentProfile) return;

    await this.prisma.notification.create({
      data: {
        userId: studentProfile.userId,
        type: NotificationType.FARALIN_EARNED,
        title: 'Core Faralins recorded',
        body: `${body}. You earned ${coreFaralins} Core Faralins. This is conditional recognition eligibility, not cash.`,
        metadata: { coreFaralins, studentProfileId },
      },
    });
  }
}
