import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { estimateTypicalAssessmentFaralins, getTierEconomics } from '@faralin/types';
import type { CreateCampaignInput } from '@faralin/types';
import { CampaignService } from '../faralin/campaign.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildStaffStudentRoster,
  buildSubjectInterests,
} from './staff-roster';
import {
  buildStaffActiveAssessments,
  buildStaffAssessmentLibrary,
  buildStaffAssessmentSeries,
  buildStaffTrackLibrary,
  updateStaffAssessmentConfig,
  updateStaffAssessmentReward,
  updateStaffTrackConfig,
  updateStaffTrackReward,
  type BonusRule,
  type UpdateAssessmentConfigDto,
  type UpdateAssessmentRewardDto,
  type UpdateTrackConfigDto,
  type UpdateTrackRewardDto,
} from './staff-assessment-config';
import {
  buildHearExportCsv,
  buildStaffJourneyLibrary,
  buildStaffLeaderboardConfig,
  buildStaffRecognitionTiers,
  updateStaffJourneyConfig,
  updateStaffLeaderboardConfig,
  updateStaffRecognitionTiers,
} from './staff-phase2-config';
import {
  buildAssessmentBreakdown,
  buildEngagementMetrics,
  buildFaralinDistribution,
  buildStaffStudentDetail,
} from './staff-analytics';

@Injectable()
export class UniversitiesService {
  constructor(
    private prisma: PrismaService,
    private campaigns: CampaignService,
  ) {}

  async getPublicUniversity(slug: string) {
    const university = await this.prisma.university.findUnique({
      where: { slug },
      include: {
        conversionRule: true,
        articles: {
          where: { isPublished: true },
          orderBy: { publishedAt: 'desc' },
          take: 10,
        },
        events: {
          where: { isPublished: true, startsAt: { gte: new Date() } },
          orderBy: { startsAt: 'asc' },
          take: 10,
        },
      },
    });

    if (!university || !university.isActive) {
      throw new NotFoundException('University not found');
    }

    const activeCampaign = await this.campaigns.getActiveCampaignBoost(university.id);

    // Prestige tiers remain discovery labels only; prefer campaign economics when present.
    let exampleEarnRange: { min: number; max: number } | null = null;
    if (activeCampaign) {
      const base = 10000;
      exampleEarnRange = {
        min: Math.round((base * activeCampaign.universityBoost) / 100),
        max: Math.round((base * 1.5 * activeCampaign.universityBoost) / 100),
      };
    } else {
      try {
        /** @deprecated payment formula — use UniversityCampaign when available */
        exampleEarnRange = estimateTypicalAssessmentFaralins(getTierEconomics(slug));
      } catch {
        exampleEarnRange = null;
      }
    }

    return {
      ...university,
      exampleEarnRange,
      activeCampaign,
      prestigeTierLabel: university.prestigeTier,
    };
  }

  listStaffCampaigns(universityId: string) {
    return this.campaigns.listForUniversity(universityId);
  }

  createStaffCampaign(universityId: string, body: CreateCampaignInput) {
    return this.campaigns.create(universityId, body);
  }

  updateStaffCampaign(
    universityId: string,
    campaignId: string,
    body: Partial<CreateCampaignInput> & { isActive?: boolean },
  ) {
    return this.campaigns.update(universityId, campaignId, body);
  }

  deactivateStaffCampaign(universityId: string, campaignId: string) {
    return this.campaigns.deactivate(universityId, campaignId);
  }

  async getStaffMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        universityStaffProfile: { include: { university: true } },
      },
    });

    if (!user?.universityStaffProfile?.university) {
      throw new NotFoundException('University staff profile not found');
    }

    const { university } = user.universityStaffProfile;
    return {
      university: {
        id: university.id,
        name: university.name,
        slug: university.slug,
        logoUrl: university.logoUrl,
        shortName: university.shortName,
      },
      staff: {
        email: user.email,
        jobTitle: user.universityStaffProfile.jobTitle,
      },
    };
  }

  async getStaffStudents(universityId: string) {
    const university = await this.prisma.university.findUnique({
      where: { id: universityId },
    });
    if (!university) throw new NotFoundException('University not found');

    const students = await buildStaffStudentRoster(this.prisma, universityId);
    return { university, students };
  }

  async getStaffDashboard(universityId: string) {
    const university = await this.prisma.university.findUnique({
      where: { id: universityId },
      include: { conversionRule: true },
    });

    if (!university) throw new NotFoundException('University not found');

    const [applications, eventRegistrations, articles, events, students] =
      await Promise.all([
        this.prisma.application.findMany({ where: { universityId } }),
        this.prisma.eventRegistration.count({
          where: { event: { universityId } },
        }),
        this.prisma.article.count({ where: { universityId, isPublished: true } }),
        this.prisma.event.count({ where: { universityId, isPublished: true } }),
        buildStaffStudentRoster(this.prisma, universityId),
      ]);

    const followerCount = students.length;

    const funnel = {
      followers: followerCount,
      referralClicked: applications.filter((a) => a.status !== 'FOLLOWER').length,
      applied: applications.filter((a) =>
        ['APPLIED', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'FIRM', 'INSURANCE', 'ENROLLED'].includes(
          a.status,
        ),
      ).length,
      offerReceived: applications.filter((a) =>
        ['OFFER_RECEIVED', 'OFFER_ACCEPTED', 'FIRM', 'INSURANCE', 'ENROLLED'].includes(a.status),
      ).length,
      offerAccepted: applications.filter((a) =>
        ['OFFER_ACCEPTED', 'FIRM', 'INSURANCE', 'ENROLLED'].includes(a.status),
      ).length,
      enrolled: applications.filter((a) => a.status === 'ENROLLED').length,
      faralinActive: applications.filter((a) => a.status === 'FARALIN_ACTIVE').length,
      firm: applications.filter((a) => a.status === 'FIRM').length,
      insurance: applications.filter((a) => a.status === 'INSURANCE').length,
    };

    const subjectInterests = buildSubjectInterests(students);

    const followerStudentIds = students.map((s) => s.studentProfileId);

    const enabledConfigs = await this.prisma.universityAssessmentConfig.findMany({
      where: { universityId, enabled: true },
      select: { assessmentId: true },
    });
    const enabledAssessmentIds = enabledConfigs.map((c) => c.assessmentId);

    const [faralinDistribution, assessmentAnalytics, engagement] = await Promise.all([
      buildFaralinDistribution(
        this.prisma,
        universityId,
        university.conversionRule,
        followerCount,
      ),
      buildAssessmentBreakdown(
        this.prisma,
        universityId,
        followerStudentIds,
        enabledAssessmentIds,
      ),
      buildEngagementMetrics(this.prisma, universityId, followerStudentIds),
    ]);

    const estimatedFutureBursaryGbp = faralinDistribution.outstandingLiabilityGbp;

    const topPerformers = [...students]
      .sort((a, b) => b.totalFaralins - a.totalFaralins)
      .slice(0, 10)
      .map(({ anonymousId, totalFaralins, performanceBand }) => ({
        anonymousId,
        totalFaralins,
        performanceBand,
      }));

    return {
      university,
      funnel,
      followerCount,
      subjectInterests,
      topPerformers,
      eventRegistrations,
      contentEngagement: { articles, events },
      estimatedFutureBursaryGbp,
      faralinDistribution,
      engagement,
      assessmentSummary: assessmentAnalytics.summary,
      assessmentBreakdown: assessmentAnalytics.breakdown,
      students: students.slice(0, 50),
    };
  }

  async getStaffStudentDetail(universityId: string, anonymousId: string) {
    const university = await this.prisma.university.findUnique({
      where: { id: universityId },
      include: { conversionRule: true },
    });
    if (!university) throw new NotFoundException('University not found');

    const detail = await buildStaffStudentDetail(
      this.prisma,
      universityId,
      anonymousId,
      university.conversionRule,
    );
    if (!detail) throw new NotFoundException('Student not found or not following this university');

    return { university, ...detail };
  }

  getStaffAssessmentLibrary(universityId: string) {
    return buildStaffAssessmentLibrary(this.prisma, universityId);
  }

  getStaffAssessmentSeries(universityId: string) {
    return buildStaffAssessmentSeries(this.prisma, universityId);
  }

  async getStaffActiveAssessments(universityId: string) {
    const students = await buildStaffStudentRoster(this.prisma, universityId);
    const followerStudentIds = students.map((s) => s.studentProfileId);
    return buildStaffActiveAssessments(this.prisma, universityId, followerStudentIds);
  }

  patchStaffAssessmentConfig(
    universityId: string,
    assessmentId: string,
    dto: UpdateAssessmentConfigDto,
  ) {
    return updateStaffAssessmentConfig(this.prisma, universityId, assessmentId, dto);
  }

  patchStaffAssessmentReward(
    universityId: string,
    assessmentId: string,
    dto: UpdateAssessmentRewardDto,
  ) {
    return updateStaffAssessmentReward(this.prisma, universityId, assessmentId, dto);
  }

  getStaffTrackLibrary(universityId: string) {
    return buildStaffTrackLibrary(this.prisma, universityId);
  }

  patchStaffTrackConfig(
    universityId: string,
    problemTrackId: string,
    dto: UpdateTrackConfigDto,
  ) {
    return updateStaffTrackConfig(this.prisma, universityId, problemTrackId, dto);
  }

  patchStaffTrackReward(
    universityId: string,
    problemTrackId: string,
    dto: UpdateTrackRewardDto,
  ) {
    return updateStaffTrackReward(this.prisma, universityId, problemTrackId, dto);
  }

  getStaffJourneyLibrary(universityId: string) {
    return buildStaffJourneyLibrary(this.prisma, universityId);
  }

  patchStaffJourneyConfig(
    universityId: string,
    journeyId: string,
    dto: { enabled?: boolean; bonusRules?: unknown },
  ) {
    return updateStaffJourneyConfig(this.prisma, universityId, journeyId, dto);
  }

  getStaffRecognitionTiers(universityId: string) {
    return buildStaffRecognitionTiers(this.prisma, universityId);
  }

  patchStaffRecognitionTiers(
    universityId: string,
    tiers: Array<{ tier: string; minVerifiedFaralins: number; benefitsSummary?: string | null }>,
  ) {
    return updateStaffRecognitionTiers(this.prisma, universityId, tiers);
  }

  getStaffLeaderboardConfig(universityId: string) {
    return buildStaffLeaderboardConfig(this.prisma, universityId);
  }

  patchStaffLeaderboardConfig(
    universityId: string,
    dto: { enabled?: boolean; scope?: string; optInRequired?: boolean },
  ) {
    return updateStaffLeaderboardConfig(this.prisma, universityId, dto);
  }

  getStaffHearExport(universityId: string) {
    return buildHearExportCsv(this.prisma, universityId);
  }

  async getPublicLeaderboard(universitySlug: string) {
    const university = await this.prisma.university.findUnique({ where: { slug: universitySlug } });
    if (!university) throw new NotFoundException('University not found');

    const config = await this.prisma.universityLeaderboardConfig.findUnique({
      where: { universityId: university.id },
    });
    if (!config?.enabled) return { enabled: false, entries: [] };

    const followers = await this.prisma.application.findMany({
      where: { universityId: university.id, status: 'FOLLOWER' },
      include: {
        studentProfile: {
          select: {
            anonymousId: true,
            leaderboardOptIn: true,
            faralinTransactions: {
              where: {
                universityId: university.id,
                status: { in: ['CONDITIONAL', 'CONFIRMED', 'CONVERTED'] },
              },
            },
          },
        },
      },
    });

    const entries = followers
      .filter((f) => !config.optInRequired || f.studentProfile.leaderboardOptIn)
      .map((f) => ({
        anonymousId: f.studentProfile.anonymousId.slice(0, 8),
        verifiedFaralins: f.studentProfile.faralinTransactions
          .filter((tx) => tx.trustLevel !== 'PRACTICE')
          .reduce((sum, tx) => sum + tx.amount, 0),
      }))
      .sort((a, b) => b.verifiedFaralins - a.verifiedFaralins)
      .slice(0, 20);

    return { enabled: true, entries };
  }

  requireUniversityAccess(userUniversityId: string | undefined, targetUniversityId: string) {
    if (userUniversityId !== targetUniversityId) {
      throw new ForbiddenException('Cannot access another university dashboard');
    }
  }
}
