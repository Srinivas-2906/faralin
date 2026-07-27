/**
 * Backfill AchievementEvent rows from legacy FaralinTransaction data.
 * Uses MAX(amount) per activity group to avoid under-crediting students.
 *
 * Usage: pnpm --filter @faralin/db backfill:achievement-events
 */
import { PrismaClient } from '@prisma/client';
import { legacyVerifiedFaralinsToGbp } from '@faralin/types';
import { recalculateAllProjections } from './lib/recalculate-projections';

const prisma = new PrismaClient();
const DISCREPANCY_THRESHOLD_PERCENT = 5;

type ActivityGroup = {
  studentProfileId: string;
  assessmentAttemptId: string | null;
  problemTrackAttemptId: string | null;
  reason: string | null;
  maxAmount: number;
  trustLevel: string;
  createdAt: Date;
};

function buildIdempotencyKey(group: ActivityGroup): string | null {
  if (group.assessmentAttemptId) {
    return `ASSESSMENT|attemptId:${group.assessmentAttemptId}`;
  }
  if (group.problemTrackAttemptId && group.reason?.startsWith('section:')) {
    const sectionId = group.reason.replace('section:', '');
    return `PROBLEM_TRACK_SECTION|attemptId:${group.problemTrackAttemptId}|sectionId:${sectionId}`;
  }
  if (group.problemTrackAttemptId && !group.reason?.startsWith('section:')) {
    if (group.reason?.startsWith('journey:')) {
      return `JOURNEY_MILESTONE|${group.reason}|student:${group.studentProfileId}`;
    }
    return `PROBLEM_TRACK|attemptId:${group.problemTrackAttemptId}`;
  }
  if (group.reason?.startsWith('journey:')) {
    return `JOURNEY_MILESTONE|${group.reason}|student:${group.studentProfileId}`;
  }
  return null;
}

function activityTypeForGroup(group: ActivityGroup): string {
  if (group.assessmentAttemptId) return 'ASSESSMENT';
  if (group.reason?.startsWith('section:')) return 'PROBLEM_TRACK_SECTION';
  if (group.reason?.startsWith('journey:')) return 'JOURNEY_MILESTONE';
  if (group.problemTrackAttemptId) return 'PROBLEM_TRACK';
  return 'ASSESSMENT';
}

function percentDiff(a: number, b: number): number {
  if (a === 0 && b === 0) return 0;
  if (a === 0) return 100;
  return Math.abs((b - a) / a) * 100;
}

async function main() {
  const transactions = await prisma.faralinTransaction.findMany({
    where: { amount: { gt: 0 } },
    orderBy: { createdAt: 'asc' },
  });

  const groups = new Map<string, ActivityGroup>();

  for (const tx of transactions) {
    const key = [
      tx.studentProfileId,
      tx.assessmentAttemptId ?? '',
      tx.problemTrackAttemptId ?? '',
      tx.reason ?? '',
    ].join('|');

    const existing = groups.get(key);
    if (!existing || tx.amount > existing.maxAmount) {
      groups.set(key, {
        studentProfileId: tx.studentProfileId,
        assessmentAttemptId: tx.assessmentAttemptId,
        problemTrackAttemptId: tx.problemTrackAttemptId,
        reason: tx.reason,
        maxAmount: tx.amount,
        trustLevel: tx.trustLevel,
        createdAt: tx.createdAt,
      });
    }
  }

  let created = 0;
  let skipped = 0;

  for (const group of groups.values()) {
    const idempotencyKey = buildIdempotencyKey(group);
    if (!idempotencyKey) {
      skipped++;
      continue;
    }

    const exists = await prisma.achievementEvent.findUnique({
      where: { idempotencyKey },
    });
    if (exists) {
      skipped++;
      continue;
    }

    const activityType = activityTypeForGroup(group);
    const sectionId =
      group.reason?.startsWith('section:') ? group.reason.replace('section:', '') : null;

    await prisma.achievementEvent.create({
      data: {
        studentProfileId: group.studentProfileId,
        activityType: activityType as never,
        idempotencyKey,
        assessmentAttemptId: group.assessmentAttemptId,
        problemTrackAttemptId: group.problemTrackAttemptId,
        sectionId,
        trustLevel: group.trustLevel as never,
        verificationStatus: group.trustLevel === 'PRACTICE' ? 'PENDING' : 'VERIFIED',
        coreFaralins: group.maxAmount,
        completedAt: group.createdAt,
        metadata: { backfilled: true, legacyReason: group.reason },
      },
    });
    created++;
  }

  console.log(`Backfill complete: ${created} achievement events created, ${skipped} skipped.`);

  const projectionStudents = await recalculateAllProjections(prisma);
  console.log(`Recalculated projections for ${projectionStudents} students.`);

  const students = await prisma.studentProfile.findMany({ select: { id: true } });
  const coreDiscrepancies: Array<{
    studentProfileId: string;
    legacyTotal: number;
    coreTotal: number;
    percentDiff: number;
  }> = [];
  const gbpDiscrepancies: Array<{
    studentProfileId: string;
    universityId: string;
    legacyGbp: number;
    projectionGbp: number;
    percentDiff: number;
  }> = [];

  for (const student of students) {
    const [legacySum, coreSum, legacyByUni, projections] = await Promise.all([
      prisma.faralinTransaction.aggregate({
        where: {
          studentProfileId: student.id,
          status: { in: ['CONDITIONAL', 'CONFIRMED', 'CONVERTED'] },
        },
        _sum: { amount: true },
      }),
      prisma.achievementEvent.aggregate({
        where: { studentProfileId: student.id, verificationStatus: 'VERIFIED' },
        _sum: { coreFaralins: true },
      }),
      prisma.faralinTransaction.groupBy({
        by: ['universityId'],
        where: {
          studentProfileId: student.id,
          status: { in: ['CONDITIONAL', 'CONFIRMED', 'CONVERTED'] },
          trustLevel: { not: 'PRACTICE' },
        },
        _sum: { amount: true },
      }),
      prisma.universityProjection.findMany({
        where: { studentProfileId: student.id },
      }),
    ]);

    const legacyTotal = legacySum._sum.amount ?? 0;
    const coreTotal = coreSum._sum.coreFaralins ?? 0;
    if (legacyTotal > 0 || coreTotal > 0) {
      const diff = percentDiff(legacyTotal, coreTotal);
      if (diff > DISCREPANCY_THRESHOLD_PERCENT) {
        coreDiscrepancies.push({
          studentProfileId: student.id,
          legacyTotal,
          coreTotal,
          percentDiff: Math.round(diff * 100) / 100,
        });
      }
    }

    const projectionByUni = Object.fromEntries(
      projections.map((p) => [p.universityId, Number(p.estimatedAwardGbp)]),
    );

    for (const row of legacyByUni) {
      const university = await prisma.university.findUnique({
        where: { id: row.universityId },
        include: { conversionRule: true },
      });
      const faralinsPerGbp = university?.conversionRule?.faralinsPerGbp;
      if (!faralinsPerGbp) continue;

      const legacyGbp = legacyVerifiedFaralinsToGbp(row._sum.amount ?? 0, faralinsPerGbp);
      const projectionGbp = projectionByUni[row.universityId] ?? 0;
      if (legacyGbp === 0 && projectionGbp === 0) continue;

      const diff = percentDiff(legacyGbp, projectionGbp);
      if (diff > DISCREPANCY_THRESHOLD_PERCENT) {
        gbpDiscrepancies.push({
          studentProfileId: student.id,
          universityId: row.universityId,
          legacyGbp,
          projectionGbp,
          percentDiff: Math.round(diff * 100) / 100,
        });
      }
    }
  }

  if (coreDiscrepancies.length) {
    console.log('\nComparison report — students with >5% legacy vs core discrepancy:');
    for (const row of coreDiscrepancies.slice(0, 50)) {
      console.log(
        `  ${row.studentProfileId}: legacy=${row.legacyTotal} core=${row.coreTotal} diff=${row.percentDiff}%`,
      );
    }
    if (coreDiscrepancies.length > 50) {
      console.log(`  ... and ${coreDiscrepancies.length - 50} more`);
    }
  } else {
    console.log('\nComparison report: no students exceeded 5% legacy vs core discrepancy.');
  }

  if (gbpDiscrepancies.length) {
    console.log('\nComparison report — student/university pairs with >5% legacy vs projection GBP discrepancy:');
    for (const row of gbpDiscrepancies.slice(0, 50)) {
      console.log(
        `  ${row.studentProfileId} @ ${row.universityId}: legacyGbp=${row.legacyGbp} projectionGbp=${row.projectionGbp} diff=${row.percentDiff}%`,
      );
    }
    if (gbpDiscrepancies.length > 50) {
      console.log(`  ... and ${gbpDiscrepancies.length - 50} more`);
    }
  } else {
    console.log('\nComparison report: no student/university pairs exceeded 5% legacy vs projection GBP discrepancy.');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
