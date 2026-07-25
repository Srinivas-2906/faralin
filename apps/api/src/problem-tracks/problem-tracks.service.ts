import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ModerationStatus,
  ProblemSectionType,
  ProblemTrackAttemptStatus,
} from '@faralin/db';
import type { AwardBand, ProblemTrackSection, RubricCategory } from '@faralin/types';
import { PrismaService } from '../prisma/prisma.service';
import { FaralinEngineService } from '../faralin/faralin-engine.service';
import { AiTutorService } from './ai-tutor.service';
import { RubricScorerService } from './rubric-scorer.service';
import { TrustService } from './trust.service';
import {
  getStudentEnabledUniversityIds,
  isTrackEnabledForStudent,
} from '../universities/staff-assessment-config';

function parseSections(json: unknown): ProblemTrackSection[] {
  return json as unknown as ProblemTrackSection[];
}

function parseRubric(json: unknown): RubricCategory[] {
  return json as unknown as RubricCategory[];
}

function parseAwardBands(json: unknown): AwardBand[] {
  return json as unknown as AwardBand[];
}

@Injectable()
export class ProblemTracksService {
  constructor(
    private prisma: PrismaService,
    private faralinEngine: FaralinEngineService,
    private aiTutor: AiTutorService,
    private rubricScorer: RubricScorerService,
    private trust: TrustService,
  ) {}

  async listTracks(subjectSlug?: string, difficulty?: string) {
    return this.prisma.problemTrack.findMany({
      where: {
        isActive: true,
        ...(subjectSlug ? { subject: { slug: subjectSlug } } : {}),
        ...(difficulty ? { difficultyBand: difficulty as never } : {}),
      },
      include: { subject: true },
      orderBy: { title: 'asc' },
    });
  }

  async listTracksForStudent(studentProfileId: string, difficulty?: string) {
    const universityIds = await getStudentEnabledUniversityIds(this.prisma, studentProfileId);
    if (universityIds.length === 0) return [];

    const enabledConfigs = await this.prisma.universityProblemTrackConfig.findMany({
      where: { universityId: { in: universityIds }, enabled: true },
      include: {
        problemTrack: { include: { subject: true } },
        university: { select: { id: true, slug: true, shortName: true, name: true } },
      },
    });

    const byTrack = new Map<string, Record<string, unknown>>();
    for (const config of enabledConfigs) {
      if (difficulty && config.problemTrack.difficultyBand !== difficulty) continue;
      const track = config.problemTrack;
      if (!track.isActive) continue;

      const existing = byTrack.get(track.id);
      const uniEntry = {
        universityId: config.university.id,
        slug: config.university.slug,
        shortName: config.university.shortName ?? config.university.name,
      };

      if (existing) {
        const unis = existing.availableUniversities as typeof uniEntry[];
        if (!unis.some((u) => u.universityId === uniEntry.universityId)) {
          unis.push(uniEntry);
        }
        continue;
      }

      byTrack.set(track.id, {
        ...track,
        availableUniversities: [uniEntry],
      });
    }

    return Array.from(byTrack.values()).sort((a, b) =>
      String(a.title).localeCompare(String(b.title)),
    );
  }

  async getTrack(slug: string, includeSections = true) {
    const track = await this.prisma.problemTrack.findUnique({
      where: { slug },
      include: { subject: true },
    });
    if (!track || !track.isActive) throw new NotFoundException('Problem track not found');

    if (!includeSections) {
      const { sections: _s, rubric: _r, awardBands: _a, moderationRules: _m, ...overview } = track;
      return {
        ...overview,
        sectionCount: parseSections(track.sections).length,
        sectionOutline: parseSections(track.sections).map((s) => ({
          id: s.id,
          type: s.type,
          title: s.title,
        })),
      };
    }

    return track;
  }

  async startAttempt(studentProfileId: string, slug: string) {
    const track = await this.prisma.problemTrack.findUnique({ where: { slug } });
    if (!track || !track.isActive) throw new NotFoundException('Problem track not found');

    const enabled = await isTrackEnabledForStudent(this.prisma, studentProfileId, track.id);
    if (!enabled) {
      throw new ForbiddenException(
        'This problem track is not offered by any of your selected universities.',
      );
    }

    const journeyBlock = await this.checkJourneyAccess(studentProfileId, track.slug);
    if (journeyBlock) {
      throw new ForbiddenException(journeyBlock);
    }

    const inProgress = await this.prisma.problemTrackAttempt.findFirst({
      where: {
        studentProfileId,
        problemTrackId: track.id,
        status: ProblemTrackAttemptStatus.IN_PROGRESS,
        isVoided: false,
        expiresAt: { gt: new Date() },
      },
      include: { stepResponses: true },
    });

    if (inProgress) return this.formatAttempt(inProgress, track);

    const expiresAt = new Date(Date.now() + track.timeCapHours * 60 * 60 * 1000);
    const sections = parseSections(track.sections);
    const firstSection = sections[0];

    const attempt = await this.prisma.problemTrackAttempt.create({
      data: {
        problemTrackId: track.id,
        studentProfileId,
        expiresAt,
        currentSectionId: firstSection?.id,
      },
      include: { stepResponses: true },
    });

    return this.formatAttempt(attempt, track);
  }

  async getAttempt(studentProfileId: string, attemptId: string) {
    const attempt = await this.prisma.problemTrackAttempt.findUnique({
      where: { id: attemptId },
      include: {
        stepResponses: { orderBy: { sortOrder: 'asc' } },
        problemTrack: { include: { subject: true } },
        portfolioArtifact: true,
      },
    });

    if (!attempt || attempt.studentProfileId !== studentProfileId) {
      throw new NotFoundException('Attempt not found');
    }

    return this.formatAttempt(attempt, attempt.problemTrack);
  }

  async saveStep(
    studentProfileId: string,
    attemptId: string,
    sectionId: string,
    body: {
      response: Record<string, unknown>;
      timeSpentMs?: number;
      copyPasteCount?: number;
    },
  ) {
    const attempt = await this.getAttemptOrThrow(studentProfileId, attemptId);
    this.assertInProgress(attempt);

    const sections = parseSections(attempt.problemTrack.sections);
    const section = sections.find((s) => s.id === sectionId);
    if (!section) throw new NotFoundException('Section not found');

    if (!this.isSectionUnlocked(section, sections, attempt.stepResponses)) {
      throw new ForbiddenException('Complete previous sections first');
    }

    const sortOrder = sections.findIndex((s) => s.id === sectionId);
    const isComplete = this.isStepComplete(section, body.response);

    await this.prisma.problemTrackStepResponse.upsert({
      where: { attemptId_sectionId: { attemptId, sectionId } },
      create: {
        attemptId,
        sectionId,
        sectionType: section.type as ProblemSectionType,
        sortOrder,
        response: body.response as object,
        timeSpentMs: body.timeSpentMs ?? 0,
        copyPasteCount: body.copyPasteCount ?? 0,
        isComplete,
      },
      update: {
        response: body.response as object,
        timeSpentMs: { increment: body.timeSpentMs ?? 0 },
        copyPasteCount: { increment: body.copyPasteCount ?? 0 },
        isComplete,
      },
    });

    const nextSection = this.getNextSection(sections, sectionId, isComplete);
    const updated = await this.prisma.problemTrackAttempt.update({
      where: { id: attemptId },
      data: { currentSectionId: nextSection?.id ?? sectionId },
      include: { stepResponses: { orderBy: { sortOrder: 'asc' } } },
    });

    if (isComplete && section.sectionRewardFaralins && section.sectionRewardFaralins > 0) {
      await this.faralinEngine.processSectionMilestone(
        attemptId,
        sectionId,
        section.sectionRewardFaralins,
      );
    }

    return this.formatAttempt(updated, attempt.problemTrack);
  }

  private async checkJourneyAccess(studentProfileId: string, trackSlug: string) {
    const universityIds = await getStudentEnabledUniversityIds(this.prisma, studentProfileId);
    const configs = await this.prisma.universityProblemTrackJourneyConfig.findMany({
      where: { universityId: { in: universityIds }, enabled: true },
      include: { journey: true },
    });

    const relevant = configs.filter((c) => {
      const milestones = c.journey.milestones as Array<{ trackSlug: string; sortOrder: number }>;
      return milestones.some((m) => m.trackSlug === trackSlug);
    });
    if (relevant.length === 0) return null;

    const completedSlugs = new Set(
      (
        await this.prisma.problemTrackAttempt.findMany({
          where: {
            studentProfileId,
            completedAt: { not: null },
            isVoided: false,
            status: { in: ['SCORED', 'APPROVED', 'MODERATION_PENDING'] },
          },
          include: { problemTrack: { select: { slug: true } } },
        })
      ).map((a) => a.problemTrack.slug),
    );

    for (const config of relevant) {
      const milestones = (config.journey.milestones as Array<{ trackSlug: string; sortOrder: number; label: string }>)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const target = milestones.find((m) => m.trackSlug === trackSlug);
      if (!target) continue;
      const incompletePrior = milestones
        .filter((m) => m.sortOrder < target.sortOrder)
        .find((m) => !completedSlugs.has(m.trackSlug));
      if (incompletePrior) {
        return `Complete ${incompletePrior.label} in the journey first.`;
      }
    }

    return null;
  }

  async listJourneysForStudent(studentProfileId: string) {
    const universityIds = await getStudentEnabledUniversityIds(this.prisma, studentProfileId);
    if (universityIds.length === 0) return [];

    const configs = await this.prisma.universityProblemTrackJourneyConfig.findMany({
      where: { universityId: { in: universityIds }, enabled: true },
      include: {
        journey: true,
        university: { select: { slug: true, shortName: true, name: true } },
      },
    });

    const completedTrackSlugs = new Set(
      (
        await this.prisma.problemTrackAttempt.findMany({
          where: {
            studentProfileId,
            completedAt: { not: null },
            isVoided: false,
            status: { in: ['SCORED', 'APPROVED', 'MODERATION_PENDING'] },
          },
          include: { problemTrack: { select: { slug: true } } },
        })
      ).map((a) => a.problemTrack.slug),
    );

    const byJourney = new Map<string, unknown>();
    for (const config of configs) {
      const milestones = config.journey.milestones as Array<{
        trackSlug: string;
        sortOrder: number;
        label: string;
        bonusFaralins?: number;
        badgeLabel?: string;
      }>;
      const enriched = milestones
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((m, index) => {
          const completed = completedTrackSlugs.has(m.trackSlug);
          const priorComplete = milestones
            .filter((x) => x.sortOrder < m.sortOrder)
            .every((x) => completedTrackSlugs.has(x.trackSlug));
          return {
            ...m,
            lockState: completed ? 'COMPLETED' : priorComplete ? 'AVAILABLE' : 'LOCKED',
          };
        });

      byJourney.set(config.journeyId, {
        id: config.journey.id,
        slug: config.journey.slug,
        title: config.journey.title,
        description: config.journey.description,
        milestones: enriched,
        availableUniversities: [
          {
            slug: config.university.slug,
            shortName: config.university.shortName ?? config.university.name,
          },
        ],
      });
    }

    return Array.from(byJourney.values());
  }

  async getAiFeedback(
    studentProfileId: string,
    attemptId: string,
    sectionId: string,
    userMessage?: string,
  ) {
    const attempt = await this.getAttemptOrThrow(studentProfileId, attemptId);
    this.assertInProgress(attempt);

    const sections = parseSections(attempt.problemTrack.sections);
    const section = sections.find((s) => s.id === sectionId);
    if (!section) throw new NotFoundException('Section not found');

    const stepResponse = attempt.stepResponses.find((r) => r.sectionId === sectionId);
    const feedback = await this.aiTutor.getFeedback({
      sectionType: section.type,
      sectionTitle: section.title,
      sectionContent: section.content,
      studentResponse: (stepResponse?.response as Record<string, unknown>) ?? {},
      aiPolicy: section.aiPolicy,
      userMessage,
    });

    if (stepResponse) {
      await this.prisma.problemTrackStepResponse.update({
        where: { id: stepResponse.id },
        data: { aiFeedback: feedback as object },
      });
    }

    return feedback;
  }

  async buildFinalDraft(studentProfileId: string, attemptId: string) {
    const attempt = await this.getAttemptOrThrow(studentProfileId, attemptId);
    this.assertInProgress(attempt);

    const sections = parseSections(attempt.problemTrack.sections);
    const stepResponses = attempt.stepResponses
      .filter((r) => r.sectionType !== 'FINAL_BUILDER' && r.sectionType !== 'SUBMIT')
      .map((r) => ({
        sectionId: r.sectionId,
        sectionTitle: sections.find((s) => s.id === r.sectionId)?.title ?? r.sectionId,
        response: r.response as Record<string, unknown>,
      }));

    const draft = await this.aiTutor.buildFinalDraft({
      trackTitle: attempt.problemTrack.title,
      stepResponses,
    });

    return { draft };
  }

  async submitAttempt(
    studentProfileId: string,
    attemptId: string,
    finalSubmission: string,
  ) {
    const attempt = await this.getAttemptOrThrow(studentProfileId, attemptId);
    this.assertInProgress(attempt);

    if (new Date() > attempt.expiresAt) {
      throw new BadRequestException('Time cap exceeded');
    }

    const sections = parseSections(attempt.problemTrack.sections);
    const requiredSections = sections.filter(
      (s) => s.type !== 'SUBMIT' && s.inputs.some((i) => i.required),
    );

    for (const sec of requiredSections) {
      const resp = attempt.stepResponses.find((r) => r.sectionId === sec.id);
      if (!resp || !this.isStepComplete(sec, resp.response as Record<string, unknown>)) {
        throw new BadRequestException(`Complete section "${sec.title}" before submitting`);
      }
    }

    if (!finalSubmission || finalSubmission.trim().length < 100) {
      throw new BadRequestException('Final submission must be at least 100 characters');
    }

    const completedAt = new Date();
    const rubric = parseRubric(attempt.problemTrack.rubric);
    const awardBands = parseAwardBands(attempt.problemTrack.awardBands);
    const moderationRules = attempt.problemTrack.moderationRules as {
      humanModerationAboveScore?: number;
      humanModerationOnLowTrust?: boolean;
      plagiarismCheckRequired?: boolean;
    } | null;

    const stepData = attempt.stepResponses.map((r) => ({
      sectionId: r.sectionId,
      sectionType: r.sectionType,
      response: r.response as Record<string, unknown>,
      timeSpentMs: r.timeSpentMs,
      copyPasteCount: r.copyPasteCount,
    }));

    const scoreResult = await this.rubricScorer.scoreSubmission({
      rubric,
      awardBands,
      maxFaralins: attempt.problemTrack.maxFaralins,
      stepResponses: stepData,
      finalSubmission,
      trackContext: attempt.problemTrack.title,
    });

    const trustResult = await this.trust.evaluate({
      stepResponses: stepData,
      finalSubmission,
      startedAt: attempt.startedAt,
      completedAt,
      moderationRules: moderationRules ?? undefined,
      rubricScore: scoreResult.totalScore,
    });

    const status =
      trustResult.moderationStatus === ModerationStatus.NEEDS_REVIEW
        ? ProblemTrackAttemptStatus.MODERATION_PENDING
        : ProblemTrackAttemptStatus.SCORED;

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.problemTrackAttempt.update({
        where: { id: attemptId },
        data: {
          status,
          completedAt,
          finalSubmission,
          rubricScore: scoreResult.totalScore,
          rubricBreakdown: scoreResult.breakdown as object,
          faralinsEarned: scoreResult.faralinsEarned,
          awardBandLabel: scoreResult.awardBand.label,
          trustLevel: trustResult.trustLevel,
          moderationStatus: trustResult.moderationStatus,
          verificationFlags: trustResult.verificationFlags as object,
          feedbackSummary: {
            strengths: scoreResult.strengths,
            improvements: scoreResult.improvements,
            awardBand: scoreResult.awardBand.label,
          } as object,
        },
      });

      await tx.portfolioArtifact.create({
        data: {
          studentProfileId,
          attemptId,
          problemTrackId: attempt.problemTrackId,
          title: attempt.problemTrack.title,
          slug: attempt.problemTrack.slug,
          subjectName: attempt.problemTrack.subject.name,
          difficultyBand: attempt.problemTrack.difficultyBand,
          rubricScore: scoreResult.totalScore,
          faralinsEarned: scoreResult.faralinsEarned,
          skillsDemonstrated: attempt.problemTrack.skills,
          trustLevel: trustResult.trustLevel,
          moderationStatus: trustResult.moderationStatus,
          finalSubmission,
          recognitionSummary: {
            partnerCategories: attempt.problemTrack.partnerUniversityCategories,
            awardBand: scoreResult.awardBand.label,
          } as object,
          completedAt,
        },
      });

      return updated;
    });

    if (status === ProblemTrackAttemptStatus.SCORED && scoreResult.faralinsEarned > 0) {
      await this.faralinEngine.processTrackAttemptCompletion(attemptId);
    }

    if (status === ProblemTrackAttemptStatus.SCORED) {
      await this.faralinEngine.processJourneyMilestoneBonus(
        studentProfileId,
        attempt.problemTrack.slug,
      );
    }

    return {
      ...result,
      score: scoreResult,
      trust: trustResult,
    };
  }

  async getPortfolioArtifacts(studentProfileId: string) {
    return this.prisma.portfolioArtifact.findMany({
      where: { studentProfileId },
      orderBy: { completedAt: 'desc' },
    });
  }

  async listModerationQueue() {
    return this.prisma.problemTrackAttempt.findMany({
      where: { moderationStatus: ModerationStatus.NEEDS_REVIEW },
      include: {
        studentProfile: { select: { id: true, anonymousId: true, firstName: true, lastName: true } },
        problemTrack: { select: { title: true, slug: true, maxFaralins: true } },
      },
      orderBy: { completedAt: 'desc' },
    });
  }

  async moderateAttempt(
    attemptId: string,
    decision: 'approve' | 'reject',
    notes?: string,
  ) {
    const attempt = await this.prisma.problemTrackAttempt.findUnique({
      where: { id: attemptId },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');

    const status =
      decision === 'approve'
        ? ProblemTrackAttemptStatus.APPROVED
        : ProblemTrackAttemptStatus.REJECTED;
    const moderationStatus =
      decision === 'approve' ? ModerationStatus.AUTO_APPROVED : ModerationStatus.REJECTED;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.problemTrackAttempt.update({
        where: { id: attemptId },
        data: {
          status,
          moderationStatus,
          feedbackSummary: {
            ...(attempt.feedbackSummary as object),
            moderationNotes: notes,
          } as object,
        },
      });

      await tx.portfolioArtifact.updateMany({
        where: { attemptId },
        data: { moderationStatus },
      });

      return result;
    });

    if (decision === 'approve' && (attempt.faralinsEarned ?? 0) > 0) {
      await this.faralinEngine.processTrackAttemptCompletion(attemptId);
    }

    if (decision === 'approve') {
      const fullAttempt = await this.prisma.problemTrackAttempt.findUnique({
        where: { id: attemptId },
        include: { problemTrack: { select: { slug: true } } },
      });
      if (fullAttempt) {
        await this.faralinEngine.processJourneyMilestoneBonus(
          fullAttempt.studentProfileId,
          fullAttempt.problemTrack.slug,
        );
      }
    }

    return updated;
  }

  private async getAttemptOrThrow(studentProfileId: string, attemptId: string) {
    const attempt = await this.prisma.problemTrackAttempt.findUnique({
      where: { id: attemptId },
      include: {
        stepResponses: { orderBy: { sortOrder: 'asc' } },
        problemTrack: { include: { subject: true } },
      },
    });
    if (!attempt || attempt.studentProfileId !== studentProfileId) {
      throw new NotFoundException('Attempt not found');
    }
    return attempt;
  }

  private assertInProgress(attempt: { status: ProblemTrackAttemptStatus; expiresAt: Date }) {
    if (attempt.status !== ProblemTrackAttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Attempt is no longer in progress');
    }
    if (new Date() > attempt.expiresAt) {
      throw new BadRequestException('Time cap exceeded');
    }
  }

  private isSectionUnlocked(
    section: ProblemTrackSection,
    allSections: ProblemTrackSection[],
    completedResponses: Array<{ sectionId: string; isComplete: boolean }>,
  ): boolean {
    if (!section.unlockRules?.length) return true;
    return section.unlockRules.every((rule) => {
      if (!rule.requiresSectionId) return true;
      const req = completedResponses.find((r) => r.sectionId === rule.requiresSectionId);
      return req?.isComplete ?? false;
    });
  }

  private isStepComplete(section: ProblemTrackSection, response: Record<string, unknown>): boolean {
    if (section.inputs.length === 0) return true;
    return section.inputs
      .filter((i) => i.required)
      .every((i) => {
        const val = response[i.id];
        return val !== undefined && val !== null && String(val).trim() !== '';
      });
  }

  private getNextSection(
    sections: ProblemTrackSection[],
    currentId: string,
    currentComplete: boolean,
  ): ProblemTrackSection | undefined {
    if (!currentComplete) return sections.find((s) => s.id === currentId);
    const idx = sections.findIndex((s) => s.id === currentId);
    return sections[idx + 1];
  }

  private formatAttempt(
    attempt: {
      id: string;
      status: ProblemTrackAttemptStatus;
      startedAt: Date;
      expiresAt: Date;
      completedAt: Date | null;
      currentSectionId: string | null;
      rubricScore: unknown;
      rubricBreakdown: unknown;
      faralinsEarned: number | null;
      awardBandLabel: string | null;
      trustLevel: unknown;
      moderationStatus: unknown;
      finalSubmission: string | null;
      feedbackSummary: unknown;
      stepResponses: Array<{
        sectionId: string;
        sectionType: string;
        response: unknown;
        aiFeedback: unknown;
        isComplete: boolean;
        timeSpentMs: number;
      }>;
    },
    track: {
      slug: string;
      title: string;
      subtitle: string | null;
      sections: unknown;
      timeCapHours: number;
      maxFaralins: number;
      subject?: { name: string; slug: string };
    },
  ) {
    const sections = parseSections(track.sections);
    const completedIds = new Set(
      attempt.stepResponses.filter((r) => r.isComplete).map((r) => r.sectionId),
    );

    const unlockedSections = sections.map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      unlocked: this.isSectionUnlocked(s, sections, attempt.stepResponses),
      complete: completedIds.has(s.id),
    }));

    const msRemaining = Math.max(0, attempt.expiresAt.getTime() - Date.now());

    return {
      attemptId: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      msRemaining,
      currentSectionId: attempt.currentSectionId,
      track: {
        slug: track.slug,
        title: track.title,
        subtitle: track.subtitle,
        maxFaralins: track.maxFaralins,
        subject: track.subject,
      },
      sections: unlockedSections,
      stepResponses: attempt.stepResponses,
      result:
        attempt.completedAt != null
          ? {
              rubricScore: attempt.rubricScore,
              rubricBreakdown: attempt.rubricBreakdown,
              faralinsEarned: attempt.faralinsEarned,
              awardBandLabel: attempt.awardBandLabel,
              trustLevel: attempt.trustLevel,
              moderationStatus: attempt.moderationStatus,
              finalSubmission: attempt.finalSubmission,
              feedbackSummary: attempt.feedbackSummary,
            }
          : null,
      fullSections: sections,
    };
  }
}
