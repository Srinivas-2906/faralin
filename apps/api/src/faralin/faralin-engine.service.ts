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

interface RuleMatchContext {
  assessmentId: string;
  subjectId: string;
  difficulty: AssessmentDifficulty;
  trustLevel: FaralinTrustLevel;
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

    for (const selection of selections) {
      const rule = await this.findBestRule(selection.universityId, {
        assessmentId: attempt.assessmentId,
        subjectId: attempt.assessment.subjectId,
        difficulty: attempt.assessment.difficulty,
        trustLevel: attempt.trustLevel,
      });

      if (!rule) continue;

      const amount = this.calculateAmount(rule, accuracy, improvement);
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
    if (rule.assessmentId && rule.assessmentId !== ctx.assessmentId) return 0;
    if (rule.assessmentId) score += 8;
    if (rule.subjectId && rule.subjectId !== ctx.subjectId) return 0;
    if (rule.subjectId) score += 4;
    if (rule.trustLevel && rule.trustLevel !== ctx.trustLevel) return 0;
    if (rule.trustLevel) score += 2;
    if (rule.difficulty && rule.difficulty !== ctx.difficulty) return 0;
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

    const [transactions, monthTransactions, attempts, selections] = await Promise.all([
      this.prisma.faralinTransaction.findMany({
        where: {
          studentProfileId,
          status: { in: ['CONDITIONAL', 'CONFIRMED', 'CONVERTED'] },
        },
        include: { university: { include: { conversionRule: true } } },
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
      this.prisma.studentUniversitySelection.findMany({
        where: { studentProfileId },
        include: { university: { include: { conversionRule: true } } },
      }),
    ]);

    const byUniversityMap = new Map<
      string,
      {
        universityId: string;
        universityName: string;
        universitySlug: string;
        totalFaralins: number;
        verifiedFaralins: number;
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
        conversionRule: tx.university.conversionRule,
      };
      existing.totalFaralins += tx.amount;
      if (tx.trustLevel !== 'PRACTICE') {
        existing.verifiedFaralins += tx.amount;
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
          conversionRule: sel.university.conversionRule,
        });
      }
    }

    const byUniversity = Array.from(byUniversityMap.values()).map((u) => {
      const rule = u.conversionRule;
      const estimatedBursaryGbp = rule
        ? Math.round((u.verifiedFaralins / rule.faralinsPerGbp) * 100) / 100
        : 0;

      return {
        universityId: u.universityId,
        universityName: u.universityName,
        universitySlug: u.universitySlug,
        totalFaralins: u.totalFaralins,
        verifiedFaralins: u.verifiedFaralins,
        estimatedBursaryGbp,
        disclaimer:
          rule?.disclaimerText ??
          'Estimated bursary value is subject to admission, eligibility, and university terms.',
      };
    });

    const totalFaralins = byUniversity.reduce((sum, u) => sum + u.totalFaralins, 0);
    const estimatedBursaryGbp = byUniversity.reduce((sum, u) => sum + u.estimatedBursaryGbp, 0);

    return {
      totalFaralins,
      faralinsThisMonth: monthTransactions._sum.amount ?? 0,
      assessmentsCompleted: attempts,
      estimatedBursaryGbp,
      byUniversity,
    };
  }
}
