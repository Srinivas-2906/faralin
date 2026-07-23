import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AssessmentDifficulty,
  ArticleType,
  EventType,
  FaralinTrustLevel,
  UserRole,
} from '@faralin/db';
import { pendingClerkUserId } from '../auth/auth-user.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getMe(user: { id: string; email: string; role: string }) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { adminProfile: true },
    });

    return {
      user: {
        id: dbUser?.id ?? user.id,
        email: dbUser?.email ?? user.email,
        role: dbUser?.role ?? user.role,
      },
      isAdmin: true,
    };
  }

  async getOverview() {
    const [users, students, universities, assessments, problemTracks, transactions, moderationQueue] =
      await Promise.all([
      this.prisma.user.count(),
      this.prisma.studentProfile.count(),
      this.prisma.university.count(),
      this.prisma.assessment.count(),
      this.prisma.problemTrack.count(),
      this.prisma.faralinTransaction.count(),
      this.prisma.problemTrackAttempt.count({
        where: { moderationStatus: 'NEEDS_REVIEW' },
      }),
    ]);

    return {
      users,
      students,
      universities,
      assessments,
      problemTracks,
      transactions,
      moderationQueue,
    };
  }

  async listAssessments() {
    return this.prisma.assessment.findMany({
      include: { subject: true, _count: { select: { questions: true, attempts: true } } },
      orderBy: { title: 'asc' },
    });
  }

  async createAssessment(data: {
    slug: string;
    title: string;
    description?: string;
    subjectId: string;
    difficulty: AssessmentDifficulty;
    trustLevel: FaralinTrustLevel;
    durationMinutes?: number;
    isTimed?: boolean;
    estimatedFaralinMin: number;
    estimatedFaralinMax: number;
    questions: Array<{
      prompt: string;
      questionType: string;
      options?: string[];
      correctAnswer: string;
      points?: number;
    }>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const assessment = await tx.assessment.create({
        data: {
          slug: data.slug,
          title: data.title,
          description: data.description,
          subjectId: data.subjectId,
          difficulty: data.difficulty,
          trustLevel: data.trustLevel,
          durationMinutes: data.durationMinutes,
          isTimed: data.isTimed ?? false,
          estimatedFaralinMin: data.estimatedFaralinMin,
          estimatedFaralinMax: data.estimatedFaralinMax,
        },
      });

      await tx.assessmentQuestion.createMany({
        data: data.questions.map((q, i) => ({
          assessmentId: assessment.id,
          sortOrder: i + 1,
          prompt: q.prompt,
          questionType: q.questionType,
          options: q.options ?? undefined,
          correctAnswer: q.correctAnswer,
          points: q.points ?? 1,
        })),
      });

      return assessment;
    });
  }

  async updateAssessment(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      isActive: boolean;
      estimatedFaralinMin: number;
      estimatedFaralinMax: number;
    }>,
  ) {
    return this.prisma.assessment.update({ where: { id }, data });
  }

  async listFaralinRules() {
    return this.prisma.faralinRule.findMany({
      include: {
        university: { select: { name: true, slug: true } },
        assessment: { select: { title: true, slug: true } },
        subject: { select: { name: true, slug: true } },
      },
      orderBy: { universityId: 'asc' },
    });
  }

  async createFaralinRule(data: {
    universityId: string;
    assessmentId?: string;
    subjectId?: string;
    trustLevel?: FaralinTrustLevel;
    difficulty?: AssessmentDifficulty;
    baseAmount: number;
    scoreMultiplier?: number;
    improvementBonus?: number;
    consistencyBonus?: number;
    difficultyMultiplier?: number;
  }) {
    return this.prisma.faralinRule.create({ data });
  }

  async updateFaralinRule(
    id: string,
    data: Partial<{
      baseAmount: number;
      scoreMultiplier: number;
      improvementBonus: number;
      consistencyBonus: number;
      difficultyMultiplier: number;
      isActive: boolean;
    }>,
  ) {
    return this.prisma.faralinRule.update({ where: { id }, data });
  }

  async listUniversities() {
    return this.prisma.university.findMany({
      include: { conversionRule: true, partnership: true },
      orderBy: { name: 'asc' },
    });
  }

  async createUniversity(data: {
    slug: string;
    name: string;
    shortName?: string;
    description?: string;
    websiteUrl?: string;
    applyUrl?: string;
    isDemo?: boolean;
    faralinsPerGbp: number;
    disclaimerText: string;
  }) {
    return this.prisma.university.create({
      data: {
        slug: data.slug,
        name: data.name,
        shortName: data.shortName,
        description: data.description,
        websiteUrl: data.websiteUrl,
        applyUrl: data.applyUrl,
        isDemo: data.isDemo ?? false,
        conversionRule: {
          create: {
            faralinsPerGbp: data.faralinsPerGbp,
            disclaimerText: data.disclaimerText,
          },
        },
      },
      include: { conversionRule: true },
    });
  }

  async listSubjects() {
    return this.prisma.subject.findMany({ orderBy: { name: 'asc' } });
  }

  async createSubject(data: { slug: string; name: string }) {
    return this.prisma.subject.create({ data });
  }

  async listProblemTracks() {
    return this.prisma.problemTrack.findMany({
      include: {
        subject: true,
        _count: { select: { attempts: true } },
      },
      orderBy: { title: 'asc' },
    });
  }

  async createProblemTrack(data: {
    trackId: string;
    slug: string;
    title: string;
    subtitle?: string;
    subjectId: string;
    secondarySubjectSlug?: string;
    difficultyBand: string;
    yearLevels: string[];
    timeCapHours: number;
    estimatedHoursMin: number;
    estimatedHoursMax: number;
    maxFaralins: number;
    bursaryValueApproxGbp?: number;
    outputType: string;
    partnerUniversityCategories: string[];
    skills: string[];
    prerequisites: string[];
    regionCompatibility: string[];
    trustLevel: FaralinTrustLevel;
    sections: object;
    rubric: object;
    awardBands: object;
    moderationRules?: object;
  }) {
    return this.prisma.problemTrack.create({
      data: {
        ...data,
        difficultyBand: data.difficultyBand as never,
      },
    });
  }

  async updateProblemTrack(
    id: string,
    data: Partial<{
      title: string;
      subtitle: string;
      isActive: boolean;
      maxFaralins: number;
      sections: object;
      rubric: object;
      awardBands: object;
    }>,
  ) {
    return this.prisma.problemTrack.update({ where: { id }, data });
  }

  async createUniversityStaff(data: { email: string; universityId: string; jobTitle?: string }) {
    const university = await this.prisma.university.findUnique({
      where: { id: data.universityId },
    });
    if (!university) {
      throw new NotFoundException('University not found');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    return this.prisma.user.create({
      data: {
        clerkUserId: pendingClerkUserId(),
        email: data.email,
        role: UserRole.UNIVERSITY_STAFF,
        universityStaffProfile: {
          create: {
            universityId: data.universityId,
            jobTitle: data.jobTitle,
          },
        },
      },
      include: {
        universityStaffProfile: { include: { university: true } },
      },
    });
  }
}
