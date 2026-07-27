/**
 * Shared projection recalculation for backfill scripts (no NestJS dependency).
 */
import type { PrismaClient } from '@prisma/client';
import {
  calculateEstimatedAwardGbp,
  CORE_FARALINS_PER_GBP,
  deriveUniversityBoost,
  sumEligibleCoreFaralins,
} from '@faralin/types';

export async function recalculateProjectionsForStudent(
  prisma: PrismaClient,
  studentProfileId: string,
  coreFaralinsPerGbp = CORE_FARALINS_PER_GBP,
): Promise<void> {
  const [selections, achievements] = await Promise.all([
    prisma.studentUniversitySelection.findMany({
      where: { studentProfileId },
      include: { university: { include: { conversionRule: true } } },
    }),
    prisma.achievementEvent.findMany({
      where: { studentProfileId, verificationStatus: 'VERIFIED' },
      include: {
        assessmentAttempt: { select: { assessmentId: true } },
        problemTrackAttempt: { select: { problemTrackId: true } },
      },
    }),
  ]);

  const followedUniversityIds = new Set(selections.map((s) => s.universityId));
  const achievementInputs = achievements.map((event) => ({
    coreFaralins: event.coreFaralins,
    activityType: event.activityType,
    assessmentAttemptId: event.assessmentAttemptId,
    problemTrackAttemptId: event.problemTrackAttemptId,
    assessmentId: event.assessmentAttempt?.assessmentId ?? null,
    problemTrackId: event.problemTrackAttempt?.problemTrackId ?? null,
  }));

  for (const selection of selections) {
    const universityId = selection.universityId;
    const [assessmentConfigs, trackConfigs] = await Promise.all([
      prisma.universityAssessmentConfig.findMany({
        where: { universityId, enabled: true },
      }),
      prisma.universityProblemTrackConfig.findMany({
        where: { universityId, enabled: true },
      }),
    ]);

    const enabledAssessmentIds = new Set(assessmentConfigs.map((c) => c.assessmentId));
    const enabledTrackIds = new Set(trackConfigs.map((c) => c.problemTrackId));
    const eligibleCoreFaralins = sumEligibleCoreFaralins(
      achievementInputs,
      enabledAssessmentIds,
      enabledTrackIds,
    );
    const universityBoost = deriveUniversityBoost(
      selection.university.slug,
      selection.university.conversionRule?.faralinsPerGbp ?? null,
      coreFaralinsPerGbp,
    );
    const estimatedAwardGbp = calculateEstimatedAwardGbp({
      eligibleCoreFaralins,
      coreFaralinsPerGbp,
      universityBoost,
      subjectAlignmentBoost: 1,
      verificationBoost: 1,
      perStudentCapGbp: null,
    });

    await prisma.universityProjection.upsert({
      where: {
        studentProfileId_universityId: { studentProfileId, universityId },
      },
      create: {
        studentProfileId,
        universityId,
        eligibleCoreFaralins,
        universityBoost,
        subjectAlignmentBoost: 1,
        verificationBoost: 1,
        estimatedAwardGbp,
        status: 'ESTIMATE',
        calculatedAt: new Date(),
        snapshotVersion: 1,
      },
      update: {
        eligibleCoreFaralins,
        universityBoost,
        subjectAlignmentBoost: 1,
        verificationBoost: 1,
        estimatedAwardGbp,
        calculatedAt: new Date(),
        snapshotVersion: { increment: 1 },
      },
    });
  }

  if (followedUniversityIds.size > 0) {
    await prisma.universityProjection.deleteMany({
      where: {
        studentProfileId,
        universityId: { notIn: [...followedUniversityIds] },
      },
    });
  } else {
    await prisma.universityProjection.deleteMany({ where: { studentProfileId } });
  }
}

export async function recalculateAllProjections(
  prisma: PrismaClient,
  coreFaralinsPerGbp = CORE_FARALINS_PER_GBP,
): Promise<number> {
  const students = await prisma.studentProfile.findMany({
    where: {
      OR: [
        { achievementEvents: { some: {} } },
        { universitySelections: { some: {} } },
      ],
    },
    select: { id: true },
  });

  for (const student of students) {
    await recalculateProjectionsForStudent(prisma, student.id, coreFaralinsPerGbp);
  }

  return students.length;
}
