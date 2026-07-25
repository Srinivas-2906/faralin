import { AssessmentCategory, Prisma } from '@faralin/db';
import { buildAssessmentRule, getTierEconomics, type AssessmentSeriesGroup } from '@faralin/types';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildAssessmentBreakdown } from './staff-analytics';

export const ASSESSMENT_CATEGORY_LABELS: Record<AssessmentCategory, string> = {
  EMPLOYABILITY: 'Employability',
  ACADEMIC_SKILLS: 'Academic Skills',
  FINANCIAL_WELLBEING: 'Financial Wellbeing',
  MENTAL_WELLBEING: 'Mental Wellbeing',
  DIGITAL_SKILLS: 'Digital Skills',
  SUSTAINABILITY: 'Sustainability',
  DIVERSITY_INCLUSION: 'Diversity & Inclusion',
  STUDENT_LIFE: 'Student Life',
  ACADEMIC_SUBJECT: 'Academic Subject',
};

export type BonusRuleType = 'SCORE_ABOVE' | 'PERFECT_SCORE' | 'FIRST_ATTEMPT';

export interface BonusRule {
  type: BonusRuleType;
  threshold?: number;
  amount: number;
}

export interface UpdateAssessmentConfigDto {
  enabled?: boolean;
  isCompulsory?: boolean;
  yearGroups?: number[];
  availableFrom?: string | null;
  availableTo?: string | null;
  affectsBursaryEligibility?: boolean;
  bonusRules?: BonusRule[] | null;
  unlocksAfterAssessmentId?: string | null;
}

export interface UpdateAssessmentRewardDto {
  baseAmount: number;
  scoreMultiplier?: number;
  improvementBonus?: number;
}

export interface UpdateTrackRewardDto {
  scoreMultiplier: number;
}

export interface UpdateTrackConfigDto {
  enabled?: boolean;
  isCompulsory?: boolean;
  affectsBursaryEligibility?: boolean;
  bonusRules?: BonusRule[] | null;
}

function mapRule(rule: {
  baseAmount: number;
  scoreMultiplier: Prisma.Decimal;
  improvementBonus: number;
} | null) {
  if (!rule) return null;
  return {
    baseAmount: rule.baseAmount,
    scoreMultiplier: Number(rule.scoreMultiplier),
    improvementBonus: rule.improvementBonus,
  };
}

export async function buildStaffAssessmentLibrary(prisma: PrismaService, universityId: string) {
  const [assessments, configs, rules] = await Promise.all([
    prisma.assessment.findMany({
      where: { isActive: true },
      include: { subject: true },
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
    }),
    prisma.universityAssessmentConfig.findMany({ where: { universityId } }),
    prisma.faralinRule.findMany({
      where: { universityId, assessmentId: { not: null }, isActive: true },
    }),
  ]);

  const configByAssessment = Object.fromEntries(configs.map((c) => [c.assessmentId, c]));
  const ruleByAssessment = Object.fromEntries(
    rules.filter((r) => r.assessmentId).map((r) => [r.assessmentId!, r]),
  );

  const byCategory: Record<string, typeof assessments> = {};
  for (const assessment of assessments) {
    const key = assessment.category;
    if (!byCategory[key]) byCategory[key] = [];
    byCategory[key].push(assessment);
  }

  const categories = Object.entries(byCategory).map(([category, items]) => ({
    category,
    label: ASSESSMENT_CATEGORY_LABELS[category as AssessmentCategory] ?? category,
    assessments: items.map((assessment) => {
      const config = configByAssessment[assessment.id];
      const rule = ruleByAssessment[assessment.id];
      return {
        id: assessment.id,
        slug: assessment.slug,
        title: assessment.title,
        description: assessment.description,
        category: assessment.category,
        subjectName: assessment.subject.name,
        difficulty: assessment.difficulty,
        trustLevel: assessment.trustLevel,
        estimatedFaralinMin: assessment.estimatedFaralinMin,
        estimatedFaralinMax: assessment.estimatedFaralinMax,
        config: config
          ? {
              enabled: config.enabled,
              isCompulsory: config.isCompulsory,
              yearGroups: config.yearGroups,
              availableFrom: config.availableFrom?.toISOString() ?? null,
              availableTo: config.availableTo?.toISOString() ?? null,
              affectsBursaryEligibility: config.affectsBursaryEligibility,
              bonusRules: (config.bonusRules as BonusRule[] | null) ?? [],
              unlocksAfterAssessmentId: config.unlocksAfterAssessmentId,
              unlocksAfterTitle: config.unlocksAfterAssessmentId
                ? assessments.find((a) => a.id === config.unlocksAfterAssessmentId)?.title ?? null
                : null,
            }
          : {
              enabled: false,
              isCompulsory: false,
              yearGroups: [],
              availableFrom: null,
              availableTo: null,
              affectsBursaryEligibility: true,
              bonusRules: [],
              unlocksAfterAssessmentId: null,
              unlocksAfterTitle: null,
            },
        reward: mapRule(rule),
        seriesSlug: assessment.seriesSlug,
        levelOrder: assessment.levelOrder,
        levelLabel: assessment.levelOrder != null ? `Level ${assessment.levelOrder}` : null,
      };
    }),
  }));

  return { categories };
}

export async function buildStaffAssessmentSeries(
  prisma: PrismaService,
  universityId: string,
): Promise<{ series: AssessmentSeriesGroup[] }> {
  const assessments = await prisma.assessment.findMany({
    where: { isActive: true, seriesSlug: { not: null }, levelOrder: { not: null } },
    orderBy: [{ seriesSlug: 'asc' }, { levelOrder: 'asc' }],
  });
  const configs = await prisma.universityAssessmentConfig.findMany({
    where: { universityId, assessmentId: { in: assessments.map((a) => a.id) } },
  });
  const configByAssessment = Object.fromEntries(configs.map((c) => [c.assessmentId, c]));

  const bySeries = new Map<string, AssessmentSeriesGroup>();
  for (const assessment of assessments) {
    if (!assessment.seriesSlug || assessment.levelOrder == null) continue;
    const existing = bySeries.get(assessment.seriesSlug) ?? {
      seriesSlug: assessment.seriesSlug,
      title: assessment.title.replace(/ — .+$/, ''),
      levels: [],
    };
    const config = configByAssessment[assessment.id];
    existing.levels.push({
      id: assessment.id,
      slug: assessment.slug,
      title: assessment.title,
      levelOrder: assessment.levelOrder,
      levelLabel: `Level ${assessment.levelOrder}`,
      enabled: config?.enabled ?? false,
      unlocksAfterAssessmentId: config?.unlocksAfterAssessmentId ?? null,
    });
    bySeries.set(assessment.seriesSlug, existing);
  }

  return {
    series: Array.from(bySeries.values()).map((s) => ({
      ...s,
      levels: s.levels.sort((a, b) => a.levelOrder - b.levelOrder),
    })),
  };
}

export async function updateStaffAssessmentConfig(
  prisma: PrismaService,
  universityId: string,
  assessmentId: string,
  dto: UpdateAssessmentConfigDto,
) {
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) throw new NotFoundException('Assessment not found');

  const data: Prisma.UniversityAssessmentConfigUpdateInput = {};
  if (dto.enabled !== undefined) data.enabled = dto.enabled;
  if (dto.isCompulsory !== undefined) data.isCompulsory = dto.isCompulsory;
  if (dto.yearGroups !== undefined) data.yearGroups = dto.yearGroups;
  if (dto.availableFrom !== undefined) {
    data.availableFrom = dto.availableFrom ? new Date(dto.availableFrom) : null;
  }
  if (dto.availableTo !== undefined) {
    data.availableTo = dto.availableTo ? new Date(dto.availableTo) : null;
  }
  if (dto.affectsBursaryEligibility !== undefined) {
    data.affectsBursaryEligibility = dto.affectsBursaryEligibility;
  }
  if (dto.bonusRules !== undefined) {
    data.bonusRules =
      dto.bonusRules === null
        ? Prisma.JsonNull
        : (dto.bonusRules as unknown as Prisma.InputJsonValue);
  }
  if (dto.unlocksAfterAssessmentId !== undefined) {
    data.unlocksAfter = dto.unlocksAfterAssessmentId
      ? { connect: { id: dto.unlocksAfterAssessmentId } }
      : { disconnect: true };
  }

  return prisma.universityAssessmentConfig.upsert({
    where: { universityId_assessmentId: { universityId, assessmentId } },
    create: {
      universityId,
      assessmentId,
      enabled: dto.enabled ?? false,
      isCompulsory: dto.isCompulsory ?? false,
      yearGroups: dto.yearGroups ?? [],
      availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
      availableTo: dto.availableTo ? new Date(dto.availableTo) : null,
      affectsBursaryEligibility: dto.affectsBursaryEligibility ?? true,
      unlocksAfterAssessmentId: dto.unlocksAfterAssessmentId ?? null,
      bonusRules:
        dto.bonusRules != null
          ? (dto.bonusRules as unknown as Prisma.InputJsonValue)
          : undefined,
    },
    update: data,
  });
}

export async function updateStaffAssessmentReward(
  prisma: PrismaService,
  universityId: string,
  assessmentId: string,
  dto: UpdateAssessmentRewardDto,
) {
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) throw new NotFoundException('Assessment not found');

  const existing = await prisma.faralinRule.findFirst({
    where: {
      universityId,
      assessmentId,
      subjectId: null,
      problemTrackId: null,
    },
  });

  if (existing) {
    return prisma.faralinRule.update({
      where: { id: existing.id },
      data: {
        baseAmount: dto.baseAmount,
        scoreMultiplier: dto.scoreMultiplier ?? existing.scoreMultiplier,
        improvementBonus: dto.improvementBonus ?? existing.improvementBonus,
        isActive: true,
      },
    });
  }

  const university = await prisma.university.findUnique({ where: { id: universityId } });
  const defaults = university ? buildAssessmentRule(getTierEconomics(university.slug)) : {
    baseAmount: dto.baseAmount,
    scoreMultiplier: 1,
    improvementBonus: 0,
    difficultyMultiplier: 1,
  };

  return prisma.faralinRule.create({
    data: {
      universityId,
      assessmentId,
      baseAmount: dto.baseAmount,
      scoreMultiplier: dto.scoreMultiplier ?? defaults.scoreMultiplier,
      improvementBonus: dto.improvementBonus ?? defaults.improvementBonus,
      difficultyMultiplier: defaults.difficultyMultiplier,
    },
  });
}

export async function buildStaffActiveAssessments(
  prisma: PrismaService,
  universityId: string,
  followerStudentIds: string[],
) {
  const enabledConfigs = await prisma.universityAssessmentConfig.findMany({
    where: { universityId, enabled: true },
    include: {
      assessment: { include: { subject: true } },
    },
    orderBy: { assessment: { title: 'asc' } },
  });

  const enabledAssessmentIds = enabledConfigs.map((c) => c.assessmentId);
  const rules = await prisma.faralinRule.findMany({
    where: { universityId, assessmentId: { in: enabledAssessmentIds }, isActive: true },
  });
  const ruleByAssessment = Object.fromEntries(
    rules.filter((r) => r.assessmentId).map((r) => [r.assessmentId!, r]),
  );

  const analytics = await buildAssessmentBreakdown(
    prisma,
    universityId,
    followerStudentIds,
    enabledAssessmentIds,
  );

  const analyticsBySlug = Object.fromEntries(analytics.breakdown.map((row) => [row.slug, row]));

  return {
    assigned: followerStudentIds.length,
    assessments: enabledConfigs.map((config) => {
      const assessment = config.assessment;
      const stats = analyticsBySlug[assessment.slug];
      const rule = ruleByAssessment[assessment.id];
      return {
        id: assessment.id,
        slug: assessment.slug,
        title: assessment.title,
        category: assessment.category,
        categoryLabel: ASSESSMENT_CATEGORY_LABELS[assessment.category],
        subjectName: assessment.subject.name,
        isCompulsory: config.isCompulsory,
        levelOrder: assessment.levelOrder,
        levelLabel: assessment.levelOrder != null ? `Level ${assessment.levelOrder}` : null,
        seriesSlug: assessment.seriesSlug,
        unlocksAfterAssessmentId: config.unlocksAfterAssessmentId,
        baseReward: rule?.baseAmount ?? null,
        studentsCompleted: stats?.studentsCompleted ?? 0,
        completionRate: stats?.completionRate ?? 0,
        averageScorePercent: stats?.averageScorePercent ?? null,
        averageFaralins: stats?.averageFaralins ?? 0,
        averageTimeMinutes: stats?.averageTimeMinutes ?? null,
      };
    }),
    summary: analytics.summary,
  };
}

export async function buildStaffTrackLibrary(prisma: PrismaService, universityId: string) {
  const [tracks, configs, rules] = await Promise.all([
    prisma.problemTrack.findMany({
      where: { isActive: true },
      include: { subject: true },
      orderBy: { title: 'asc' },
    }),
    prisma.universityProblemTrackConfig.findMany({ where: { universityId } }),
    prisma.faralinRule.findMany({
      where: { universityId, problemTrackId: { not: null }, isActive: true },
    }),
  ]);

  const configByTrack = Object.fromEntries(configs.map((c) => [c.problemTrackId, c]));
  const ruleByTrack = Object.fromEntries(
    rules.filter((r) => r.problemTrackId).map((r) => [r.problemTrackId!, r]),
  );

  return {
    tracks: tracks.map((track) => {
      const config = configByTrack[track.id];
      const rule = ruleByTrack[track.id];
      return {
        id: track.id,
        slug: track.slug,
        title: track.title,
        subtitle: track.subtitle,
        subjectName: track.subject.name,
        difficultyBand: track.difficultyBand,
        maxFaralins: track.maxFaralins,
        config: config
          ? {
              enabled: config.enabled,
              isCompulsory: config.isCompulsory,
              affectsBursaryEligibility: config.affectsBursaryEligibility,
              bonusRules: (config.bonusRules as BonusRule[] | null) ?? [],
            }
          : {
              enabled: false,
              isCompulsory: false,
              affectsBursaryEligibility: true,
              bonusRules: [],
            },
        reward: rule
          ? { scoreMultiplier: Number(rule.scoreMultiplier) }
          : { scoreMultiplier: 1 },
        baseReward: rule?.baseAmount ?? track.maxFaralins,
      };
    }),
  };
}

export async function updateStaffTrackConfig(
  prisma: PrismaService,
  universityId: string,
  problemTrackId: string,
  dto: UpdateTrackConfigDto,
) {
  const track = await prisma.problemTrack.findUnique({ where: { id: problemTrackId } });
  if (!track) throw new NotFoundException('Problem track not found');

  return prisma.universityProblemTrackConfig.upsert({
    where: { universityId_problemTrackId: { universityId, problemTrackId } },
    create: {
      universityId,
      problemTrackId,
      enabled: dto.enabled ?? false,
      isCompulsory: dto.isCompulsory ?? false,
      affectsBursaryEligibility: dto.affectsBursaryEligibility ?? true,
      bonusRules:
        dto.bonusRules != null ? (dto.bonusRules as unknown as Prisma.InputJsonValue) : undefined,
    },
    update: {
      ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
      ...(dto.isCompulsory !== undefined ? { isCompulsory: dto.isCompulsory } : {}),
      ...(dto.affectsBursaryEligibility !== undefined
        ? { affectsBursaryEligibility: dto.affectsBursaryEligibility }
        : {}),
      ...(dto.bonusRules !== undefined
        ? { bonusRules: dto.bonusRules as unknown as Prisma.InputJsonValue }
        : {}),
    },
  });
}

export async function updateStaffTrackReward(
  prisma: PrismaService,
  universityId: string,
  problemTrackId: string,
  dto: UpdateTrackRewardDto,
) {
  const track = await prisma.problemTrack.findUnique({ where: { id: problemTrackId } });
  if (!track) throw new NotFoundException('Problem track not found');

  const existing = await prisma.faralinRule.findFirst({
    where: {
      universityId,
      problemTrackId,
      assessmentId: null,
      subjectId: null,
    },
  });

  if (existing) {
    return prisma.faralinRule.update({
      where: { id: existing.id },
      data: {
        scoreMultiplier: dto.scoreMultiplier,
        isActive: true,
      },
    });
  }

  return prisma.faralinRule.create({
    data: {
      universityId,
      problemTrackId,
      baseAmount: track.maxFaralins,
      scoreMultiplier: dto.scoreMultiplier,
    },
  });
}

export async function getStudentEnabledUniversityIds(
  prisma: PrismaService,
  studentProfileId: string,
): Promise<string[]> {
  const selections = await prisma.studentUniversitySelection.findMany({
    where: { studentProfileId },
    select: { universityId: true },
  });
  return selections.map((s) => s.universityId);
}

export async function isAssessmentEnabledForStudent(
  prisma: PrismaService,
  studentProfileId: string,
  assessmentId: string,
): Promise<boolean> {
  const universityIds = await getStudentEnabledUniversityIds(prisma, studentProfileId);
  if (universityIds.length === 0) return false;

  const count = await prisma.universityAssessmentConfig.count({
    where: {
      assessmentId,
      universityId: { in: universityIds },
      enabled: true,
    },
  });
  return count > 0;
}

export async function isTrackEnabledForStudent(
  prisma: PrismaService,
  studentProfileId: string,
  problemTrackId: string,
): Promise<boolean> {
  const universityIds = await getStudentEnabledUniversityIds(prisma, studentProfileId);
  if (universityIds.length === 0) return false;

  const count = await prisma.universityProblemTrackConfig.count({
    where: {
      problemTrackId,
      universityId: { in: universityIds },
      enabled: true,
    },
  });
  return count > 0;
}
