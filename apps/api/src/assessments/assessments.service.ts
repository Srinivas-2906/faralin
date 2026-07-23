import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssessmentCategory } from '@faralin/db';
import { PrismaService } from '../prisma/prisma.service';
import { FaralinEngineService } from '../faralin/faralin-engine.service';
import {
  getStudentEnabledUniversityIds,
  isAssessmentEnabledForStudent,
} from '../universities/staff-assessment-config';

@Injectable()
export class AssessmentsService {
  constructor(
    private prisma: PrismaService,
    private faralinEngine: FaralinEngineService,
  ) {}

  async listAssessments(subjectSlug?: string, category?: string) {
    return this.prisma.assessment.findMany({
      where: {
        isActive: true,
        ...(subjectSlug ? { subject: { slug: subjectSlug } } : {}),
        ...(category ? { category: category as AssessmentCategory } : {}),
      },
      include: { subject: true },
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
    });
  }

  async listAssessmentsForStudent(studentProfileId: string, category?: string) {
    const universityIds = await getStudentEnabledUniversityIds(this.prisma, studentProfileId);
    if (universityIds.length === 0) return [];

    const enabledConfigs = await this.prisma.universityAssessmentConfig.findMany({
      where: { universityId: { in: universityIds }, enabled: true },
      include: {
        university: { select: { id: true, slug: true, shortName: true, name: true } },
        assessment: { include: { subject: true } },
      },
    });

    const byAssessment = new Map<string, ReturnType<AssessmentsService['mapStudentAssessmentItem']>>();

    for (const config of enabledConfigs) {
      if (category && config.assessment.category !== category) continue;

      const uniEntry = {
        universityId: config.university.id,
        slug: config.university.slug,
        shortName: config.university.shortName ?? config.university.name,
      };

      const existing = byAssessment.get(config.assessmentId);
      if (existing) {
        if (!existing.availableUniversities.some((u) => u.universityId === uniEntry.universityId)) {
          existing.availableUniversities.push(uniEntry);
        }
        continue;
      }

      const rule = await this.prisma.faralinRule.findFirst({
        where: {
          universityId: config.universityId,
          assessmentId: config.assessmentId,
          isActive: true,
        },
      });

      byAssessment.set(
        config.assessmentId,
        this.mapStudentAssessmentItem(config.assessment, uniEntry, rule?.baseAmount ?? null),
      );
    }

    return Array.from(byAssessment.values()).sort((a, b) => a.title.localeCompare(b.title));
  }

  private mapStudentAssessmentItem(
    assessment: {
      id: string;
      slug: string;
      title: string;
      description: string | null;
      category: AssessmentCategory;
      difficulty: string;
      trustLevel: string;
      estimatedFaralinMin: number;
      estimatedFaralinMax: number;
      isTimed: boolean;
      durationMinutes: number | null;
      subject: { slug: string; name: string };
    },
    uniEntry: { universityId: string; slug: string; shortName: string },
    baseReward: number | null,
  ) {
    return {
      id: assessment.id,
      slug: assessment.slug,
      title: assessment.title,
      description: assessment.description,
      category: assessment.category,
      difficulty: assessment.difficulty,
      trustLevel: assessment.trustLevel,
      estimatedFaralinMin: assessment.estimatedFaralinMin,
      estimatedFaralinMax: assessment.estimatedFaralinMax,
      isTimed: assessment.isTimed,
      durationMinutes: assessment.durationMinutes,
      subject: assessment.subject,
      availableUniversities: [uniEntry],
      previewReward: baseReward,
    };
  }

  async getAssessment(slug: string, studentProfileId?: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { slug },
      include: {
        subject: true,
        questions: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            sortOrder: true,
            prompt: true,
            questionType: true,
            options: true,
            points: true,
          },
        },
      },
    });

    if (!assessment) throw new NotFoundException('Assessment not found');

    let universityRewards: Array<{
      universityId: string;
      slug: string;
      shortName: string;
      enabled: boolean;
      baseAmount: number | null;
    }> = [];
    let enabledForStudent = true;

    if (studentProfileId) {
      const universityIds = await getStudentEnabledUniversityIds(this.prisma, studentProfileId);
      const selections = await this.prisma.university.findMany({
        where: { id: { in: universityIds } },
        select: { id: true, slug: true, shortName: true, name: true },
      });

      universityRewards = await Promise.all(
        selections.map(async (uni) => {
          const config = await this.prisma.universityAssessmentConfig.findUnique({
            where: {
              universityId_assessmentId: {
                universityId: uni.id,
                assessmentId: assessment.id,
              },
            },
          });
          const rule = await this.prisma.faralinRule.findFirst({
            where: {
              universityId: uni.id,
              assessmentId: assessment.id,
              isActive: true,
            },
          });
          return {
            universityId: uni.id,
            slug: uni.slug,
            shortName: uni.shortName ?? uni.name,
            enabled: config?.enabled ?? false,
            baseAmount: rule?.baseAmount ?? null,
          };
        }),
      );

      enabledForStudent = universityRewards.some((r) => r.enabled);
    }

    return { ...assessment, universityRewards, enabledForStudent };
  }

  async startAttempt(studentProfileId: string, assessmentSlug: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { slug: assessmentSlug },
    });

    if (!assessment || !assessment.isActive) {
      throw new NotFoundException('Assessment not found');
    }

    const enabled = await isAssessmentEnabledForStudent(
      this.prisma,
      studentProfileId,
      assessment.id,
    );
    if (!enabled) {
      throw new ForbiddenException(
        'This assessment is not offered by any of your selected universities.',
      );
    }

    const inProgress = await this.prisma.assessmentAttempt.findFirst({
      where: {
        studentProfileId,
        assessmentId: assessment.id,
        completedAt: null,
        isVoided: false,
      },
    });

    if (inProgress) return inProgress;

    return this.prisma.assessmentAttempt.create({
      data: {
        assessmentId: assessment.id,
        studentProfileId,
        trustLevel: assessment.trustLevel,
      },
    });
  }

  async submitAttempt(
    studentProfileId: string,
    attemptId: string,
    answers: Array<{ questionId: string; response: unknown; writtenExplanation?: string }>,
  ) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: { questions: true },
        },
      },
    });

    if (!attempt || attempt.studentProfileId !== studentProfileId) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.completedAt) {
      throw new BadRequestException('Attempt already submitted');
    }

    let score = 0;
    let maxScore = 0;
    const answerRecords: Array<{
      questionId: string;
      response: unknown;
      isCorrect: boolean;
      pointsAwarded: number;
      writtenExplanation?: string;
    }> = [];

    for (const question of attempt.assessment.questions) {
      maxScore += question.points;
      const submitted = answers.find((a) => a.questionId === question.id);
      const isCorrect = this.checkAnswer(question, submitted?.response);
      const pointsAwarded = isCorrect ? question.points : 0;
      score += pointsAwarded;

      answerRecords.push({
        questionId: question.id,
        response: submitted?.response ?? null,
        isCorrect,
        pointsAwarded,
        writtenExplanation: submitted?.writtenExplanation,
      });
    }

    const accuracyPercent = maxScore > 0 ? (score / maxScore) * 100 : 0;

    const previousAttempt = await this.prisma.assessmentAttempt.findFirst({
      where: {
        studentProfileId,
        assessmentId: attempt.assessmentId,
        completedAt: { not: null },
        isVoided: false,
      },
      orderBy: { completedAt: 'desc' },
    });

    const previousAccuracy = previousAttempt
      ? Number(previousAttempt.accuracyPercent ?? 0)
      : null;
    const improvementDelta =
      previousAccuracy !== null ? accuracyPercent - previousAccuracy : 0;

    const completed = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.assessmentAttempt.update({
        where: { id: attemptId },
        data: {
          completedAt: new Date(),
          score,
          maxScore,
          accuracyPercent,
          improvementDelta,
        },
      });

      await tx.assessmentAnswer.createMany({
        data: answerRecords.map((a) => ({
          assessmentAttemptId: attemptId,
          questionId: a.questionId,
          response: a.response as object,
          isCorrect: a.isCorrect,
          pointsAwarded: a.pointsAwarded,
          writtenExplanation: a.writtenExplanation,
        })),
      });

      return updated;
    });

    await this.faralinEngine.processAttemptCompletion(attemptId);

    const transactions = await this.prisma.faralinTransaction.findMany({
      where: { assessmentAttemptId: attemptId },
      include: {
        university: { select: { slug: true, shortName: true, name: true } },
      },
    });

    return {
      ...completed,
      faralinsEarned: transactions.map((tx) => ({
        universitySlug: tx.university.slug,
        universityName: tx.university.shortName ?? tx.university.name,
        amount: tx.amount,
      })),
    };
  }

  private checkAnswer(
    question: { questionType: string; correctAnswer: unknown },
    response: unknown,
  ): boolean {
    if (response === null || response === undefined) return false;

    const correct = question.correctAnswer;
    if (question.questionType === 'MCQ') {
      return String(response).toLowerCase() === String(correct).toLowerCase();
    }

    if (question.questionType === 'SHORT_ANSWER') {
      const resp = String(response).toLowerCase();
      const corr = String(correct).toLowerCase();
      return resp.includes(corr) || corr.includes(resp);
    }

    return false;
  }

  async getAttemptHistory(studentProfileId: string) {
    return this.prisma.assessmentAttempt.findMany({
      where: { studentProfileId, completedAt: { not: null } },
      include: {
        assessment: { include: { subject: true } },
        faralinTransactions: { include: { university: true } },
      },
      orderBy: { completedAt: 'desc' },
    });
  }
}
