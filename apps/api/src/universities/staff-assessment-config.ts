import { AssessmentCategory, Prisma } from '@faralin/db';
import { buildAssessmentRule, getTierEconomics } from '@faralin/types';
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
}

export interface UpdateAssessmentRewardDto {
  baseAmount: number;
  scoreMultiplier?: number;
  improvementBonus?: number;
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
            }
          : {
              enabled: false,
              isCompulsory: false,
              yearGroups: [],
              availableFrom: null,
              availableTo: null,
              affectsBursaryEligibility: true,
              bonusRules: [],
            },
        reward: mapRule(rule),
      };
    }),
  }));

  return { categories };
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
          ? { enabled: config.enabled, isCompulsory: config.isCompulsory }
          : { enabled: false, isCompulsory: false },
        baseReward: rule?.baseAmount ?? track.maxFaralins,
      };
    }),
  };
}

export async function updateStaffTrackConfig(
  prisma: PrismaService,
  universityId: string,
  problemTrackId: string,
  dto: { enabled?: boolean; isCompulsory?: boolean },
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
    },
    update: {
      ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
      ...(dto.isCompulsory !== undefined ? { isCompulsory: dto.isCompulsory } : {}),
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
