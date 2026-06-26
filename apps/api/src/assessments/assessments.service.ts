import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FaralinEngineService } from '../faralin/faralin-engine.service';

@Injectable()
export class AssessmentsService {
  constructor(
    private prisma: PrismaService,
    private faralinEngine: FaralinEngineService,
  ) {}

  async listAssessments(subjectSlug?: string) {
    return this.prisma.assessment.findMany({
      where: {
        isActive: true,
        ...(subjectSlug ? { subject: { slug: subjectSlug } } : {}),
      },
      include: { subject: true },
      orderBy: { title: 'asc' },
    });
  }

  async getAssessment(slug: string) {
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
    return assessment;
  }

  async startAttempt(studentProfileId: string, assessmentSlug: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { slug: assessmentSlug },
    });

    if (!assessment || !assessment.isActive) {
      throw new NotFoundException('Assessment not found');
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

    return completed;
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
