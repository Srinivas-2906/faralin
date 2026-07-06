import { ProblemTrackDifficultyBand, FaralinTrustLevel } from '@prisma/client';

type RubricCategory = {
  name: string;
  weight: number;
  descriptors: { excellent: string; strong: string; developing: string; weak: string };
};

type AwardBand = { minScore: number; percentOfMax: number; label: string };

type ProblemTrackSection = {
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

const learnAiPolicy = {
  allowed: ['explain concepts', 'simplify wording', 'give examples', 'ask checking questions', 'correct misconceptions'],
  forbidden: ['complete final answers', 'write the student full submission'],
};

const practiceAiPolicy = {
  allowed: ['give one hint at a time', 'explain mistakes', 'ask student to retry'],
  forbidden: ['fill the whole table directly unless the student has tried'],
};

const solveAiPolicy = {
  allowed: ['guide next step', 'check working', 'ask clarifying questions'],
  forbidden: ['provide full calculation chain', 'give final probability answer'],
};

const finalBuilderAiPolicy = {
  allowed: ['organise student answers', 'improve grammar', 'identify missing sections', 'ask student to confirm'],
  forbidden: ['invent evidence', 'invent student traits', 'hide mistakes', 'replace weak reasoning without student input'],
};

export const geneticsTrackSections: ProblemTrackSection[] = [
  {
    id: 'orientation',
    type: 'ORIENTATION',
    title: 'What you will do',
    content: `You will learn basic genetic inheritance and probability.

You will solve whether a trait can survive through generations in John and Ali's family, set in the year 2200.

You will create a final investigation with calculations, explanation, and reflection.

You will be marked on reasoning, correct probability work, clarity, and honest limitations.

**Important:** The AI can help you understand, organise, and improve your explanation. It cannot simply give you the final answer.`,
    inputs: [
      {
        id: 'ready_confirm',
        label: 'I understand what I will produce and how I will be judged',
        type: 'multiple_choice',
        required: true,
        options: ['Yes, I am ready to begin'],
      },
    ],
    aiPolicy: learnAiPolicy,
  },
  {
    id: 'story',
    type: 'STORY',
    title: 'Your Genes in 2200',
    content: `It is the year 2200. John and Ali are planning their family. John's grandfather was famously strong — a trait that runs in the family legend.

Scientists in 2200 know that "strength" in this simplified model is controlled by one gene with two alleles: **S** (dominant, shows strength) and **s** (recessive, typical strength).

John's genotype is **Ss**. Ali's genotype is **ss**. They want to know: could their great-great-grandchild still be visibly strong?

Their genetic counsellor asks students like you to investigate — not with a textbook question, but with a real family story and real probability.`,
    inputs: [],
    aiPolicy: learnAiPolicy,
    unlockRules: [{ requiresSectionId: 'orientation' }],
  },
  {
    id: 'core_question',
    type: 'CORE_QUESTION',
    title: 'The core question',
    content: `By the end of this Problem Track, you will answer:

**What is the probability that John's great-great-grandchild is visibly strong, assuming the family marries partners with typical genotypes (ss)?**

You will need to learn inheritance, build Punnett squares, and chain probabilities across four generations.`,
    inputs: [
      {
        id: 'question_restate',
        label: 'In your own words, what must you calculate?',
        type: 'long_text',
        required: true,
        placeholder: 'Restate the question in one or two sentences...',
      },
    ],
    aiPolicy: learnAiPolicy,
    unlockRules: [{ requiresSectionId: 'story' }],
  },
  {
    id: 'learn_1',
    type: 'LEARN',
    title: 'Learn: Key vocabulary',
    content: `**Gene** — a section of DNA that codes for a trait.
**Allele** — a version of a gene (e.g. S or s).
**Dominant** — the allele that shows when present (S).
**Recessive** — only shows when two copies present (ss).
**Genotype** — the alleles someone carries (e.g. Ss).
**Phenotype** — what you observe (visibly strong vs typical).

**Example:** Ss genotype → visibly strong phenotype (S is dominant).`,
    inputs: [
      {
        id: 'vocab_check',
        label: 'If someone has genotype ss, will they be visibly strong in this model?',
        type: 'multiple_choice',
        required: true,
        options: ['Yes', 'No'],
      },
    ],
    aiPolicy: learnAiPolicy,
    unlockRules: [{ requiresSectionId: 'core_question' }],
  },
  {
    id: 'learn_2',
    type: 'LEARN',
    title: 'Learn: Punnett squares and probability chains',
    content: `A **Punnett square** shows possible offspring genotypes from two parents.

For John (Ss) × Ali (ss):
- 50% Ss (visibly strong)
- 50% ss (typical)

**Probability chains:** multiply probabilities across independent generations.
If each generation has 50% chance of passing S to a child who marries ss, track the path carefully.`,
    inputs: [
      {
        id: 'punnett_offspring',
        label: 'What fraction of John and Ali\'s children will be Ss?',
        type: 'multiple_choice',
        required: true,
        options: ['0%', '25%', '50%', '75%', '100%'],
      },
    ],
    aiPolicy: learnAiPolicy,
    unlockRules: [{ requiresSectionId: 'learn_1' }],
  },
  {
    id: 'practice',
    type: 'PRACTICE',
    title: 'Practice: One Punnett square',
    content: `Before the full inheritance chain, complete one Punnett square.

Parent 1: **Ss** (John)
Parent 2: **ss** (Ali)

Fill in the four boxes with the possible offspring genotypes.`,
    inputs: [
      {
        id: 'box_1',
        label: 'Top-left offspring genotype',
        type: 'short_text',
        required: true,
        placeholder: 'e.g. Ss',
      },
      {
        id: 'box_2',
        label: 'Top-right offspring genotype',
        type: 'short_text',
        required: true,
        placeholder: 'e.g. ss',
      },
      {
        id: 'box_3',
        label: 'Bottom-left offspring genotype',
        type: 'short_text',
        required: true,
        placeholder: 'e.g. Ss',
      },
      {
        id: 'box_4',
        label: 'Bottom-right offspring genotype',
        type: 'short_text',
        required: true,
        placeholder: 'e.g. ss',
      },
    ],
    aiPolicy: practiceAiPolicy,
    unlockRules: [{ requiresSectionId: 'learn_2' }],
  },
  {
    id: 'solve_1',
    type: 'SOLVE',
    title: 'Main solve: Generation 1',
    content: `Start the investigation. Generation 1 is John (Ss) and Ali (ss).

Calculate:
1. Probability their child carries S (dominant allele)
2. Probability their child is visibly strong (phenotype)`,
    inputs: [
      {
        id: 'gen1_prob_S',
        label: 'Probability child carries at least one S allele',
        type: 'short_text',
        required: true,
        placeholder: 'e.g. 0.5 or 50%',
      },
      {
        id: 'gen1_explanation',
        label: 'Show your Punnett square reasoning',
        type: 'long_text',
        required: true,
      },
    ],
    aiPolicy: solveAiPolicy,
    unlockRules: [{ requiresSectionId: 'practice' }],
  },
  {
    id: 'solve_2',
    type: 'SOLVE',
    title: 'Main solve: Four-generation probability chain',
    content: `Assume each generation marries a partner with genotype **ss** (typical).

Track the probability that the **great-great-grandchild** (Generation 4 descendant) is **visibly strong**.

Show each step. Multiply probabilities across generations.`,
    inputs: [
      {
        id: 'gen_chain',
        label: 'Your step-by-step probability calculation',
        type: 'long_text',
        required: true,
      },
      {
        id: 'final_probability',
        label: 'Final probability (decimal or percentage)',
        type: 'short_text',
        required: true,
        placeholder: 'e.g. 0.0625 or 6.25%',
      },
    ],
    aiPolicy: solveAiPolicy,
    unlockRules: [{ requiresSectionId: 'solve_1' }],
  },
  {
    id: 'personalise',
    type: 'PERSONALISE',
    title: 'Personal application: Your traits',
    content: `Apply the same model to **your own** three traits (simplified single-gene model for practice).

Choose three observable traits (e.g. attached earlobes, tongue rolling, widow's peak). For each, note whether you show the dominant or recessive phenotype and hypothesise your genotype.`,
    inputs: [
      {
        id: 'trait_1',
        label: 'Trait 1: name, your phenotype, hypothesised genotype',
        type: 'long_text',
        required: true,
      },
      {
        id: 'trait_2',
        label: 'Trait 2: name, your phenotype, hypothesised genotype',
        type: 'long_text',
        required: true,
      },
      {
        id: 'trait_3',
        label: 'Trait 3: name, your phenotype, hypothesised genotype',
        type: 'long_text',
        required: true,
      },
      {
        id: 'trait_ranking',
        label: 'Rank your three traits by how confident you are in your genotype guess (and why)',
        type: 'long_text',
        required: true,
      },
    ],
    aiPolicy: solveAiPolicy,
    unlockRules: [{ requiresSectionId: 'solve_2' }],
  },
  {
    id: 'reflect',
    type: 'REFLECT',
    title: 'Model limitations',
    content: `Real genetics is more complex than this model. Strength is not controlled by one simple gene — training, diet, sleep, and polygenic inheritance all matter.

Answer honestly:`,
    inputs: [
      {
        id: 'assumptions',
        label: 'What assumptions did we make in this model?',
        type: 'long_text',
        required: true,
      },
      {
        id: 'unrealistic',
        label: 'Which assumptions are unrealistic for real strength inheritance?',
        type: 'long_text',
        required: true,
      },
      {
        id: 'better_data',
        label: 'What data would improve the answer?',
        type: 'long_text',
        required: true,
      },
    ],
    aiPolicy: learnAiPolicy,
    unlockRules: [{ requiresSectionId: 'personalise' }],
  },
  {
    id: 'final_builder',
    type: 'FINAL_BUILDER',
    title: 'Build your final investigation',
    content: `Use the AI helper to assemble your earlier answers into a polished investigation (700–1,200 words).

The draft will combine: opening, vocabulary, traits, Punnett square, generation calculation, probability chain, trait comparison, and limitation paragraph.

**You must edit the draft before submission.**`,
    inputs: [
      {
        id: 'final_draft',
        label: 'Your final investigation (edit the AI draft)',
        type: 'long_text',
        required: true,
        placeholder: 'Click "Generate draft" to start, then edit...',
      },
    ],
    aiPolicy: finalBuilderAiPolicy,
    unlockRules: [{ requiresSectionId: 'reflect' }],
  },
  {
    id: 'review',
    type: 'REVIEW',
    title: 'Review before submit',
    content: `Check your final investigation:
- [ ] Core question answered with a probability
- [ ] Calculations shown
- [ ] Personal traits included
- [ ] Limitations discussed
- [ ] Written in your own words`,
    inputs: [
      {
        id: 'review_confirm',
        label: 'I confirm this submission is my own work with permitted AI assistance',
        type: 'multiple_choice',
        required: true,
        options: ['I confirm and am ready to submit'],
      },
    ],
    aiPolicy: finalBuilderAiPolicy,
    unlockRules: [{ requiresSectionId: 'final_builder' }],
  },
  {
    id: 'submit',
    type: 'SUBMIT',
    title: 'Submit',
    content: `Once submitted, your work is locked and will be scored using the rubric. Faralins are awarded based on quality, not effort alone.

Time remaining will be shown in the header.`,
    inputs: [],
    aiPolicy: { allowed: ['completeness check'], forbidden: ['modify answers'] },
    unlockRules: [{ requiresSectionId: 'review' }],
  },
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

export const problemTrackDefs: ProblemTrackSeedDef[] = [
  {
    trackId: 'BIO-GEN-ADV-001',
    slug: 'your-genes-in-2200',
    title: 'Your Genes in 2200',
    subtitle: 'Learn the basics. Solve a real problem. Present the answer.',
    subjectSlug: 'biology',
    secondarySubjectSlug: 'mathematics',
    difficultyBand: ProblemTrackDifficultyBand.ADVANCED,
    yearLevels: ['Year 11', 'Year 12', 'GCSE', 'IGCSE', 'IB', 'A-Level'],
    timeCapHours: 144,
    estimatedHoursMin: 3,
    estimatedHoursMax: 5,
    maxFaralins: 55000,
    bursaryValueApproxGbp: 220,
    outputType: 'Investigation',
    partnerUniversityCategories: ['Biology', 'Medicine', 'Genetics', 'Biomedical Sciences', 'Data Science', 'Natural Sciences'],
    skills: ['Probability', 'inheritance', 'modelling', 'explanation'],
    prerequisites: ['Basic genetics', 'fractions', 'percentages'],
    regionCompatibility: ['UK', 'India', 'US', 'international'],
    trustLevel: FaralinTrustLevel.PARTNER_VERIFIED,
    sections: geneticsTrackSections,
    rubric: defaultScienceRubric,
    awardBands: advancedAwardBands,
    moderationRules: {
      humanModerationAboveScore: 95,
      humanModerationOnLowTrust: true,
      plagiarismCheckRequired: true,
    },
  },
];
