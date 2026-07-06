import { Injectable } from '@nestjs/common';
import { ModerationStatus, SubmissionTrustLevel } from '@faralin/db';
import { CopyleaksService } from './copyleaks.service';

export interface TrustEvaluation {
  trustLevel: SubmissionTrustLevel;
  moderationStatus: ModerationStatus;
  verificationFlags: Record<string, unknown>;
}

@Injectable()
export class TrustService {
  constructor(private copyleaks: CopyleaksService) {}

  async evaluate(params: {
    stepResponses: Array<{
      sectionId: string;
      timeSpentMs: number;
      copyPasteCount: number;
      response: Record<string, unknown>;
    }>;
    finalSubmission: string;
    startedAt: Date;
    completedAt: Date;
    moderationRules?: {
      humanModerationAboveScore?: number;
      humanModerationOnLowTrust?: boolean;
      plagiarismCheckRequired?: boolean;
    };
    rubricScore?: number;
  }): Promise<TrustEvaluation> {
    const flags: Record<string, unknown> = {};
    let trustScore = 100;

    const totalTimeMs = params.completedAt.getTime() - params.startedAt.getTime();
    const totalTimeMinutes = totalTimeMs / 60000;
    flags.totalTimeMinutes = Math.round(totalTimeMinutes);

    const minExpectedMinutes = 15;
    if (totalTimeMinutes < minExpectedMinutes) {
      trustScore -= 25;
      flags.suspiciouslyFast = true;
    }

    const totalCopyPaste = params.stepResponses.reduce((s, r) => s + r.copyPasteCount, 0);
    flags.totalCopyPasteEvents = totalCopyPaste;
    if (totalCopyPaste > 20) {
      trustScore -= 15;
      flags.highCopyPaste = true;
    }

    const shortSteps = params.stepResponses.filter(
      (r) => r.timeSpentMs < 5000 && Object.keys(r.response).length > 0,
    );
    flags.shortStepCount = shortSteps.length;
    if (shortSteps.length > 3) {
      trustScore -= 10;
      flags.rushedSteps = true;
    }

    const personalise = params.stepResponses.find((r) => r.sectionId === 'personalise');
    if (personalise) {
      const personalText = JSON.stringify(personalise.response).toLowerCase();
      const genericPhrases = ['example trait', 'lorem ipsum', 'test answer', 'asdf'];
      if (genericPhrases.some((p) => personalText.includes(p))) {
        trustScore -= 20;
        flags.genericPersonalisation = true;
      } else {
        flags.hasPersonalisation = true;
      }
    }

    const finalWords = params.finalSubmission.split(/\s+/).filter(Boolean).length;
    flags.finalWordCount = finalWords;
    if (finalWords < 150) {
      trustScore -= 15;
      flags.shortFinalSubmission = true;
    }

    const stepText = params.stepResponses.map((r) => JSON.stringify(r.response)).join(' ');
    const overlap = this.textOverlap(stepText, params.finalSubmission);
    flags.stepToFinalOverlap = overlap;
    if (overlap < 0.1 && finalWords > 200) {
      trustScore -= 20;
      flags.finalInconsistentWithSteps = true;
    }

    if (params.moderationRules?.plagiarismCheckRequired) {
      const plagiarism = await this.copyleaks.scanText(params.finalSubmission);
      flags.plagiarismScan = plagiarism;
      if (plagiarism.aiScore && plagiarism.aiScore > 0.85) {
        trustScore -= 20;
        flags.highAiContent = true;
      }
      if (plagiarism.similarityScore && plagiarism.similarityScore > 0.4) {
        trustScore -= 25;
        flags.highSimilarity = true;
      }
    }

    trustScore = Math.max(0, Math.min(100, trustScore));
    flags.trustScoreNumeric = trustScore;

    let trustLevel: SubmissionTrustLevel;
    if (trustScore >= 75) trustLevel = SubmissionTrustLevel.HIGH;
    else if (trustScore >= 50) trustLevel = SubmissionTrustLevel.MEDIUM;
    else trustLevel = SubmissionTrustLevel.LOW;

    let moderationStatus: ModerationStatus = ModerationStatus.AUTO_APPROVED;
    const rules = params.moderationRules;
    if (
      (rules?.humanModerationOnLowTrust && trustLevel === SubmissionTrustLevel.LOW) ||
      (rules?.humanModerationAboveScore != null &&
        params.rubricScore != null &&
        params.rubricScore >= rules.humanModerationAboveScore &&
        trustLevel !== SubmissionTrustLevel.HIGH)
    ) {
      moderationStatus = ModerationStatus.NEEDS_REVIEW;
    }

    return { trustLevel, moderationStatus, verificationFlags: flags };
  }

  private textOverlap(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 4));
    const wordsB = new Set(b.toLowerCase().split(/\W+/).filter((w) => w.length > 4));
    if (wordsB.size === 0) return 0;
    let overlap = 0;
    for (const w of wordsB) {
      if (wordsA.has(w)) overlap++;
    }
    return overlap / wordsB.size;
  }
}
