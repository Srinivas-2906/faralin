import { UniversityConversionRule } from '@faralin/db';
import { PrismaService } from '../prisma/prisma.service';
import { toStaffStudentView, type StaffStudentView } from '../students/student-view.mapper';
import { getPerformanceBand } from './staff-roster';

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

export interface EngagementMetrics {
  totalRegistered: number;
  activeThisWeek: number;
  activeThisMonth: number;
  engagementRatePercent: number;
  activitiesPerActiveStudent: number;
}

export interface StaffStudentAssessmentRow {
  title: string;
  slug: string;
  subjectName: string;
  completedAt: string;
  accuracyPercent: number | null;
  faralinsEarned: number;
}

export interface StaffStudentActivityRow {
  type: 'assessment' | 'faralin' | 'track' | 'event';
  label: string;
  occurredAt: string;
  detail?: string;
}

export interface StaffStudentDetail {
  student: StaffStudentView & {
    subjectNames: string[];
    applicationStatus: string;
    performanceBand: string;
  };
  faralins: {
    totalFaralins: number;
    verifiedFaralins: number;
    estimatedBursaryGbp: number;
    faralinsPerGbp: number | null;
  };
  assessmentsCompleted: StaffStudentAssessmentRow[];
  recentActivity: StaffStudentActivityRow[];
}

function startOfWeekUtc(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysFromMonday),
  );
}

function startOfMonthUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
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

async function collectActiveStudentIds(
  prisma: PrismaService,
  universityId: string,
  followerStudentIds: string[],
  since: Date,
): Promise<Set<string>> {
  if (followerStudentIds.length === 0) return new Set();

  const [assessments, transactions, tracks, registrations] = await Promise.all([
    prisma.assessmentAttempt.findMany({
      where: {
        studentProfileId: { in: followerStudentIds },
        completedAt: { gte: since },
        isVoided: false,
      },
      select: { studentProfileId: true },
      distinct: ['studentProfileId'],
    }),
    prisma.faralinTransaction.findMany({
      where: {
        universityId,
        studentProfileId: { in: followerStudentIds },
        createdAt: { gte: since },
      },
      select: { studentProfileId: true },
      distinct: ['studentProfileId'],
    }),
    prisma.problemTrackAttempt.findMany({
      where: {
        studentProfileId: { in: followerStudentIds },
        completedAt: { gte: since },
        isVoided: false,
      },
      select: { studentProfileId: true },
      distinct: ['studentProfileId'],
    }),
    prisma.eventRegistration.findMany({
      where: {
        studentProfileId: { in: followerStudentIds },
        registeredAt: { gte: since },
        event: { universityId },
      },
      select: { studentProfileId: true },
      distinct: ['studentProfileId'],
    }),
  ]);

  const active = new Set<string>();
  for (const row of [...assessments, ...transactions, ...tracks, ...registrations]) {
    active.add(row.studentProfileId);
  }
  return active;
}

async function countActivityEvents(
  prisma: PrismaService,
  universityId: string,
  followerStudentIds: string[],
  since: Date,
): Promise<number> {
  if (followerStudentIds.length === 0) return 0;

  const [assessmentCount, transactionCount, trackCount, registrationCount] = await Promise.all([
    prisma.assessmentAttempt.count({
      where: {
        studentProfileId: { in: followerStudentIds },
        completedAt: { gte: since },
        isVoided: false,
      },
    }),
    prisma.faralinTransaction.count({
      where: {
        universityId,
        studentProfileId: { in: followerStudentIds },
        createdAt: { gte: since },
      },
    }),
    prisma.problemTrackAttempt.count({
      where: {
        studentProfileId: { in: followerStudentIds },
        completedAt: { gte: since },
        isVoided: false,
      },
    }),
    prisma.eventRegistration.count({
      where: {
        studentProfileId: { in: followerStudentIds },
        registeredAt: { gte: since },
        event: { universityId },
      },
    }),
  ]);

  return assessmentCount + transactionCount + trackCount + registrationCount;
}

export async function buildEngagementMetrics(
  prisma: PrismaService,
  universityId: string,
  followerStudentIds: string[],
): Promise<EngagementMetrics> {
  const totalRegistered = followerStudentIds.length;
  const weekStart = startOfWeekUtc();
  const monthStart = startOfMonthUtc();

  const [activeWeek, activeMonth, monthEvents] = await Promise.all([
    collectActiveStudentIds(prisma, universityId, followerStudentIds, weekStart),
    collectActiveStudentIds(prisma, universityId, followerStudentIds, monthStart),
    countActivityEvents(prisma, universityId, followerStudentIds, monthStart),
  ]);

  const activeThisWeek = activeWeek.size;
  const activeThisMonth = activeMonth.size;

  return {
    totalRegistered,
    activeThisWeek,
    activeThisMonth,
    engagementRatePercent:
      totalRegistered > 0 ? Math.round((activeThisMonth / totalRegistered) * 100) : 0,
    activitiesPerActiveStudent:
      activeThisMonth > 0 ? Math.round((monthEvents / activeThisMonth) * 10) / 10 : 0,
  };
}

export async function buildStaffStudentDetail(
  prisma: PrismaService,
  universityId: string,
  anonymousId: string,
  conversionRule: UniversityConversionRule | null,
): Promise<StaffStudentDetail | null> {
  const selection = await prisma.studentUniversitySelection.findFirst({
    where: {
      universityId,
      studentProfile: { anonymousId },
    },
    include: {
      studentProfile: {
        include: {
          subjects: { include: { subject: true } },
          applications: { where: { universityId } },
          assessmentAttempts: {
            where: { completedAt: { not: null }, isVoided: false },
            include: {
              assessment: { include: { subject: true } },
            },
            orderBy: { completedAt: 'desc' },
            take: 20,
          },
        },
      },
    },
  });

  if (!selection) return null;

  const profile = selection.studentProfile;
  const application = profile.applications[0];

  const [totalAgg, verifiedAgg, attemptFaralins, recentTransactions, recentTracks, recentEvents] =
    await Promise.all([
      prisma.faralinTransaction.aggregate({
        where: { universityId, studentProfileId: profile.id },
        _sum: { amount: true },
      }),
      prisma.faralinTransaction.aggregate({
        where: {
          universityId,
          studentProfileId: profile.id,
          trustLevel: { not: 'PRACTICE' },
          status: { in: ['CONDITIONAL', 'CONFIRMED'] },
        },
        _sum: { amount: true },
      }),
      prisma.faralinTransaction.findMany({
        where: {
          universityId,
          studentProfileId: profile.id,
          assessmentAttemptId: { not: null },
        },
        select: { assessmentAttemptId: true, amount: true },
      }),
      prisma.faralinTransaction.findMany({
        where: { universityId, studentProfileId: profile.id },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      prisma.problemTrackAttempt.findMany({
        where: {
          studentProfileId: profile.id,
          completedAt: { not: null },
          isVoided: false,
        },
        include: { problemTrack: true },
        orderBy: { completedAt: 'desc' },
        take: 15,
      }),
      prisma.eventRegistration.findMany({
        where: {
          studentProfileId: profile.id,
          event: { universityId },
        },
        include: { event: true },
        orderBy: { registeredAt: 'desc' },
        take: 15,
      }),
    ]);

  const totalFaralins = totalAgg._sum.amount ?? 0;
  const verifiedFaralins = verifiedAgg._sum.amount ?? 0;
  const faralinsPerGbp = conversionRule?.faralinsPerGbp ?? null;
  const estimatedBursaryGbp =
    faralinsPerGbp && faralinsPerGbp > 0 ? roundGbp(verifiedFaralins / faralinsPerGbp) : 0;

  const faralinsByAttemptId = new Map<string, number>();
  for (const tx of attemptFaralins) {
    if (!tx.assessmentAttemptId) continue;
    faralinsByAttemptId.set(
      tx.assessmentAttemptId,
      (faralinsByAttemptId.get(tx.assessmentAttemptId) ?? 0) + tx.amount,
    );
  }

  const assessmentsCompleted: StaffStudentAssessmentRow[] = profile.assessmentAttempts.map(
    (attempt) => ({
      title: attempt.assessment.title,
      slug: attempt.assessment.slug,
      subjectName: attempt.assessment.subject.name,
      completedAt: attempt.completedAt!.toISOString(),
      accuracyPercent:
        attempt.accuracyPercent != null ? Math.round(Number(attempt.accuracyPercent)) : null,
      faralinsEarned: faralinsByAttemptId.get(attempt.id) ?? 0,
    }),
  );

  type TimelineEntry = StaffStudentActivityRow & { sortAt: Date };

  const timeline: TimelineEntry[] = [];

  for (const attempt of profile.assessmentAttempts.slice(0, 15)) {
    timeline.push({
      type: 'assessment',
      label: attempt.assessment.title,
      occurredAt: attempt.completedAt!.toISOString(),
      detail:
        attempt.accuracyPercent != null
          ? `${Math.round(Number(attempt.accuracyPercent))}% accuracy`
          : undefined,
      sortAt: attempt.completedAt!,
    });
  }

  for (const tx of recentTransactions) {
    timeline.push({
      type: 'faralin',
      label: tx.type === 'EARNED' ? 'Faralins earned' : 'Faralin transaction',
      occurredAt: tx.createdAt.toISOString(),
      detail: `${tx.amount >= 0 ? '+' : ''}${tx.amount} Faralins`,
      sortAt: tx.createdAt,
    });
  }

  for (const track of recentTracks) {
    timeline.push({
      type: 'track',
      label: track.problemTrack.title,
      occurredAt: track.completedAt!.toISOString(),
      detail: track.faralinsEarned != null ? `${track.faralinsEarned} Faralins` : undefined,
      sortAt: track.completedAt!,
    });
  }

  for (const reg of recentEvents) {
    timeline.push({
      type: 'event',
      label: reg.event.title,
      occurredAt: reg.registeredAt.toISOString(),
      detail: 'Event registration',
      sortAt: reg.registeredAt,
    });
  }

  timeline.sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime());

  const recentActivity: StaffStudentActivityRow[] = timeline.slice(0, 15).map(
    ({ sortAt: _sortAt, ...row }) => row,
  );

  const subjectNames = profile.subjects.map((s) => s.subject.name);
  const assessmentsCount = profile.assessmentAttempts.length;

  return {
    student: {
      ...toStaffStudentView({
        anonymousId: profile.anonymousId,
        revealLevel: profile.revealLevel,
        firstName: profile.firstName,
        lastName: profile.lastName,
        schoolName: profile.schoolName,
        yearGroup: profile.yearGroup,
        subjectSlugs: profile.subjects.map((s) => s.subject.slug),
        assessmentsCompleted: assessmentsCount,
        totalFaralins,
      }),
      subjectNames,
      applicationStatus: application?.status ?? 'FOLLOWER',
      performanceBand: getPerformanceBand(totalFaralins, assessmentsCount),
    },
    faralins: {
      totalFaralins,
      verifiedFaralins,
      estimatedBursaryGbp,
      faralinsPerGbp,
    },
    assessmentsCompleted,
    recentActivity,
  };
}
