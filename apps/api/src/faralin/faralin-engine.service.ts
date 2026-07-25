import { Injectable } from '@nestjs/common';
import {
  AssessmentAttempt,
  AssessmentDifficulty,
  FaralinRule,
  FaralinTransactionStatus,
  FaralinTransactionType,
  FaralinTrustLevel,
  NotificationType,
  Prisma,
} from '@faralin/db';
import { PrismaService } from '../prisma/prisma.service';
import type { BonusRule } from '../universities/staff-assessment-config';
import { computeRecognitionTier } from '../universities/recognition-tiers';

interface RuleMatchContext {
  assessmentId?: string;
  problemTrackId?: string;
  subjectId: string;
  difficulty?: AssessmentDifficulty;
  trustLevel: FaralinTrustLevel;
}

/** Prefix for section-milestone ledger rows; excluded from track-completion idempotency. */
export const SECTION_MILESTONE_REASON_PREFIX = 'section:';

export function isSectionMilestoneReason(reason: string | null | undefined): boolean {
  return reason?.startsWith(SECTION_MILESTONE_REASON_PREFIX) ?? false;
}

export function trackCompletionReason(trackTitle: string): string {
  return `Recognition from ${trackTitle}`;
}

@Injectable()
export class FaralinEngineService {
  constructor(private prisma: PrismaService) {}

  async processAttemptCompletion(attemptId: string): Promise<void> {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: true,
        studentProfile: {
          include: { universitySelections: true },
        },
      },
    });

    if (!attempt || attempt.isVoided || !attempt.completedAt) return;

    const existing = await this.prisma.faralinTransaction.count({
      where: { assessmentAttemptId: attemptId },
    });
    if (existing > 0) return;

    const selections = attempt.studentProfile.universitySelections;
    if (!selections.length) return;

    const accuracy = Number(attempt.accuracyPercent ?? 0);
    const improvement = Number(attempt.improvementDelta ?? 0);

    const priorAttempts = await this.prisma.assessmentAttempt.count({
      where: {
        studentProfileId: attempt.studentProfileId,
        assessmentId: attempt.assessmentId,
        completedAt: { not: null },
        isVoided: false,
        id: { not: attemptId },
      },
    });
    const isFirstAttempt = priorAttempts === 0;

    for (const selection of selections) {
      const config = await this.prisma.universityAssessmentConfig.findUnique({
        where: {
          universityId_assessmentId: {
            universityId: selection.universityId,
            assessmentId: attempt.assessmentId,
          },
        },
      });
      if (!config?.enabled) continue;

      const rule = await this.findBestRule(selection.universityId, {
        assessmentId: attempt.assessmentId,
        subjectId: attempt.assessment.subjectId,
        difficulty: attempt.assessment.difficulty,
        trustLevel: attempt.trustLevel,
      });

      if (!rule) continue;

      const baseAmount = this.calculateAmount(rule, accuracy, improvement);
      const bonusAmount = this.applyBonusRules(
        (config.bonusRules as BonusRule[] | null) ?? [],
        { accuracyPercent: accuracy, isFirstAttempt },
      );
      const amount = baseAmount + bonusAmount;
      if (amount <= 0) continue;

      const currentBalance = await this.getUniversityBalance(
        attempt.studentProfileId,
        selection.universityId,
      );

      await this.prisma.faralinTransaction.create({
        data: {
          studentProfileId: attempt.studentProfileId,
          universityId: selection.universityId,
          assessmentAttemptId: attemptId,
          type: FaralinTransactionType.EARNED,
          status: FaralinTransactionStatus.CONDITIONAL,
          trustLevel: attempt.trustLevel,
          amount,
          balanceAfter: currentBalance + amount,
          reason: `Recognition from ${attempt.assessment.title}`,
          metadata: {
            ruleId: rule.id,
            accuracy,
            improvement,
            baseAmount: rule.baseAmount,
            scoreMultiplier: Number(rule.scoreMultiplier),
            improvementBonus: rule.improvementBonus,
            difficultyMultiplier: Number(rule.difficultyMultiplier),
            bonusAmount,
          },
        },
      });

      const studentProfile = await this.prisma.studentProfile.findUnique({
        where: { id: attempt.studentProfileId },
        select: { userId: true },
      });

      if (studentProfile) {
        const university = await this.prisma.university.findUnique({
          where: { id: selection.universityId },
        });

        await this.prisma.notification.create({
          data: {
            userId: studentProfile.userId,
            type: NotificationType.FARALIN_EARNED,
            title: 'Recognition recorded',
            body: `You earned ${amount} ${university?.shortName ?? 'university'} Faralins. This is conditional recognition value, not cash today.`,
            metadata: { universityId: selection.universityId, amount, attemptId },
          },
        });
      }
    }
  }

  async processSectionMilestone(
    attemptId: string,
    sectionId: string,
    rewardFaralins: number,
  ): Promise<void> {
    const attempt = await this.prisma.problemTrackAttempt.findUnique({
      where: { id: attemptId },
      include: {
        problemTrack: true,
        studentProfile: { include: { universitySelections: true } },
      },
    });
    if (!attempt || attempt.isVoided) return;

    const existing = await this.prisma.faralinTransaction.count({
      where: {
        problemTrackAttemptId: attemptId,
        reason: `section:${sectionId}`,
      },
    });
    if (existing > 0) return;

    for (const selection of attempt.studentProfile.universitySelections) {
      const trackConfig = await this.prisma.universityProblemTrackConfig.findUnique({
        where: {
          universityId_problemTrackId: {
            universityId: selection.universityId,
            problemTrackId: attempt.problemTrackId,
          },
        },
      });
      if (!trackConfig?.enabled) continue;

      const currentBalance = await this.getUniversityBalance(
        attempt.studentProfileId,
        selection.universityId,
      );

      await this.prisma.faralinTransaction.create({
        data: {
          studentProfileId: attempt.studentProfileId,
          universityId: selection.universityId,
          problemTrackAttemptId: attemptId,
          type: FaralinTransactionType.EARNED,
          status: FaralinTransactionStatus.CONDITIONAL,
          trustLevel: attempt.problemTrack.trustLevel,
          amount: rewardFaralins,
          balanceAfter: currentBalance + rewardFaralins,
          reason: `${SECTION_MILESTONE_REASON_PREFIX}${sectionId}`,
        },
      });
    }
  }

  async processTrackAttemptCompletion(attemptId: string): Promise<void> {
    const attempt = await this.prisma.problemTrackAttempt.findUnique({
      where: { id: attemptId },
      include: {
        problemTrack: true,
        studentProfile: {
          include: { universitySelections: true },
        },
      },
    });

    if (!attempt || attempt.isVoided || !attempt.completedAt) return;
    if (attempt.status !== 'SCORED' && attempt.status !== 'APPROVED') return;
    if ((attempt.faralinsEarned ?? 0) <= 0) return;

    const existing = await this.prisma.faralinTransaction.count({
      where: {
        problemTrackAttemptId: attemptId,
        NOT: { reason: { startsWith: SECTION_MILESTONE_REASON_PREFIX } },
      },
    });
    if (existing > 0) return;

    const selections = attempt.studentProfile.universitySelections;
    if (!selections.length) return;

    const rubricScore = Number(attempt.rubricScore ?? 0);
    const rubricPercent = Math.max(0, Math.min(100, rubricScore));

    const priorTrackAttempts = await this.prisma.problemTrackAttempt.count({
      where: {
        studentProfileId: attempt.studentProfileId,
        problemTrackId: attempt.problemTrackId,
        completedAt: { not: null },
        isVoided: false,
        id: { not: attemptId },
        status: { in: ['SCORED', 'APPROVED'] },
      },
    });
    const isFirstAttempt = priorTrackAttempts === 0;

    for (const selection of selections) {
      const trackConfig = await this.prisma.universityProblemTrackConfig.findUnique({
        where: {
          universityId_problemTrackId: {
            universityId: selection.universityId,
            problemTrackId: attempt.problemTrackId,
          },
        },
      });
      if (!trackConfig?.enabled) continue;

      const rule = await this.findBestTrackRule(selection.universityId, {
        problemTrackId: attempt.problemTrackId,
        subjectId: attempt.problemTrack.subjectId,
        trustLevel: attempt.problemTrack.trustLevel,
      });

      const baseAmount = rule
        ? this.calculateTrackAmount(rule, attempt.faralinsEarned!, rubricScore)
        : attempt.faralinsEarned!;

      const bonusAmount = this.applyBonusRules(
        (trackConfig.bonusRules as BonusRule[] | null) ?? [],
        { accuracyPercent: rubricPercent, isFirstAttempt },
      );
      const amount = baseAmount + bonusAmount;

      if (amount <= 0) continue;

      const currentBalance = await this.getUniversityBalance(
        attempt.studentProfileId,
        selection.universityId,
      );

      await this.prisma.faralinTransaction.create({
        data: {
          studentProfileId: attempt.studentProfileId,
          universityId: selection.universityId,
          problemTrackAttemptId: attemptId,
          type: FaralinTransactionType.EARNED,
          status: FaralinTransactionStatus.CONDITIONAL,
          trustLevel: attempt.problemTrack.trustLevel,
          amount,
          balanceAfter: currentBalance + amount,
          reason: trackCompletionReason(attempt.problemTrack.title),
          metadata: {
            ruleId: rule?.id,
            rubricScore,
            faralinsEarned: attempt.faralinsEarned,
            awardBand: attempt.awardBandLabel,
            trustLevel: attempt.trustLevel,
            baseAmount,
            bonusAmount,
          },
        },
      });

      const studentProfile = await this.prisma.studentProfile.findUnique({
        where: { id: attempt.studentProfileId },
        select: { userId: true },
      });

      if (studentProfile) {
        const university = await this.prisma.university.findUnique({
          where: { id: selection.universityId },
        });

        await this.prisma.notification.create({
          data: {
            userId: studentProfile.userId,
            type: NotificationType.FARALIN_EARNED,
            title: 'Problem Track recognition recorded',
            body: `You earned ${amount} ${university?.shortName ?? 'university'} Faralins from "${attempt.problemTrack.title}".`,
            metadata: { universityId: selection.universityId, amount, attemptId },
          },
        });
      }
    }
  }

  /** Award journey milestone bonusFaralins when a track in an enabled journey is completed. */
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
        badgeLabel?: string;
      }>;

      const milestone = milestones.find((m) => m.trackSlug === trackSlug);
      if (!milestone?.bonusFaralins || milestone.bonusFaralins <= 0) continue;

      const reason = `journey:${config.journeyId}:milestone:${milestone.sortOrder}`;
      const existing = await this.prisma.faralinTransaction.count({
        where: {
          studentProfileId,
          universityId: config.universityId,
          reason,
        },
      });
      if (existing > 0) continue;

      const currentBalance = await this.getUniversityBalance(
        studentProfileId,
        config.universityId,
      );

      await this.prisma.faralinTransaction.create({
        data: {
          studentProfileId,
          universityId: config.universityId,
          type: FaralinTransactionType.BONUS,
          status: FaralinTransactionStatus.CONDITIONAL,
          trustLevel: FaralinTrustLevel.VERIFIED,
          amount: milestone.bonusFaralins,
          balanceAfter: currentBalance + milestone.bonusFaralins,
          reason,
          metadata: {
            journeyId: config.journeyId,
            journeySlug: config.journey.slug,
            milestoneLabel: milestone.label,
            badgeLabel: milestone.badgeLabel ?? null,
            trackSlug,
          },
        },
      });

      const studentProfile = await this.prisma.studentProfile.findUnique({
        where: { id: studentProfileId },
        select: { userId: true },
      });

      if (studentProfile) {
        const university = await this.prisma.university.findUnique({
          where: { id: config.universityId },
        });

        await this.prisma.notification.create({
          data: {
            userId: studentProfile.userId,
            type: NotificationType.FARALIN_EARNED,
            title: 'Journey milestone bonus',
            body: `You earned ${milestone.bonusFaralins} ${university?.shortName ?? 'university'} Faralins for completing "${milestone.label}".`,
            metadata: {
              universityId: config.universityId,
              amount: milestone.bonusFaralins,
              journeyId: config.journeyId,
            },
          },
        });
      }
    }
  }

  private async findBestTrackRule(
    universityId: string,
    ctx: { problemTrackId: string; subjectId: string; trustLevel: FaralinTrustLevel },
  ): Promise<FaralinRule | null> {
    const now = new Date();
    const rules = await this.prisma.faralinRule.findMany({
      where: {
        universityId,
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
    });

    const scored = rules
      .map((rule) => ({ rule, score: this.trackRuleSpecificity(rule, ctx) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored[0]?.rule ?? null;
  }

  private trackRuleSpecificity(
    rule: FaralinRule,
    ctx: { problemTrackId: string; subjectId: string; trustLevel: FaralinTrustLevel },
  ): number {
    let score = 1;
    if (rule.problemTrackId && rule.problemTrackId !== ctx.problemTrackId) return 0;
    if (rule.problemTrackId) score += 8;
    if (rule.assessmentId) return 0;
    if (rule.subjectId && rule.subjectId !== ctx.subjectId) return 0;
    if (rule.subjectId) score += 4;
    if (rule.trustLevel && rule.trustLevel !== ctx.trustLevel) return 0;
    if (rule.trustLevel) score += 2;
    return score;
  }

  private calculateTrackAmount(
    rule: FaralinRule,
    faralinsEarned: number,
    _rubricScore: number,
  ): number {
    return Math.round(faralinsEarned * Number(rule.scoreMultiplier));
  }

  private async findBestRule(
    universityId: string,
    ctx: RuleMatchContext,
  ): Promise<FaralinRule | null> {
    const now = new Date();
    const rules = await this.prisma.faralinRule.findMany({
      where: {
        universityId,
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
    });

    const scored = rules
      .map((rule) => ({ rule, score: this.ruleSpecificity(rule, ctx) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored[0]?.rule ?? null;
  }

  private ruleSpecificity(rule: FaralinRule, ctx: RuleMatchContext): number {
    let score = 1;
    if (rule.problemTrackId) return 0;
    if (rule.assessmentId && rule.assessmentId !== ctx.assessmentId) return 0;
    if (rule.assessmentId) score += 8;
    if (rule.subjectId && rule.subjectId !== ctx.subjectId) return 0;
    if (rule.subjectId) score += 4;
    if (rule.trustLevel && rule.trustLevel !== ctx.trustLevel) return 0;
    if (rule.trustLevel) score += 2;
    if (rule.difficulty && ctx.difficulty && rule.difficulty !== ctx.difficulty) return 0;
    if (rule.difficulty) score += 1;
    return score;
  }

  private calculateAmount(
    rule: FaralinRule,
    accuracyPercent: number,
    improvementDelta: number,
  ): number {
    const accuracyFactor = Math.max(0, Math.min(1, accuracyPercent / 100));
    const base = rule.baseAmount;
    const scoreComponent = base * accuracyFactor * Number(rule.scoreMultiplier);
    const difficultyComponent = scoreComponent * Number(rule.difficultyMultiplier);
    const improvementComponent =
      improvementDelta > 0 ? rule.improvementBonus * Math.min(improvementDelta / 20, 1) : 0;

    return Math.round(difficultyComponent + improvementComponent);
  }

  applyBonusRules(
    rules: BonusRule[],
    ctx: { accuracyPercent: number; isFirstAttempt: boolean },
  ): number {
    let bonus = 0;
    for (const rule of rules) {
      if (rule.type === 'SCORE_ABOVE' && rule.threshold != null) {
        if (ctx.accuracyPercent >= rule.threshold) bonus += rule.amount;
      } else if (rule.type === 'PERFECT_SCORE' && ctx.accuracyPercent >= 100) {
        bonus += rule.amount;
      } else if (rule.type === 'FIRST_ATTEMPT' && ctx.isFirstAttempt) {
        bonus += rule.amount;
      }
    }
    return bonus;
  }

  private async getUniversityBalance(
    studentProfileId: string,
    universityId: string,
  ): Promise<number> {
    const result = await this.prisma.faralinTransaction.aggregate({
      where: {
        studentProfileId,
        universityId,
        status: { in: ['CONDITIONAL', 'CONFIRMED', 'CONVERTED'] },
      },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }
}

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  async getPortfolio(studentProfileId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const selections = await this.prisma.studentUniversitySelection.findMany({
      where: { studentProfileId },
      include: { university: { include: { conversionRule: true } } },
      orderBy: { priority: 'asc' },
    });
    const universityIds = selections.map((s) => s.universityId);
    const priorityByUniversityId = Object.fromEntries(
      selections.map((s) => [s.universityId, s.priority]),
    );

    const [transactions, monthTransactions, attempts, trackAttempts, trackArtifacts, assessmentConfigs, trackConfigs, tierConfigs] =
      await Promise.all([
      this.prisma.faralinTransaction.findMany({
        where: {
          studentProfileId,
          status: { in: ['CONDITIONAL', 'CONFIRMED', 'CONVERTED'] },
        },
        include: {
          university: { include: { conversionRule: true } },
          assessmentAttempt: { select: { assessmentId: true } },
          problemTrackAttempt: { select: { problemTrackId: true } },
        },
      }),
      this.prisma.faralinTransaction.aggregate({
        where: {
          studentProfileId,
          createdAt: { gte: startOfMonth },
          amount: { gt: 0 },
        },
        _sum: { amount: true },
      }),
      this.prisma.assessmentAttempt.count({
        where: { studentProfileId, completedAt: { not: null }, isVoided: false },
      }),
      this.prisma.problemTrackAttempt.count({
        where: {
          studentProfileId,
          completedAt: { not: null },
          isVoided: false,
          status: { in: ['SCORED', 'APPROVED', 'MODERATION_PENDING'] },
        },
      }),
      this.prisma.portfolioArtifact.findMany({
        where: { studentProfileId },
        orderBy: { completedAt: 'desc' },
        take: 10,
      }),
      this.prisma.universityAssessmentConfig.findMany({
        where: { universityId: { in: universityIds } },
      }),
      this.prisma.universityProblemTrackConfig.findMany({
        where: { universityId: { in: universityIds } },
      }),
      this.prisma.universityRecognitionTierConfig.findMany({
        where: { universityId: { in: universityIds } },
      }),
    ]);

    const assessmentHear = Object.fromEntries(
      assessmentConfigs.map((c) => [`${c.universityId}:${c.assessmentId}`, c.affectsBursaryEligibility]),
    );
    const trackHear = Object.fromEntries(
      trackConfigs.map((c) => [`${c.universityId}:${c.problemTrackId}`, c.affectsBursaryEligibility]),
    );

    const byUniversityMap = new Map<
      string,
      {
        universityId: string;
        universityName: string;
        universitySlug: string;
        totalFaralins: number;
        verifiedFaralins: number;
        hearEligibleFaralins: number;
        conversionRule: { faralinsPerGbp: number; disclaimerText: string; minVerifiedPercent: number } | null;
      }
    >();

    for (const tx of transactions) {
      const key = tx.universityId;
      const existing = byUniversityMap.get(key) ?? {
        universityId: tx.universityId,
        universityName: tx.university.name,
        universitySlug: tx.university.slug,
        totalFaralins: 0,
        verifiedFaralins: 0,
        hearEligibleFaralins: 0,
        conversionRule: tx.university.conversionRule,
      };
      existing.totalFaralins += tx.amount;
      if (tx.trustLevel !== 'PRACTICE') {
        existing.verifiedFaralins += tx.amount;
        let hearEligible = true;
        if (tx.assessmentAttempt?.assessmentId) {
          hearEligible =
            assessmentHear[`${tx.universityId}:${tx.assessmentAttempt.assessmentId}`] ?? true;
        } else if (tx.problemTrackAttempt?.problemTrackId) {
          hearEligible =
            trackHear[`${tx.universityId}:${tx.problemTrackAttempt.problemTrackId}`] ?? true;
        }
        if (hearEligible) existing.hearEligibleFaralins += tx.amount;
      }
      byUniversityMap.set(key, existing);
    }

    for (const sel of selections) {
      if (!byUniversityMap.has(sel.universityId)) {
        byUniversityMap.set(sel.universityId, {
          universityId: sel.universityId,
          universityName: sel.university.name,
          universitySlug: sel.university.slug,
          totalFaralins: 0,
          verifiedFaralins: 0,
          hearEligibleFaralins: 0,
          conversionRule: sel.university.conversionRule,
        });
      }
    }

    const byUniversity = Array.from(byUniversityMap.values())
      .map((u) => {
      const rule = u.conversionRule;
      const estimatedBursaryGbp = rule
        ? Math.round((u.verifiedFaralins / rule.faralinsPerGbp) * 100) / 100
        : 0;

      const uniTiers = tierConfigs
        .filter((t) => t.universityId === u.universityId)
        .map((t) => ({
          tier: t.tier,
          minVerifiedFaralins: t.minVerifiedFaralins,
          benefitsSummary: t.benefitsSummary,
        }));
      const recognition = computeRecognitionTier(u.verifiedFaralins, uniTiers);

      return {
        universityId: u.universityId,
        universityName: u.universityName,
        universitySlug: u.universitySlug,
        totalFaralins: u.totalFaralins,
        verifiedFaralins: u.verifiedFaralins,
        hearEligibleFaralins: u.hearEligibleFaralins,
        recognitionTier: recognition.currentTier,
        recognitionTierLabel: recognition.currentLabel,
        nextRecognitionTier: recognition.nextTier,
        nextRecognitionThreshold: recognition.nextThreshold,
        recognitionProgressPercent: recognition.progressPercent,
        estimatedBursaryGbp,
        faralinsPerGbp: rule?.faralinsPerGbp ?? null,
        disclaimer:
          rule?.disclaimerText ??
          'Estimated bursary value is subject to admission, eligibility, and university terms.',
      };
    })
      .sort(
        (a, b) =>
          (priorityByUniversityId[a.universityId] ?? Number.MAX_SAFE_INTEGER) -
          (priorityByUniversityId[b.universityId] ?? Number.MAX_SAFE_INTEGER),
      );

    const totalFaralins = byUniversity.reduce((sum, u) => sum + u.totalFaralins, 0);
    const hearEligibleFaralins = byUniversity.reduce((sum, u) => sum + u.hearEligibleFaralins, 0);
    const estimatedBursaryGbp = byUniversity.reduce((sum, u) => sum + u.estimatedBursaryGbp, 0);

    return {
      totalFaralins,
      hearEligibleFaralins,
      faralinsThisMonth: monthTransactions._sum.amount ?? 0,
      assessmentsCompleted: attempts,
      tracksCompleted: trackAttempts,
      estimatedBursaryGbp,
      byUniversity,
      recentArtifacts: trackArtifacts.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        subjectName: a.subjectName,
        difficultyBand: a.difficultyBand,
        rubricScore: Number(a.rubricScore),
        faralinsEarned: a.faralinsEarned,
        skillsDemonstrated: a.skillsDemonstrated,
        trustLevel: a.trustLevel,
        moderationStatus: a.moderationStatus,
        completedAt: a.completedAt.toISOString(),
      })),
    };
  }
}
