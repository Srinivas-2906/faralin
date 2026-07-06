import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ProblemSectionType } from '@faralin/types';

const PHASE_PROMPTS: Record<string, string> = {
  ORIENTATION: `You are a Socratic tutor for Faralin Problem Tracks. Explain orientation content clearly. Do NOT give final answers. Ask one checking question if helpful.`,
  STORY: `You help students understand the story context. Clarify characters and setting only. Never solve the academic problem.`,
  CORE_QUESTION: `Help the student restate the core question in their own words. Do not provide the answer or calculation.`,
  LEARN: `Explain concepts simply with examples. Correct misconceptions. Never complete the student's final answer or write their submission.`,
  PRACTICE: `Give ONE hint at a time. Point out specific mistakes (e.g. "one box in your Punnett square is wrong"). Do not fill the whole table unless the student has tried twice.`,
  SOLVE: `Guide the next logical step only. Ask clarifying questions. Never provide the full calculation chain or final probability.`,
  PERSONALISE: `Help students think about their own traits. Do not invent traits or genotypes for them.`,
  REFLECT: `Prompt deeper thinking about assumptions and limitations. Do not write the reflection for them.`,
  FINAL_BUILDER: `Organise the student's OWN earlier answers into clearer prose. Improve grammar only. Flag missing sections. Never invent evidence or student data.`,
  REVIEW: `Help the student check completeness against the checklist. Do not rewrite their work.`,
  SUBMIT: `Confirm submission readiness only. No answer help.`,
};

@Injectable()
export class AiTutorService {
  constructor(private config: ConfigService) {}

  async getFeedback(params: {
    sectionType: ProblemSectionType;
    sectionTitle: string;
    sectionContent: string;
    studentResponse: Record<string, unknown>;
    aiPolicy: { allowed: string[]; forbidden: string[] };
    priorResponses?: Record<string, unknown>;
    userMessage?: string;
  }): Promise<{ message: string; source: 'llm' | 'rules' }> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    const phasePrompt = PHASE_PROMPTS[params.sectionType] ?? PHASE_PROMPTS.LEARN;

    if (apiKey) {
      try {
        const message = await this.callOpenAI(apiKey, phasePrompt, params);
        return { message, source: 'llm' };
      } catch {
        // fall through to rules
      }
    }

    return { message: this.ruleBasedFeedback(params), source: 'rules' };
  }

  async buildFinalDraft(params: {
    trackTitle: string;
    stepResponses: Array<{ sectionId: string; sectionTitle: string; response: Record<string, unknown> }>;
  }): Promise<string> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');

    if (apiKey) {
      try {
        return await this.callOpenAIForDraft(apiKey, params);
      } catch {
        // fall through
      }
    }

    return this.templateFinalDraft(params);
  }

  private async callOpenAI(
    apiKey: string,
    phasePrompt: string,
    params: {
      sectionTitle: string;
      sectionContent: string;
      studentResponse: Record<string, unknown>;
      aiPolicy: { allowed: string[]; forbidden: string[] };
      userMessage?: string;
    },
  ): Promise<string> {
    const system = `${phasePrompt}

Allowed: ${params.aiPolicy.allowed.join(', ')}
Forbidden: ${params.aiPolicy.forbidden.join(', ')}

Keep responses under 150 words. Be encouraging but never give away final answers.`;

    const userContent = params.userMessage
      ? params.userMessage
      : `Section: ${params.sectionTitle}\n\nContent:\n${params.sectionContent}\n\nStudent response:\n${JSON.stringify(params.studentResponse, null, 2)}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userContent },
        ],
        max_tokens: 300,
        temperature: 0.4,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
    const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content ?? 'Review your answer and try again.';
  }

  private async callOpenAIForDraft(
    apiKey: string,
    params: {
      trackTitle: string;
      stepResponses: Array<{ sectionId: string; sectionTitle: string; response: Record<string, unknown> }>;
    },
  ): Promise<string> {
    const system = `You assemble a student investigation report from their step answers ONLY. Do not invent data. Use their exact traits and calculations. Structure: Introduction, Vocabulary, Main calculation, Personal traits, Limitations, Conclusion. 700-1200 words.`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: `Track: ${params.trackTitle}\n\nStudent step answers:\n${JSON.stringify(params.stepResponses, null, 2)}`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
    const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content ?? this.templateFinalDraft(params);
  }

  private ruleBasedFeedback(params: {
    sectionType: ProblemSectionType;
    sectionTitle: string;
    studentResponse: Record<string, unknown>;
  }): string {
    const responseStr = JSON.stringify(params.studentResponse).toLowerCase();

    if (params.sectionType === 'LEARN') {
      if (responseStr.includes('no') || responseStr.includes('ss')) {
        return 'Good — ss genotype means two recessive alleles, so the dominant strength trait would not show. Continue to the next section.';
      }
      return 'Review the vocabulary: dominant alleles show with one copy (Ss), recessive needs two (ss). Try again if unsure.';
    }

    if (params.sectionType === 'PRACTICE') {
      const boxes = ['box_1', 'box_2', 'box_3', 'box_4'].map((k) =>
        String(params.studentResponse[k] ?? '').toLowerCase().replace(/\s/g, ''),
      );
      const expected = ['ss', 'ss', 'ss', 'ss'];
      const correct = boxes.filter((b, i) => b === expected[i] || (b === 'ss' && expected[i] === 'ss')).length;
      if (boxes.every((b) => b === 'ss' || b === 'ss')) {
        // Ss x ss gives Ss, ss, Ss, ss
        const proper = boxes[0] === 'ss' && boxes[1] === 'ss';
        if (!proper) {
          const altCorrect = boxes.join(',') === 'ss,ss,ss,ss' || boxes.filter((b) => b === 'ss' || b === 'ss').length >= 2;
          if (boxes.some((b) => b === 'ss') && boxes.some((b) => b === 'ss')) {
            return 'Check your Punnett square: Ss × ss should give two Ss and two ss outcomes. One box may be swapped — try again.';
          }
        }
      }
      if (boxes.filter((b) => b === 'ss' || b === 'ss').length === 4) {
        return 'Your Punnett square looks reasonable. Remember: Ss parent × ss parent gives 50% Ss and 50% ss. Continue when ready.';
      }
      return 'For Ss × ss: list offspring as Ss, ss, Ss, ss in the four boxes. Check each allele pairing.';
    }

    if (params.sectionType === 'SOLVE') {
      if (responseStr.includes('0.0625') || responseStr.includes('6.25')) {
        return 'Your final probability looks in the right range. Make sure each generation step is shown clearly.';
      }
      return 'Work step by step: multiply the probability of passing S through each generation. What is P(S) for John×Ali\'s child?';
    }

    if (params.sectionType === 'REFLECT') {
      if (responseStr.length > 100) {
        return 'Strong reflection. Consider mentioning polygenic inheritance or environmental factors like training if you have not already.';
      }
      return 'Think about: single-gene assumption, environment, and whether "strength" is really one gene. What would a genetic counsellor caution?';
    }

    return `Good progress on "${params.sectionTitle}". Review the section content and refine your answer before continuing.`;
  }

  private templateFinalDraft(params: {
    trackTitle: string;
    stepResponses: Array<{ sectionId: string; sectionTitle: string; response: Record<string, unknown> }>;
  }): string {
    const bySection = Object.fromEntries(params.stepResponses.map((s) => [s.sectionId, s]));

    const solve2 = bySection['solve_2']?.response as Record<string, string> | undefined;
    const personalise = bySection['personalise']?.response as Record<string, string> | undefined;
    const reflect = bySection['reflect']?.response as Record<string, string> | undefined;

    return `# ${params.trackTitle} — Investigation Report

## Introduction
In the year 2200, John (Ss) and Ali (ss) ask whether a visibly strong trait could appear in their great-great-grandchild. This investigation uses simplified Mendelian inheritance and probability chains.

## Key vocabulary
Dominant allele S shows visible strength; recessive ss shows typical strength. Genotype determines phenotype in this model.

## Main calculation
${solve2?.gen_chain ?? '[Your generation chain calculation]'}

**Final probability:** ${solve2?.final_probability ?? '[Your answer]'}

## Personal trait analysis
${personalise?.trait_1 ?? ''}

${personalise?.trait_2 ?? ''}

${personalise?.trait_3 ?? ''}

**Confidence ranking:** ${personalise?.trait_ranking ?? ''}

## Limitations
**Assumptions:** ${reflect?.assumptions ?? ''}

**Unrealistic elements:** ${reflect?.unrealistic ?? ''}

**Better data needed:** ${reflect?.better_data ?? ''}

## Conclusion
The model gives a simplified probability answer, but real strength involves many genes and environmental factors. A genetic counsellor would recommend broader testing before family planning decisions.
`;
  }
}
