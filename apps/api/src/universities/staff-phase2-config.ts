import { Prisma, StudentRecognitionTier } from '@faralin/db';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JourneyMilestone } from '@faralin/types';
import { computeRecognitionTier } from './recognition-tiers';

const DEFAULT_RECOGNITION_TIER_THRESHOLDS = [
  { tier: 'EXPLORER' as const, minVerifiedFaralins: 0, benefitsSummary: 'Starting your recognition journey' },
  { tier: 'BUILDER' as const, minVerifiedFaralins: 500, benefitsSummary: 'Consistent verified activity' },
  { tier: 'ACHIEVER' as const, minVerifiedFaralins: 1500, benefitsSummary: 'Strong portfolio of verified work' },
  { tier: 'CHAMPION' as const, minVerifiedFaralins: 3000, benefitsSummary: 'Outstanding verified recognition' },
];

export async function buildStaffJourneyLibrary(prisma: PrismaService, universityId: string) {
  const [journeys, configs] = await Promise.all([
    prisma.problemTrackJourney.findMany({
      where: { isActive: true },
      orderBy: { title: 'asc' },
    }),
    prisma.universityProblemTrackJourneyConfig.findMany({ where: { universityId } }),
  ]);

  const configByJourney = Object.fromEntries(configs.map((c) => [c.journeyId, c]));

  return {
    journeys: journeys.map((journey) => {
      const config = configByJourney[journey.id];
      return {
        id: journey.id,
        slug: journey.slug,
        title: journey.title,
        description: journey.description,
        milestones: journey.milestones as unknown as JourneyMilestone[],
        config: config
          ? { enabled: config.enabled, bonusRules: config.bonusRules }
          : { enabled: false, bonusRules: null },
      };
    }),
  };
}

export async function updateStaffJourneyConfig(
  prisma: PrismaService,
  universityId: string,
  journeyId: string,
  dto: { enabled?: boolean; bonusRules?: unknown },
) {
  const journey = await prisma.problemTrackJourney.findUnique({ where: { id: journeyId } });
  if (!journey) throw new NotFoundException('Journey not found');

  return prisma.universityProblemTrackJourneyConfig.upsert({
    where: { universityId_journeyId: { universityId, journeyId } },
    create: {
      universityId,
      journeyId,
      enabled: dto.enabled ?? false,
      bonusRules:
        dto.bonusRules != null ? (dto.bonusRules as Prisma.InputJsonValue) : undefined,
    },
    update: {
      ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
      ...(dto.bonusRules !== undefined
        ? { bonusRules: dto.bonusRules as Prisma.InputJsonValue }
        : {}),
    },
  });
}

export async function buildStaffRecognitionTiers(prisma: PrismaService, universityId: string) {
  const configs = await prisma.universityRecognitionTierConfig.findMany({
    where: { universityId },
    orderBy: { minVerifiedFaralins: 'asc' },
  });

  if (configs.length === 0) {
    return {
      tiers: DEFAULT_RECOGNITION_TIER_THRESHOLDS.map((t) => ({
        tier: t.tier,
        minVerifiedFaralins: t.minVerifiedFaralins,
        benefitsSummary: t.benefitsSummary,
      })),
    };
  }

  return {
    tiers: configs.map((c) => ({
      tier: c.tier,
      minVerifiedFaralins: c.minVerifiedFaralins,
      benefitsSummary: c.benefitsSummary,
    })),
  };
}

export async function updateStaffRecognitionTiers(
  prisma: PrismaService,
  universityId: string,
  tiers: Array<{ tier: string; minVerifiedFaralins: number; benefitsSummary?: string | null }>,
) {
  await prisma.$transaction(
    tiers.map((t) =>
      prisma.universityRecognitionTierConfig.upsert({
        where: {
          universityId_tier: { universityId, tier: t.tier as never },
        },
        create: {
          universityId,
          tier: t.tier as never,
          minVerifiedFaralins: t.minVerifiedFaralins,
          benefitsSummary: t.benefitsSummary ?? null,
        },
        update: {
          minVerifiedFaralins: t.minVerifiedFaralins,
          benefitsSummary: t.benefitsSummary ?? null,
        },
      }),
    ),
  );

  return buildStaffRecognitionTiers(prisma, universityId);
}

export async function buildStaffLeaderboardConfig(prisma: PrismaService, universityId: string) {
  const config = await prisma.universityLeaderboardConfig.findUnique({ where: { universityId } });
  return {
    enabled: config?.enabled ?? false,
    scope: config?.scope ?? 'VERIFIED_FARALINS',
    optInRequired: config?.optInRequired ?? true,
  };
}

export async function updateStaffLeaderboardConfig(
  prisma: PrismaService,
  universityId: string,
  dto: { enabled?: boolean; scope?: string; optInRequired?: boolean },
) {
  return prisma.universityLeaderboardConfig.upsert({
    where: { universityId },
    create: {
      universityId,
      enabled: dto.enabled ?? false,
      scope: dto.scope ?? 'VERIFIED_FARALINS',
      optInRequired: dto.optInRequired ?? true,
    },
    update: {
      ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
      ...(dto.scope !== undefined ? { scope: dto.scope } : {}),
      ...(dto.optInRequired !== undefined ? { optInRequired: dto.optInRequired } : {}),
    },
  });
}

export async function buildHearExportCsv(prisma: PrismaService, universityId: string) {
  const followers = await prisma.application.findMany({
    where: { universityId, status: 'FOLLOWER' },
    include: {
      studentProfile: {
        include: {
          faralinTransactions: {
            where: { universityId, status: { in: ['CONDITIONAL', 'CONFIRMED', 'CONVERTED'] } },
            include: {
              assessmentAttempt: { select: { assessmentId: true } },
              problemTrackAttempt: { select: { problemTrackId: true } },
            },
          },
          assessmentAttempts: {
            where: { completedAt: { not: null }, isVoided: false },
            select: { assessmentId: true },
          },
        },
      },
    },
  });

  const assessmentConfigs = await prisma.universityAssessmentConfig.findMany({
    where: { universityId },
  });
  const trackConfigs = await prisma.universityProblemTrackConfig.findMany({
    where: { universityId },
  });
  const assessmentHear = Object.fromEntries(
    assessmentConfigs.map((c) => [c.assessmentId, c.affectsBursaryEligibility]),
  );
  const trackHear = Object.fromEntries(
    trackConfigs.map((c) => [c.problemTrackId, c.affectsBursaryEligibility]),
  );
  const compulsoryAssessments = new Set(
    assessmentConfigs.filter((c) => c.isCompulsory && c.enabled).map((c) => c.assessmentId),
  );

  const tierConfigs = await prisma.universityRecognitionTierConfig.findMany({
    where: { universityId },
  });

  const rows: string[] = [
    'anonymousId,verifiedFaralins,hearEligibleFaralins,recognitionTier,compulsoryCompleted,compulsoryTotal',
  ];

  for (const app of followers) {
    const profile = app.studentProfile;
    let verifiedFaralins = 0;
    let hearEligibleFaralins = 0;

    for (const tx of profile.faralinTransactions) {
      if (tx.trustLevel === 'PRACTICE') continue;
      verifiedFaralins += tx.amount;

      let hearEligible = true;
      if (tx.assessmentAttempt?.assessmentId) {
        hearEligible = assessmentHear[tx.assessmentAttempt.assessmentId] ?? true;
      } else if (tx.problemTrackAttempt?.problemTrackId) {
        hearEligible = trackHear[tx.problemTrackAttempt.problemTrackId] ?? true;
      }
      if (hearEligible) hearEligibleFaralins += tx.amount;
    }

    const tier = computeRecognitionTier(
      verifiedFaralins,
      tierConfigs.map((c) => ({
        tier: c.tier,
        minVerifiedFaralins: c.minVerifiedFaralins,
        benefitsSummary: c.benefitsSummary,
      })),
    );

    const completedCompulsory = profile.assessmentAttempts.filter((a) =>
      compulsoryAssessments.has(a.assessmentId),
    ).length;

    rows.push(
      [
        profile.anonymousId,
        verifiedFaralins,
        hearEligibleFaralins,
        tier.currentTier,
        completedCompulsory,
        compulsoryAssessments.size,
      ].join(','),
    );
  }

  return rows.join('\n');
}
