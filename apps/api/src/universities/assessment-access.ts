import { PrismaService } from '../prisma/prisma.service';

export type AssessmentLockState = 'AVAILABLE' | 'LOCKED' | 'COMPLETED';

export interface AssessmentAccessResult {
  accessible: boolean;
  lockState: AssessmentLockState;
  lockReason: string | null;
}

export interface PrerequisiteInfo {
  id: string;
  slug: string;
  title: string;
}

export function computeLevelLabel(levelOrder: number | null): string | null {
  if (levelOrder == null) return null;
  return `Level ${levelOrder}`;
}

function evaluateConfigAccess(
  config: {
    enabled: boolean;
    yearGroups: number[];
    availableFrom: Date | null;
    availableTo: Date | null;
    unlocksAfterAssessmentId: string | null;
  },
  context: {
    studentYearGroup: number | null;
    completedAssessmentIds: Set<string>;
    assessmentId: string;
    now: Date;
  },
  prerequisite: PrerequisiteInfo | null,
): AssessmentAccessResult {
  if (!config.enabled) {
    return { accessible: false, lockState: 'LOCKED', lockReason: 'Not offered by this university' };
  }

  if (context.completedAssessmentIds.has(context.assessmentId)) {
    return { accessible: true, lockState: 'COMPLETED', lockReason: null };
  }

  if (config.yearGroups.length > 0) {
    if (context.studentYearGroup == null) {
      return {
        accessible: false,
        lockState: 'LOCKED',
        lockReason: 'Year group required to access this assessment',
      };
    }
    if (!config.yearGroups.includes(context.studentYearGroup)) {
      return {
        accessible: false,
        lockState: 'LOCKED',
        lockReason: `Available for year ${config.yearGroups.join(', ')} only`,
      };
    }
  }

  if (config.availableFrom && context.now < config.availableFrom) {
    return {
      accessible: false,
      lockState: 'LOCKED',
      lockReason: `Available from ${config.availableFrom.toLocaleDateString('en-GB')}`,
    };
  }

  if (config.availableTo && context.now > config.availableTo) {
    return {
      accessible: false,
      lockState: 'LOCKED',
      lockReason: 'This assessment is no longer available',
    };
  }

  if (
    config.unlocksAfterAssessmentId &&
    !context.completedAssessmentIds.has(config.unlocksAfterAssessmentId)
  ) {
    const prereqTitle = prerequisite?.title ?? 'the previous level';
    return {
      accessible: false,
      lockState: 'LOCKED',
      lockReason: `Complete ${prereqTitle} first`,
    };
  }

  return { accessible: true, lockState: 'AVAILABLE', lockReason: null };
}

export async function loadStudentAssessmentAccessContext(
  prisma: PrismaService,
  studentProfileId: string,
) {
  const [profile, selections, completedAttempts] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      select: { yearGroup: true },
    }),
    prisma.studentUniversitySelection.findMany({
      where: { studentProfileId },
      select: { universityId: true },
    }),
    prisma.assessmentAttempt.findMany({
      where: {
        studentProfileId,
        completedAt: { not: null },
        isVoided: false,
      },
      select: { assessmentId: true, faralinTransactions: { select: { universityId: true } } },
    }),
  ]);

  const universityIds = selections.map((s) => s.universityId);
  const completedByUniversity = new Map<string, Set<string>>();

  for (const uniId of universityIds) {
    completedByUniversity.set(uniId, new Set());
  }

  for (const attempt of completedAttempts) {
    for (const tx of attempt.faralinTransactions) {
      const set = completedByUniversity.get(tx.universityId);
      if (set) set.add(attempt.assessmentId);
    }
    if (attempt.faralinTransactions.length === 0) {
      for (const uniId of universityIds) {
        completedByUniversity.get(uniId)?.add(attempt.assessmentId);
      }
    }
  }

  return {
    studentYearGroup: profile?.yearGroup ?? null,
    universityIds,
    completedByUniversity,
  };
}

export async function evaluateAssessmentAccessForUniversities(
  prisma: PrismaService,
  assessmentId: string,
  universityIds: string[],
  context: Awaited<ReturnType<typeof loadStudentAssessmentAccessContext>>,
): Promise<Map<string, AssessmentAccessResult>> {
  const configs = await prisma.universityAssessmentConfig.findMany({
    where: { assessmentId, universityId: { in: universityIds } },
    include: {
      unlocksAfter: { select: { id: true, slug: true, title: true } },
    },
  });

  const configByUni = Object.fromEntries(configs.map((c) => [c.universityId, c]));
  const now = new Date();
  const results = new Map<string, AssessmentAccessResult>();

  for (const uniId of universityIds) {
    const config = configByUni[uniId];
    if (!config) {
      results.set(uniId, {
        accessible: false,
        lockState: 'LOCKED',
        lockReason: 'Not offered by this university',
      });
      continue;
    }

    results.set(
      uniId,
      evaluateConfigAccess(
        config,
        {
          studentYearGroup: context.studentYearGroup,
          completedAssessmentIds: context.completedByUniversity.get(uniId) ?? new Set(),
          assessmentId,
          now,
        },
        config.unlocksAfter,
      ),
    );
  }

  return results;
}

export async function canStudentStartAssessment(
  prisma: PrismaService,
  studentProfileId: string,
  assessmentId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const context = await loadStudentAssessmentAccessContext(prisma, studentProfileId);
  if (context.universityIds.length === 0) {
    return { allowed: false, reason: 'Select at least one partner university first.' };
  }

  const accessByUni = await evaluateAssessmentAccessForUniversities(
    prisma,
    assessmentId,
    context.universityIds,
    context,
  );

  const accessible = Array.from(accessByUni.values()).some((r) => r.accessible);
  if (accessible) return { allowed: true };

  const reason =
    Array.from(accessByUni.values()).find((r) => r.lockReason)?.lockReason ??
    'This assessment is not offered by any of your selected universities.';

  return { allowed: false, reason };
}

export function aggregateLockState(
  accessByUni: Map<string, AssessmentAccessResult>,
): AssessmentLockState {
  const states = Array.from(accessByUni.values()).map((r) => r.lockState);
  if (states.some((s) => s === 'AVAILABLE')) return 'AVAILABLE';
  if (states.every((s) => s === 'COMPLETED')) return 'COMPLETED';
  return 'LOCKED';
}
