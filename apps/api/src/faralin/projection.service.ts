import { Injectable } from '@nestjs/common';
import {
  calculateEstimatedAwardGbp,
  CONDITIONAL_AWARD_DISCLAIMER,
  CORE_FARALINS_PER_GBP,
  deriveUniversityBoost,
  isCampaignActiveNow,
  sumEligibleCoreFaralins,
} from '@faralin/types';
import { PrismaService } from '../prisma/prisma.service';
import { AwardAccountService } from './award-account.service';

@Injectable()
export class ProjectionService {
  constructor(
    private prisma: PrismaService,
    private awardAccountService: AwardAccountService,
  ) {}

  async recalculateForStudent(studentProfileId: string): Promise<void> {
    const now = new Date();
    const [selections, achievements, platformConfig, studentSubjects] = await Promise.all([
      this.prisma.studentUniversitySelection.findMany({
        where: { studentProfileId },
        include: {
          university: { include: { conversionRule: true } },
        },
      }),
      this.prisma.achievementEvent.findMany({
        where: {
          studentProfileId,
          verificationStatus: 'VERIFIED',
        },
        include: {
          assessmentAttempt: { select: { assessmentId: true } },
          problemTrackAttempt: { select: { problemTrackId: true } },
        },
      }),
      this.getPlatformConfig(),
      this.prisma.studentSubject.findMany({
        where: { studentProfileId },
        include: { subject: { select: { slug: true } } },
      }),
    ]);

    const studentSubjectSlugs = new Set(studentSubjects.map((s) => s.subject.slug));
    const coreFaralinsPerGbp = platformConfig.coreFaralinsPerGbp;
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
      const [assessmentConfigs, trackConfigs, campaigns] = await Promise.all([
        this.prisma.universityAssessmentConfig.findMany({
          where: { universityId, enabled: true },
        }),
        this.prisma.universityProblemTrackConfig.findMany({
          where: { universityId, enabled: true },
        }),
        this.prisma.universityCampaign.findMany({
          where: { universityId, isActive: true },
          orderBy: { updatedAt: 'desc' },
        }),
      ]);

      const enabledAssessmentIds = new Set(assessmentConfigs.map((c) => c.assessmentId));
      const enabledTrackIds = new Set(trackConfigs.map((c) => c.problemTrackId));

      const eligibleCoreFaralins = sumEligibleCoreFaralins(
        achievementInputs,
        enabledAssessmentIds,
        enabledTrackIds,
      );

      const activeCampaign = campaigns.find((campaign) => {
        if (!isCampaignActiveNow(campaign, now)) return false;
        const filters = Array.isArray(campaign.subjectFilters)
          ? (campaign.subjectFilters as string[])
          : null;
        if (!filters || filters.length === 0) return true;
        return filters.some((slug) => studentSubjectSlugs.has(slug));
      });

      // Prefer campaign economics; fall back to legacy conversion-rule bridge.
      const universityBoost = activeCampaign
        ? Number(activeCampaign.universityBoost)
        : deriveUniversityBoost(
            selection.university.slug,
            selection.university.conversionRule?.faralinsPerGbp ?? null,
            coreFaralinsPerGbp,
          );
      const subjectAlignmentBoost = activeCampaign
        ? Number(activeCampaign.subjectAlignmentBoost)
        : 1;
      const perStudentCapGbp = activeCampaign?.perStudentCapGbp
        ? Number(activeCampaign.perStudentCapGbp)
        : null;

      const estimatedAwardGbp = calculateEstimatedAwardGbp({
        eligibleCoreFaralins,
        coreFaralinsPerGbp,
        universityBoost,
        subjectAlignmentBoost,
        verificationBoost: 1,
        perStudentCapGbp,
      });

      await this.prisma.universityProjection.upsert({
        where: {
          studentProfileId_universityId: {
            studentProfileId,
            universityId,
          },
        },
        create: {
          studentProfileId,
          universityId,
          eligibleCoreFaralins,
          universityBoost,
          subjectAlignmentBoost,
          verificationBoost: 1,
          estimatedAwardGbp,
          perStudentCapGbp,
          campaignId: activeCampaign?.id ?? null,
          status: 'ESTIMATE',
          calculatedAt: new Date(),
          snapshotVersion: 1,
        },
        update: {
          eligibleCoreFaralins,
          universityBoost,
          subjectAlignmentBoost,
          verificationBoost: 1,
          estimatedAwardGbp,
          perStudentCapGbp,
          campaignId: activeCampaign?.id ?? null,
          calculatedAt: new Date(),
          snapshotVersion: { increment: 1 },
        },
      });
    }

    if (followedUniversityIds.size > 0) {
      await this.prisma.universityProjection.deleteMany({
        where: {
          studentProfileId,
          universityId: { notIn: [...followedUniversityIds] },
        },
      });
    } else {
      await this.prisma.universityProjection.deleteMany({
        where: { studentProfileId },
      });
    }

    await this.awardAccountService.syncFromProjections(studentProfileId);
  }

  async getProjectionsForStudent(studentProfileId: string) {
    const projections = await this.prisma.universityProjection.findMany({
      where: { studentProfileId },
      include: { university: true, campaign: true },
      orderBy: { estimatedAwardGbp: 'desc' },
    });

    return projections.map((p) => ({
      universityId: p.universityId,
      universityName: p.university.name,
      universitySlug: p.university.slug,
      eligibleCoreFaralins: p.eligibleCoreFaralins,
      estimatedAwardGbp: Number(p.estimatedAwardGbp),
      universityBoost: Number(p.universityBoost),
      subjectAlignmentBoost: Number(p.subjectAlignmentBoost),
      verificationBoost: Number(p.verificationBoost),
      perStudentCapGbp: p.perStudentCapGbp ? Number(p.perStudentCapGbp) : null,
      campaignId: p.campaignId,
      campaignName: p.campaign?.name ?? null,
      status: p.status as 'ESTIMATE',
      disclaimer: CONDITIONAL_AWARD_DISCLAIMER,
    }));
  }

  private async getPlatformConfig() {
    const config = await this.prisma.platformConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    return (
      config ?? {
        coreFaralinsPerGbp: CORE_FARALINS_PER_GBP,
        maxFollowedUniversities: 10,
        maxFaralinActiveUniversities: 5,
        maxOfferStageUniversities: 2,
        maxConvertedAwards: 1,
      }
    );
  }
}
