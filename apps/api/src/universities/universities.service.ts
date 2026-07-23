import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { estimateTypicalAssessmentFaralins, getTierEconomics } from '@faralin/types';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildStaffStudentRoster,
  buildSubjectInterests,
} from './staff-roster';
import {
  buildStaffActiveAssessments,
  buildStaffAssessmentLibrary,
  buildStaffTrackLibrary,
  updateStaffAssessmentConfig,
  updateStaffAssessmentReward,
  updateStaffTrackConfig,
  type UpdateAssessmentConfigDto,
  type UpdateAssessmentRewardDto,
} from './staff-assessment-config';
import {
  buildAssessmentBreakdown,
  buildEngagementMetrics,
  buildFaralinDistribution,
  buildStaffStudentDetail,
} from './staff-analytics';

@Injectable()
export class UniversitiesService {
  constructor(private prisma: PrismaService) {}

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

    let exampleEarnRange: { min: number; max: number } | null = null;
    try {
      exampleEarnRange = estimateTypicalAssessmentFaralins(getTierEconomics(slug));
    } catch {
      exampleEarnRange = null;
    }

    return { ...university, exampleEarnRange };
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
        ['APPLIED', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'ENROLLED'].includes(a.status),
      ).length,
      offerReceived: applications.filter((a) =>
        ['OFFER_RECEIVED', 'OFFER_ACCEPTED', 'ENROLLED'].includes(a.status),
      ).length,
      offerAccepted: applications.filter((a) =>
        ['OFFER_ACCEPTED', 'ENROLLED'].includes(a.status),
      ).length,
      enrolled: applications.filter((a) => a.status === 'ENROLLED').length,
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
    dto: { enabled?: boolean; isCompulsory?: boolean },
  ) {
    return updateStaffTrackConfig(this.prisma, universityId, problemTrackId, dto);
  }

  requireUniversityAccess(userUniversityId: string | undefined, targetUniversityId: string) {
    if (userUniversityId !== targetUniversityId) {
      throw new ForbiddenException('Cannot access another university dashboard');
    }
  }
}
