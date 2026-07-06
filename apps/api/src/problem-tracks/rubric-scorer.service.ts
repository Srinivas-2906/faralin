import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AwardBand, RubricCategory } from '@faralin/types';

export interface RubricScoreResult {
  totalScore: number;
  breakdown: Array<{ name: string; weight: number; score: number; feedback: string }>;
  strengths: string[];
  improvements: string[];
  awardBand: AwardBand;
  faralinsEarned: number;
}

@Injectable()
export class RubricScorerService {
  constructor(private config: ConfigService) {}

  async scoreSubmission(params: {
    rubric: RubricCategory[];
    awardBands: AwardBand[];
    maxFaralins: number;
    stepResponses: Array<{ sectionId: string; sectionType: string; response: Record<string, unknown> }>;
    finalSubmission: string;
    trackContext: string;
  }): Promise<RubricScoreResult> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');

    if (apiKey) {
      try {
        return await this.llmScore(apiKey, params);
      } catch {
        // fall through
      }
    }

    return this.heuristicScore(params);
  }

  private async llmScore(
    apiKey: string,
    params: Parameters<RubricScorerService['scoreSubmission']>[0],
  ): Promise<RubricScoreResult> {
    const rubricText = params.rubric
      .map((c) => `${c.name} (${c.weight}%): excellent=${c.descriptors.excellent}`)
      .join('\n');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Score student work using ONLY the provided step answers and final submission. Return JSON: { "breakdown": [{ "name", "score" (0-100), "feedback" }], "strengths": [], "improvements": [] }. Weights: ${params.rubric.map((r) => `${r.name}:${r.weight}`).join(', ')}`,
          },
          {
            role: 'user',
            content: `Context: ${params.trackContext}\n\nSteps:\n${JSON.stringify(params.stepResponses)}\n\nFinal:\n${params.finalSubmission}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!res.ok) throw new Error('LLM scoring failed');
    const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    const parsed = JSON.parse(data.choices[0].message.content) as {
      breakdown: Array<{ name: string; score: number; feedback: string }>;
      strengths: string[];
      improvements: string[];
    };

    const breakdown = params.rubric.map((cat) => {
      const match = parsed.breakdown.find((b) => b.name.toLowerCase() === cat.name.toLowerCase()) ??
        parsed.breakdown.find((b) => b.name.includes(cat.name.split(' ')[0] ?? ''));
      const score = Math.min(100, Math.max(0, match?.score ?? 60));
      return {
        name: cat.name,
        weight: cat.weight,
        score,
        feedback: match?.feedback ?? 'Reviewed.',
      };
    });

    const totalScore = breakdown.reduce((sum, b) => sum + (b.score * b.weight) / 100, 0);
    const awardBand = this.resolveBand(params.awardBands, totalScore);
    const faralinsEarned = Math.round(params.maxFaralins * awardBand.percentOfMax);

    return {
      totalScore: Math.round(totalScore * 10) / 10,
      breakdown,
      strengths: parsed.strengths ?? [],
      improvements: parsed.improvements ?? [],
      awardBand,
      faralinsEarned,
    };
  }

  private heuristicScore(params: Parameters<RubricScorerService['scoreSubmission']>[0]): RubricScoreResult {
    const allText = [
      params.finalSubmission,
      ...params.stepResponses.map((s) => JSON.stringify(s.response)),
    ].join(' ').toLowerCase();

    const wordCount = params.finalSubmission.split(/\s+/).filter(Boolean).length;
    const hasProbability =
      allText.includes('0.0625') ||
      allText.includes('6.25') ||
      allText.includes('probability') ||
      allText.includes('%');
    const hasPunnett =
      allText.includes('punnett') || allText.includes('ss') || allText.includes('ss');
    const hasReflection =
      allText.includes('assumption') ||
      allText.includes('limitation') ||
      allText.includes('polygenic') ||
      allText.includes('environment');
    const hasPersonal =
      params.stepResponses.some((s) => s.sectionId === 'personalise' && Object.keys(s.response).length >= 3);

    const breakdown = params.rubric.map((cat) => {
      let score = 55;
      const name = cat.name.toLowerCase();

      if (name.includes('understanding') || name.includes('scientific')) {
        score = hasPunnett ? 78 : 55;
      } else if (name.includes('method')) {
        score = hasPunnett ? 75 : 50;
      } else if (name.includes('calculation') || name.includes('data')) {
        score = hasProbability ? 82 : 48;
      } else if (name.includes('explanation') || name.includes('communication')) {
        score = wordCount > 200 ? 80 : wordCount > 100 ? 65 : 45;
      } else if (name.includes('application') || name.includes('personal')) {
        score = hasPersonal ? 85 : 40;
      } else if (name.includes('limitation') || name.includes('reflection')) {
        score = hasReflection ? 88 : 50;
      } else if (name.includes('presentation')) {
        score = wordCount > 400 ? 85 : wordCount > 200 ? 70 : 55;
      }

      return {
        name: cat.name,
        weight: cat.weight,
        score,
        feedback: score >= 80 ? cat.descriptors.excellent : score >= 65 ? cat.descriptors.strong : cat.descriptors.developing,
      };
    });

    const totalScore = Math.round(breakdown.reduce((sum, b) => sum + (b.score * b.weight) / 100, 0) * 10) / 10;
    const awardBand = this.resolveBand(params.awardBands, totalScore);
    const faralinsEarned = Math.round(params.maxFaralins * awardBand.percentOfMax);

    const strengths: string[] = [];
    const improvements: string[] = [];
    for (const b of breakdown) {
      if (b.score >= 75) strengths.push(b.name);
      else if (b.score < 65) improvements.push(`Strengthen ${b.name.toLowerCase()}`);
    }

    return { totalScore, breakdown, strengths, improvements, awardBand, faralinsEarned };
  }

  resolveBand(bands: AwardBand[], score: number): AwardBand {
    const sorted = [...bands].sort((a, b) => b.minScore - a.minScore);
    return sorted.find((b) => score >= b.minScore) ?? sorted[sorted.length - 1]!;
  }
}
