import { UniversityConversionRule } from '@faralin/db';
import { PrismaService } from '../prisma/prisma.service';

export interface FaralinDistribution {
  awardedThisMonth: number;
  outstandingFaralins: number;
  outstandingLiabilityGbp: number;
  convertedFaralins: number;
  averagePerStudent: number;
  faralinsPerGbp: number | null;
}

export interface AssessmentSummary {
  totalCompleted: number;
  uniqueAssessments: number;
  overallCompletionRate: number;
}

export interface AssessmentBreakdownRow {
  slug: string;
  title: string;
  subjectName: string;
  studentsCompleted: number;
  averageScorePercent: number | null;
  averageFaralins: number;
  completionRate: number;
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function roundGbp(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export async function buildFaralinDistribution(
  prisma: PrismaService,
  universityId: string,
  conversionRule: UniversityConversionRule | null,
  followerCount: number,
): Promise<FaralinDistribution> {
  const verifiedFilter = {
    universityId,
    trustLevel: { not: 'PRACTICE' as const },
  };

  const [awardedThisMonthAgg, outstandingAgg, convertedAgg] = await Promise.all([
    prisma.faralinTransaction.aggregate({
      where: {
        ...verifiedFilter,
        type: 'EARNED',
        createdAt: { gte: startOfCurrentMonth() },
      },
      _sum: { amount: true },
    }),
    prisma.faralinTransaction.aggregate({
      where: {
        ...verifiedFilter,
        status: { in: ['CONDITIONAL', 'CONFIRMED'] },
      },
      _sum: { amount: true },
    }),
    prisma.faralinTransaction.aggregate({
      where: {
        universityId,
        OR: [{ status: 'CONVERTED' }, { type: 'CONVERSION' }],
      },
      _sum: { amount: true },
    }),
  ]);

  const outstandingFaralins = outstandingAgg._sum.amount ?? 0;
  const faralinsPerGbp = conversionRule?.faralinsPerGbp ?? null;
  const outstandingLiabilityGbp =
    faralinsPerGbp && faralinsPerGbp > 0
      ? roundGbp(outstandingFaralins / faralinsPerGbp)
      : 0;

  return {
    awardedThisMonth: awardedThisMonthAgg._sum.amount ?? 0,
    outstandingFaralins,
    outstandingLiabilityGbp,
    convertedFaralins: convertedAgg._sum.amount ?? 0,
    averagePerStudent:
      followerCount > 0 ? Math.round(outstandingFaralins / followerCount) : 0,
    faralinsPerGbp,
  };
}

export async function buildAssessmentBreakdown(
  prisma: PrismaService,
  universityId: string,
  followerStudentIds: string[],
): Promise<{ summary: AssessmentSummary; breakdown: AssessmentBreakdownRow[] }> {
  if (followerStudentIds.length === 0) {
    return {
      summary: {
        totalCompleted: 0,
        uniqueAssessments: 0,
        overallCompletionRate: 0,
      },
      breakdown: [],
    };
  }

  const [attempts, faralinByAttempt] = await Promise.all([
    prisma.assessmentAttempt.findMany({
      where: { studentProfileId: { in: followerStudentIds } },
      include: {
        assessment: { include: { subject: true } },
      },
    }),
    prisma.faralinTransaction.findMany({
      where: {
        universityId,
        assessmentAttemptId: { not: null },
        studentProfileId: { in: followerStudentIds },
      },
      select: { assessmentAttemptId: true, amount: true },
    }),
  ]);

  const faralinsByAttemptId = new Map<string, number[]>();
  for (const tx of faralinByAttempt) {
    if (!tx.assessmentAttemptId) continue;
    const existing = faralinsByAttemptId.get(tx.assessmentAttemptId) ?? [];
    existing.push(tx.amount);
    faralinsByAttemptId.set(tx.assessmentAttemptId, existing);
  }

  type AssessmentAgg = {
    slug: string;
    title: string;
    subjectName: string;
    started: number;
    completed: number;
    scoreSum: number;
    scoreCount: number;
    faralinSum: number;
    faralinCount: number;
    completedStudentIds: Set<string>;
  };

  const byAssessment = new Map<string, AssessmentAgg>();

  for (const attempt of attempts) {
    const assessmentId = attempt.assessmentId;
    let agg = byAssessment.get(assessmentId);
    if (!agg) {
      agg = {
        slug: attempt.assessment.slug,
        title: attempt.assessment.title,
        subjectName: attempt.assessment.subject.name,
        started: 0,
        completed: 0,
        scoreSum: 0,
        scoreCount: 0,
        faralinSum: 0,
        faralinCount: 0,
        completedStudentIds: new Set(),
      };
      byAssessment.set(assessmentId, agg);
    }

    agg.started += 1;

    if (attempt.completedAt && !attempt.isVoided) {
      agg.completed += 1;
      agg.completedStudentIds.add(attempt.studentProfileId);

      if (attempt.accuracyPercent != null) {
        agg.scoreSum += Number(attempt.accuracyPercent);
        agg.scoreCount += 1;
      }

      const txAmounts = faralinsByAttemptId.get(attempt.id) ?? [];
      for (const amount of txAmounts) {
        agg.faralinSum += amount;
        agg.faralinCount += 1;
      }
    }
  }

  let totalStarted = 0;
  let totalCompleted = 0;

  const breakdown: AssessmentBreakdownRow[] = [];

  for (const agg of byAssessment.values()) {
    totalStarted += agg.started;
    totalCompleted += agg.completed;

    if (agg.completed === 0) continue;

    breakdown.push({
      slug: agg.slug,
      title: agg.title,
      subjectName: agg.subjectName,
      studentsCompleted: agg.completedStudentIds.size,
      averageScorePercent:
        agg.scoreCount > 0 ? Math.round(agg.scoreSum / agg.scoreCount) : null,
      averageFaralins:
        agg.faralinCount > 0 ? Math.round(agg.faralinSum / agg.faralinCount) : 0,
      completionRate:
        agg.started > 0 ? Math.round((agg.completed / agg.started) * 100) : 0,
    });
  }

  breakdown.sort((a, b) => b.studentsCompleted - a.studentsCompleted);

  return {
    summary: {
      totalCompleted,
      uniqueAssessments: breakdown.length,
      overallCompletionRate:
        totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0,
    },
    breakdown,
  };
}
