import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  async getStaffDashboard(universityId: string) {
    const university = await this.prisma.university.findUnique({
      where: { id: universityId },
      include: { conversionRule: true },
    });

    if (!university) throw new NotFoundException('University not found');

    const [
      followerCount,
      applications,
      assessmentAttempts,
      eventRegistrations,
      articles,
      events,
    ] = await Promise.all([
      this.prisma.studentUniversitySelection.count({ where: { universityId } }),
      this.prisma.application.findMany({ where: { universityId } }),
      this.prisma.faralinTransaction.findMany({
        where: { universityId },
        include: {
          studentProfile: {
            include: {
              subjects: { include: { subject: true } },
              assessmentAttempts: { where: { completedAt: { not: null }, isVoided: false } },
            },
          },
        },
      }),
      this.prisma.eventRegistration.count({
        where: { event: { universityId } },
      }),
      this.prisma.article.count({ where: { universityId, isPublished: true } }),
      this.prisma.event.count({ where: { universityId, isPublished: true } }),
    ]);

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

    const studentMap = new Map<
      string,
      {
        anonymousId: string;
        revealLevel: string;
        subjectSlugs: string[];
        assessmentsCompleted: number;
        totalFaralins: number;
      }
    >();

    for (const tx of assessmentAttempts) {
      const profile = tx.studentProfile;
      const existing = studentMap.get(profile.id) ?? {
        anonymousId: profile.anonymousId,
        revealLevel: profile.revealLevel,
        subjectSlugs: profile.subjects.map((s) => s.subject.slug),
        assessmentsCompleted: profile.assessmentAttempts.length,
        totalFaralins: 0,
      };
      existing.totalFaralins += tx.amount;
      studentMap.set(profile.id, existing);
    }

    const students = Array.from(studentMap.values()).map((s) => ({
      ...s,
      performanceBand: this.getPerformanceBand(s.totalFaralins, s.assessmentsCompleted),
    }));

    const subjectInterestCounts: Record<string, number> = {};
    for (const s of students) {
      for (const slug of s.subjectSlugs) {
        subjectInterestCounts[slug] = (subjectInterestCounts[slug] ?? 0) + 1;
      }
    }

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

    return {
      university,
      funnel,
      followerCount,
      subjectInterests: subjectInterestCounts,
      topPerformers: [...students].sort((a, b) => b.totalFaralins - a.totalFaralins).slice(0, 10),
      eventRegistrations,
      contentEngagement: { articles, events },
      estimatedFutureBursaryGbp,
      students: students.slice(0, 50),
    };
  }

  private getPerformanceBand(
    totalFaralins: number,
    assessmentsCompleted: number,
  ): 'developing' | 'steady' | 'strong' | 'exceptional' {
    const score = totalFaralins + assessmentsCompleted * 50;
    if (score >= 3000) return 'exceptional';
    if (score >= 1500) return 'strong';
    if (score >= 500) return 'steady';
    return 'developing';
  }

  requireUniversityAccess(userUniversityId: string | undefined, targetUniversityId: string) {
    if (userUniversityId !== targetUniversityId) {
      throw new ForbiddenException('Cannot access another university dashboard');
    }
  }
}
