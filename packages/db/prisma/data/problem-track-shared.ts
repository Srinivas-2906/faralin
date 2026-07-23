import { ProblemTrackDifficultyBand, FaralinTrustLevel } from '@prisma/client';

export type RubricCategory = {
  name: string;
  weight: number;
  descriptors: { excellent: string; strong: string; developing: string; weak: string };
};

export type AwardBand = { minScore: number; percentOfMax: number; label: string };

export type ProblemTrackSection = {
  id: string;
  type: string;
  title: string;
  content: string;
  inputs: Array<{
    id: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
  }>;
  aiPolicy: { allowed: string[]; forbidden: string[] };
  unlockRules?: { requiresSectionId?: string }[];
  sectionRewardFaralins?: number;
};

export const defaultScienceRubric: RubricCategory[] = [
  {
    name: 'Scientific understanding',
    weight: 20,
    descriptors: {
      excellent: 'Accurate use of genetics vocabulary and inheritance concepts throughout.',
      strong: 'Most concepts used correctly with minor gaps.',
      developing: 'Basic understanding shown but key terms misused.',
      weak: 'Little evidence of scientific understanding.',
    },
  },
  {
    name: 'Correct use of method',
    weight: 20,
    descriptors: {
      excellent: 'Punnett squares and probability chains applied systematically.',
      strong: 'Method mostly correct with small procedural errors.',
      developing: 'Method attempted but inconsistently applied.',
      weak: 'No clear method demonstrated.',
    },
  },
  {
    name: 'Data/calculation accuracy',
    weight: 20,
    descriptors: {
      excellent: 'Calculations correct and clearly shown.',
      strong: 'Most calculations correct with minor errors.',
      developing: 'Some correct steps but final answers unreliable.',
      weak: 'Calculations missing or largely incorrect.',
    },
  },
  {
    name: 'Explanation quality',
    weight: 15,
    descriptors: {
      excellent: 'Clear, logical explanation accessible to a peer reader.',
      strong: 'Generally clear with occasional confusion.',
      developing: 'Explanation present but hard to follow.',
      weak: 'Minimal or unclear explanation.',
    },
  },
  {
    name: 'Application to own example',
    weight: 10,
    descriptors: {
      excellent: 'Personal traits analysed with same rigour as main case.',
      strong: 'Personal application attempted with reasonable detail.',
      developing: 'Superficial personal application.',
      weak: 'No meaningful personal application.',
    },
  },
  {
    name: 'Limitations and assumptions',
    weight: 10,
    descriptors: {
      excellent: 'Honest, specific critique of model limits (polygenic traits, environment).',
      strong: 'Some limitations identified.',
      developing: 'Vague mention of limitations.',
      weak: 'No reflection on limitations.',
    },
  },
  {
    name: 'Presentation',
    weight: 5,
    descriptors: {
      excellent: 'Well-structured investigation with clear sections.',
      strong: 'Organised with minor formatting issues.',
      developing: 'Disorganised but readable.',
      weak: 'Very difficult to follow.',
    },
  },
];

export const advancedAwardBands: AwardBand[] = [
  { minScore: 95, percentOfMax: 1.0, label: 'Exceptional' },
  { minScore: 85, percentOfMax: 0.75, label: 'Excellent' },
  { minScore: 70, percentOfMax: 0.45, label: 'Strong' },
  { minScore: 55, percentOfMax: 0.2, label: 'Developing' },
  { minScore: 0, percentOfMax: 0, label: 'Not yet recognised' },
];

export type ProblemTrackSeedDef = {
  trackId: string;
  slug: string;
  title: string;
  subtitle: string;
  subjectSlug: string;
  secondarySubjectSlug: string;
  difficultyBand: ProblemTrackDifficultyBand;
  yearLevels: string[];
  timeCapHours: number;
  estimatedHoursMin: number;
  estimatedHoursMax: number;
  maxFaralins: number;
  bursaryValueApproxGbp: number;
  outputType: string;
  partnerUniversityCategories: string[];
  skills: string[];
  prerequisites: string[];
  regionCompatibility: string[];
  trustLevel: FaralinTrustLevel;
  sections: ProblemTrackSection[];
  rubric: RubricCategory[];
  awardBands: AwardBand[];
  moderationRules: {
    humanModerationAboveScore: number;
    humanModerationOnLowTrust: boolean;
    plagiarismCheckRequired: boolean;
  };
};
