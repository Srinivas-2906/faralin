import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';import { PrismaService } from '../prisma/prisma.service';
import {
  buildStaffStudentRoster,
  buildSubjectInterests,
} from './staff-roster';

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

    return university;
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

    const estimatedLiability = await this.prisma.faralinTransaction.aggregate({
      where: {
        universityId,
        status: { in: ['CONDITIONAL', 'CONFIRMED'] },
        trustLevel: { not: 'PRACTICE' },
      },
      _sum: { amount: true },
    });

    const conversionRule = university.conversionRule;
    const estimatedFutureBursaryGbp = conversionRule
      ? Math.round(((estimatedLiability._sum.amount ?? 0) / conversionRule.faralinsPerGbp) * 100) /
        100
      : 0;

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
      students: students.slice(0, 50),
    };
  }

  requireUniversityAccess(userUniversityId: string | undefined, targetUniversityId: string) {
    if (userUniversityId !== targetUniversityId) {
      throw new ForbiddenException('Cannot access another university dashboard');
    }
  }
}
