import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MAX_UNIVERSITY_SELECTIONS } from '@faralin/types';
import { PrismaService } from '../prisma/prisma.service';
import { PortfolioService } from '../faralin/faralin-engine.service';

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private portfolio: PortfolioService,
  ) {}

  async getProfile(studentProfileId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: {
        subjects: { include: { subject: true } },
        universitySelections: {
          include: { university: { include: { conversionRule: true } } },
          orderBy: { priority: 'asc' },
        },
      },
    });

    if (!profile) throw new NotFoundException('Student profile not found');
    return profile;
  }

  async updateProfile(
    studentProfileId: string,
    data: {
      firstName?: string;
      lastName?: string;
      schoolName?: string;
      yearGroup?: number;
      onboardingComplete?: boolean;
    },
  ) {
    return this.prisma.studentProfile.update({
      where: { id: studentProfileId },
      data,
    });
  }

  async getPortfolio(studentProfileId: string) {
    return this.portfolio.getPortfolio(studentProfileId);
  }

  async listUniversities() {
    return this.prisma.university.findMany({
      where: { isActive: true },
      include: { conversionRule: true },
      orderBy: { name: 'asc' },
    });
  }

  async selectUniversities(studentProfileId: string, universityIds: string[]) {
    if (universityIds.length > MAX_UNIVERSITY_SELECTIONS) {
      throw new BadRequestException(`Maximum ${MAX_UNIVERSITY_SELECTIONS} universities allowed`);
    }

    const uniqueIds = [...new Set(universityIds)];
    const universities = await this.prisma.university.findMany({
      where: { id: { in: uniqueIds }, isActive: true },
    });

    if (universities.length !== uniqueIds.length) {
      throw new BadRequestException('One or more universities are invalid');
    }

    await this.prisma.$transaction([
      this.prisma.studentUniversitySelection.deleteMany({ where: { studentProfileId } }),
      ...uniqueIds.map((universityId, index) =>
        this.prisma.studentUniversitySelection.create({
          data: {
            studentProfileId,
            universityId,
            priority: index + 1,
          },
        }),
      ),
      ...uniqueIds.map((universityId) =>
        this.prisma.application.upsert({
          where: {
            studentProfileId_universityId: { studentProfileId, universityId },
          },
          create: { studentProfileId, universityId, status: 'FOLLOWER' },
          update: {},
        }),
      ),
    ]);

    return this.getProfile(studentProfileId);
  }

  async setSubjects(studentProfileId: string, subjectIds: string[]) {
    const uniqueIds = [...new Set(subjectIds)];
    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: uniqueIds }, isActive: true },
    });

    if (subjects.length !== uniqueIds.length) {
      throw new BadRequestException('One or more subjects are invalid');
    }

    await this.prisma.$transaction([
      this.prisma.studentSubject.deleteMany({ where: { studentProfileId } }),
      ...uniqueIds.map((subjectId) =>
        this.prisma.studentSubject.create({
          data: { studentProfileId, subjectId },
        }),
      ),
    ]);

    return this.getProfile(studentProfileId);
  }

  async getDashboard(studentProfileId: string) {
    const [profile, portfolio, assessments, articles, events] = await Promise.all([
      this.getProfile(studentProfileId),
      this.getPortfolio(studentProfileId),
      this.prisma.assessment.findMany({
        where: { isActive: true },
        include: { subject: true },
        orderBy: { title: 'asc' },
      }),
      this.getFeedArticles(studentProfileId),
      this.getFeedEvents(studentProfileId),
    ]);

    const subjectIds = profile.subjects.map((s) => s.subjectId);
    const recommendedAssessments = assessments.filter((a) => subjectIds.includes(a.subjectId));

    return {
      profile: {
        anonymousId: profile.anonymousId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        onboardingComplete: profile.onboardingComplete,
        revealLevel: profile.revealLevel,
      },
      portfolio,
      selectedUniversities: profile.universitySelections,
      subjects: profile.subjects,
      recommendedAssessments,
      articles,
      events,
    };
  }

  private async getFeedArticles(studentProfileId: string) {
    const selections = await this.prisma.studentUniversitySelection.findMany({
      where: { studentProfileId },
    });
    const universityIds = selections.map((s) => s.universityId);
    if (!universityIds.length) return [];

    return this.prisma.article.findMany({
      where: { universityId: { in: universityIds }, isPublished: true },
      include: { university: { select: { name: true, slug: true, shortName: true } } },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });
  }

  private async getFeedEvents(studentProfileId: string) {
    const selections = await this.prisma.studentUniversitySelection.findMany({
      where: { studentProfileId },
    });
    const universityIds = selections.map((s) => s.universityId);
    if (!universityIds.length) return [];

    return this.prisma.event.findMany({
      where: {
        universityId: { in: universityIds },
        isPublished: true,
        startsAt: { gte: new Date() },
      },
      include: {
        university: { select: { name: true, slug: true, shortName: true } },
        registrations: { where: { studentProfileId } },
      },
      orderBy: { startsAt: 'asc' },
      take: 20,
    });
  }
}
