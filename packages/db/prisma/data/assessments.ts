import { AssessmentDifficulty, FaralinTrustLevel } from '@prisma/client';

type McqOptions = [string, string, string, string];

export type QuestionSeedDef = {
  prompt: string;
  questionType: 'MCQ' | 'SHORT_ANSWER';
  options?: McqOptions;
  correctAnswer: string;
};

export type AssessmentSeedDef = {
  slug: string;
  title: string;
  description: string;
  subjectSlug:
    | 'mathematics'
    | 'physics'
    | 'biology'
    | 'chemistry'
    | 'english'
    | 'history'
    | 'economics'
    | 'computer-science'
    | 'psychology'
    | 'geography';
  difficulty: AssessmentDifficulty;
  trustLevel: FaralinTrustLevel;
  estimatedFaralinMin: number;
  estimatedFaralinMax: number;
  isTimed?: boolean;
  durationMinutes?: number;
  questions: QuestionSeedDef[];
};

type QuestionBank = {
  mcq: Array<{ prompt: string; options: McqOptions; correctAnswer: string }>;
  shortAnswers: Array<{ prompt: string; correctAnswer: string }>;
};

const mcq = (prompt: string, options: McqOptions, correctAnswer: string): QuestionSeedDef => ({
  prompt,
  questionType: 'MCQ',
  options,
  correctAnswer,
});

const shortAnswer = (prompt: string, correctAnswer: string): QuestionSeedDef => ({
  prompt,
  questionType: 'SHORT_ANSWER',
  correctAnswer,
});

const buildPracticeQuestions = (bank: QuestionBank, offset = 0): QuestionSeedDef[] =>
  bank.mcq.slice(offset, offset + 6).map((q) => mcq(q.prompt, q.options, q.correctAnswer));

const buildVerifiedQuestions = (bank: QuestionBank): QuestionSeedDef[] => [
  ...bank.mcq.slice(0, 4).map((q) => mcq(q.prompt, q.options, q.correctAnswer)),
  ...bank.shortAnswers.slice(0, 2).map((q) => shortAnswer(q.prompt, q.correctAnswer)),
];

const buildPartnerQuestions = (bank: QuestionBank): QuestionSeedDef[] => [
  ...bank.mcq.slice(2, 6).map((q) => mcq(q.prompt, q.options, q.correctAnswer)),
  ...bank.shortAnswers.slice(0, 2).map((q) => shortAnswer(q.prompt, q.correctAnswer)),
];

const questionBanks: Record<AssessmentSeedDef['subjectSlug'], QuestionBank> = {
  mathematics: {
    mcq: [
      {
        prompt: 'What is 15% of 200?',
        options: ['20', '30', '25', '35'],
        correctAnswer: '30',
      },
      {
        prompt: 'Solve 2x + 5 = 15.',
        options: ['3', '4', '5', '6'],
        correctAnswer: '5',
      },
      {
        prompt: 'Expand (x + 3)(x + 2).',
        options: ['x^2 + 5x + 6', 'x^2 + 6x + 5', 'x^2 + x + 6', 'x^2 + 6'],
        correctAnswer: 'x^2 + 5x + 6',
      },
      {
        prompt: 'The gradient of y = 4x - 7 is:',
        options: ['-7', '4', '7', '-4'],
        correctAnswer: '4',
      },
      {
        prompt: 'What is sin(30 degrees)?',
        options: ['1', '0.5', '0.707', '0'],
        correctAnswer: '0.5',
      },
      {
        prompt: 'Differentiate y = 3x^2 + 2x.',
        options: ['6x + 2', '3x + 2', '6x', '3x^2'],
        correctAnswer: '6x + 2',
      },
      {
        prompt: 'If f(x) = 2x + 1, find f(4).',
        options: ['7', '8', '9', '10'],
        correctAnswer: '9',
      },
      {
        prompt: 'The nth term for 3, 7, 11, 15 is:',
        options: ['4n - 1', '4n + 1', '3n + 1', 'n + 3'],
        correctAnswer: '4n - 1',
      },
    ],
    shortAnswers: [
      {
        prompt: 'State the quadratic formula for ax^2 + bx + c = 0.',
        correctAnswer: 'x = (-b ± sqrt(b^2 - 4ac)) / 2a',
      },
      {
        prompt: 'Explain in one sentence what a derivative represents.',
        correctAnswer: 'instantaneous rate of change',
      },
    ],
  },
  physics: {
    mcq: [
      {
        prompt: 'What is the SI unit of force?',
        options: ['Newton', 'Joule', 'Watt', 'Pascal'],
        correctAnswer: 'Newton',
      },
      {
        prompt: 'Speed is calculated by:',
        options: ['distance / time', 'time / distance', 'mass / volume', 'force / area'],
        correctAnswer: 'distance / time',
      },
      {
        prompt: 'Which wave is longitudinal?',
        options: ['Light', 'Radio', 'Sound', 'X-ray'],
        correctAnswer: 'Sound',
      },
      {
        prompt: 'The energy transferred per second is:',
        options: ['Voltage', 'Power', 'Current', 'Resistance'],
        correctAnswer: 'Power',
      },
      {
        prompt: 'Which particle has a negative charge?',
        options: ['Proton', 'Neutron', 'Electron', 'Photon'],
        correctAnswer: 'Electron',
      },
      {
        prompt: 'For a fixed resistor, if voltage doubles then current:',
        options: ['halves', 'doubles', 'stays zero', 'quadruples resistance'],
        correctAnswer: 'doubles',
      },
      {
        prompt: 'Which process transfers heat without particles moving overall?',
        options: ['Conduction', 'Convection', 'Evaporation', 'Condensation'],
        correctAnswer: 'Conduction',
      },
      {
        prompt: 'The resultant force on an object moving at constant velocity is:',
        options: ['zero', 'equal to weight', 'equal to mass', 'always upward'],
        correctAnswer: 'zero',
      },
    ],
    shortAnswers: [
      {
        prompt: "State Newton's second law in equation form.",
        correctAnswer: 'F = ma',
      },
      {
        prompt: 'Define momentum.',
        correctAnswer: 'mass times velocity',
      },
    ],
  },
  biology: {
    mcq: [
      {
        prompt: 'Which organelle controls cell activities?',
        options: ['Nucleus', 'Ribosome', 'Mitochondrion', 'Cell membrane'],
        correctAnswer: 'Nucleus',
      },
      {
        prompt: 'Photosynthesis mainly occurs in:',
        options: ['Nucleus', 'Chloroplasts', 'Cytoplasm', 'Vacuoles'],
        correctAnswer: 'Chloroplasts',
      },
      {
        prompt: 'DNA stands for:',
        options: [
          'Deoxyribonucleic acid',
          'Dinitrogen amino acid',
          'Double nucleic array',
          'Dynamic ribose acid',
        ],
        correctAnswer: 'Deoxyribonucleic acid',
      },
      {
        prompt: 'Diffusion is movement of particles from:',
        options: [
          'low to high concentration',
          'high to low concentration',
          'high to high concentration',
          'equal to zero concentration',
        ],
        correctAnswer: 'high to low concentration',
      },
      {
        prompt: 'Which blood vessel carries blood away from the heart?',
        options: ['Vein', 'Artery', 'Capillary', 'Venule'],
        correctAnswer: 'Artery',
      },
      {
        prompt: 'Insulin is produced in the:',
        options: ['Liver', 'Pancreas', 'Kidney', 'Thyroid'],
        correctAnswer: 'Pancreas',
      },
      {
        prompt: 'Natural selection works because individuals:',
        options: [
          'are genetically identical',
          'vary and some survive better',
          'never mutate',
          'always produce one offspring',
        ],
        correctAnswer: 'vary and some survive better',
      },
      {
        prompt: 'The gas exchanged into blood at alveoli is mainly:',
        options: ['Nitrogen', 'Carbon dioxide', 'Oxygen', 'Hydrogen'],
        correctAnswer: 'Oxygen',
      },
    ],
    shortAnswers: [
      {
        prompt: 'Name the process by which green plants make glucose.',
        correctAnswer: 'photosynthesis',
      },
      {
        prompt: 'State the role of enzymes in one phrase.',
        correctAnswer: 'biological catalysts',
      },
    ],
  },
  chemistry: {
    mcq: [
      {
        prompt: 'What is the charge of a proton?',
        options: ['+1', '-1', '0', '+2'],
        correctAnswer: '+1',
      },
      {
        prompt: 'The pH of a neutral solution is:',
        options: ['0', '5', '7', '14'],
        correctAnswer: '7',
      },
      {
        prompt: 'Which functional group is in alcohols?',
        options: ['-OH', '-COOH', '-NH2', '-CHO'],
        correctAnswer: '-OH',
      },
      {
        prompt: 'A substance that speeds a reaction without being used up is a:',
        options: ['reactant', 'catalyst', 'solvent', 'product'],
        correctAnswer: 'catalyst',
      },
      {
        prompt: 'Ionic bonding involves:',
        options: [
          'sharing electrons',
          'transfer of electrons',
          'sharing protons',
          'transfer of neutrons',
        ],
        correctAnswer: 'transfer of electrons',
      },
      {
        prompt: 'The empirical formula of hydrogen peroxide is:',
        options: ['H2O2', 'HO', 'H2O', 'H3O'],
        correctAnswer: 'HO',
      },
      {
        prompt: 'Which gas is produced when acids react with carbonates?',
        options: ['Hydrogen', 'Oxygen', 'Carbon dioxide', 'Nitrogen'],
        correctAnswer: 'Carbon dioxide',
      },
      {
        prompt: 'An exothermic reaction causes the surroundings to:',
        options: ['cool down', 'heat up', 'stay unchanged', 'freeze instantly'],
        correctAnswer: 'heat up',
      },
    ],
    shortAnswers: [
      {
        prompt: 'State what oxidation means in terms of oxygen.',
        correctAnswer: 'gain of oxygen',
      },
      {
        prompt: 'Write the chemical formula for sulfuric acid.',
        correctAnswer: 'H2SO4',
      },
    ],
  },
  english: {
    mcq: [
      {
        prompt: 'Which term means repetition of initial consonant sounds?',
        options: ['Alliteration', 'Metaphor', 'Oxymoron', 'Simile'],
        correctAnswer: 'Alliteration',
      },
      {
        prompt: 'A comparison using "like" or "as" is a:',
        options: ['Metaphor', 'Simile', 'Hyperbole', 'Irony'],
        correctAnswer: 'Simile',
      },
      {
        prompt: 'In persuasive writing, ethos appeals to:',
        options: ['emotion', 'logic', 'credibility', 'humour'],
        correctAnswer: 'credibility',
      },
      {
        prompt: 'The main idea of a paragraph is usually called the:',
        options: ['conclusion', 'theme', 'topic sentence', 'footnote'],
        correctAnswer: 'topic sentence',
      },
      {
        prompt: 'Which punctuation mark can introduce a list?',
        options: ['Comma', 'Colon', 'Apostrophe', 'Dash only'],
        correctAnswer: 'Colon',
      },
      {
        prompt: 'Iambic pentameter has how many stressed beats per line?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '5',
      },
      {
        prompt: 'A statement that seems contradictory but is true is a:',
        options: ['Paradox', 'Cliche', 'Idiom', 'Pun'],
        correctAnswer: 'Paradox',
      },
      {
        prompt: 'In transactional writing, register refers to:',
        options: ['page number', 'level of formality', 'font size', 'character count'],
        correctAnswer: 'level of formality',
      },
    ],
    shortAnswers: [
      {
        prompt: 'Name one structural feature often used to build tension in fiction.',
        correctAnswer: 'short sentences',
      },
      {
        prompt: 'Give one synonym for "analyse" in exam command words.',
        correctAnswer: 'examine',
      },
    ],
  },
  history: {
    mcq: [
      {
        prompt: 'A diary written during World War I is a:',
        options: ['Primary source', 'Secondary source', 'Tertiary source', 'Modern interpretation'],
        correctAnswer: 'Primary source',
      },
      {
        prompt: 'The Treaty of Versailles was signed in:',
        options: ['1914', '1918', '1919', '1923'],
        correctAnswer: '1919',
      },
      {
        prompt: 'The Cold War was mainly between the USA and the:',
        options: ['Germany', 'Soviet Union', 'Japan', 'France'],
        correctAnswer: 'Soviet Union',
      },
      {
        prompt: 'What was the purpose of the League of Nations?',
        options: [
          'to increase colonies',
          'to maintain peace',
          'to tax trade',
          'to control currency',
        ],
        correctAnswer: 'to maintain peace',
      },
      {
        prompt: 'The Industrial Revolution began first in:',
        options: ['Britain', 'Russia', 'Spain', 'USA'],
        correctAnswer: 'Britain',
      },
      {
        prompt: 'Appeasement is most linked to British policy before:',
        options: ['World War I', 'World War II', 'Crimean War', 'Cold War'],
        correctAnswer: 'World War II',
      },
      {
        prompt: 'The Berlin Wall was built in:',
        options: ['1945', '1953', '1961', '1989'],
        correctAnswer: '1961',
      },
      {
        prompt: 'The Norman Conquest happened in:',
        options: ['1066', '1215', '1348', '1485'],
        correctAnswer: '1066',
      },
    ],
    shortAnswers: [
      {
        prompt: 'State one reason historians evaluate provenance.',
        correctAnswer: 'to judge reliability',
      },
      {
        prompt: 'What does causation mean in history essays?',
        correctAnswer: 'why events happened',
      },
    ],
  },
  economics: {
    mcq: [
      {
        prompt: 'If demand rises and supply stays constant, equilibrium price usually:',
        options: ['falls', 'rises', 'stays fixed', 'becomes zero'],
        correctAnswer: 'rises',
      },
      {
        prompt: 'Inflation means a sustained increase in:',
        options: ['unemployment', 'general price level', 'exports only', 'tax rates only'],
        correctAnswer: 'general price level',
      },
      {
        prompt: 'Opportunity cost is the:',
        options: ['money in savings', 'next best alternative foregone', 'total revenue', 'market failure'],
        correctAnswer: 'next best alternative foregone',
      },
      {
        prompt: 'A regressive tax takes a higher proportion from:',
        options: ['high incomes', 'low incomes', 'all incomes equally', 'corporations only'],
        correctAnswer: 'low incomes',
      },
      {
        prompt: 'GDP measures:',
        options: [
          'government debt only',
          'value of output in an economy',
          'inflation only',
          'imports minus exports',
        ],
        correctAnswer: 'value of output in an economy',
      },
      {
        prompt: 'Price elasticity of demand above 1 is:',
        options: ['inelastic', 'unit elastic', 'elastic', 'perfectly inelastic'],
        correctAnswer: 'elastic',
      },
      {
        prompt: 'A minimum wage set above equilibrium tends to:',
        options: ['reduce labour supply', 'increase unemployment', 'remove taxation', 'fix inflation'],
        correctAnswer: 'increase unemployment',
      },
      {
        prompt: 'Monetary policy in the UK is mainly set by the:',
        options: ['HMRC', 'Bank of England', 'Parliament only', 'ONS'],
        correctAnswer: 'Bank of England',
      },
    ],
    shortAnswers: [
      {
        prompt: 'Define market failure.',
        correctAnswer: 'inefficient allocation of resources',
      },
      {
        prompt: 'What is fiscal policy?',
        correctAnswer: 'government spending and taxation policy',
      },
    ],
  },
  'computer-science': {
    mcq: [
      {
        prompt: 'Time complexity of binary search on a sorted list is:',
        options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
        correctAnswer: 'O(log n)',
      },
      {
        prompt: 'Which data structure uses FIFO order?',
        options: ['Stack', 'Queue', 'Tree', 'Graph'],
        correctAnswer: 'Queue',
      },
      {
        prompt: 'In binary, decimal 13 is:',
        options: ['1101', '1110', '1011', '1001'],
        correctAnswer: '1101',
      },
      {
        prompt: 'The purpose of an operating system is to:',
        options: [
          'compile high-level code only',
          'manage hardware and software resources',
          'replace RAM',
          'encrypt all files automatically',
        ],
        correctAnswer: 'manage hardware and software resources',
      },
      {
        prompt: 'Which protocol is commonly used for secure web browsing?',
        options: ['HTTP', 'FTP', 'SMTP', 'HTTPS'],
        correctAnswer: 'HTTPS',
      },
      {
        prompt: 'A loop that never ends is called:',
        options: ['bounded loop', 'infinite loop', 'for-each loop', 'nested loop'],
        correctAnswer: 'infinite loop',
      },
      {
        prompt: 'In SQL, SELECT is used to:',
        options: ['delete records', 'query data', 'create hardware', 'encrypt keys'],
        correctAnswer: 'query data',
      },
      {
        prompt: 'Which logic gate outputs true only when inputs differ?',
        options: ['AND', 'OR', 'XOR', 'NOT'],
        correctAnswer: 'XOR',
      },
    ],
    shortAnswers: [
      {
        prompt: 'State one advantage of using functions in programs.',
        correctAnswer: 'code reuse',
      },
      {
        prompt: 'Define abstraction in computer science.',
        correctAnswer: 'hiding unnecessary detail',
      },
    ],
  },
  psychology: {
    mcq: [
      {
        prompt: 'Which method best establishes cause and effect?',
        options: ['Experiment', 'Interview', 'Observation', 'Case study'],
        correctAnswer: 'Experiment',
      },
      {
        prompt: 'A variable that is changed by the researcher is the:',
        options: ['dependent variable', 'extraneous variable', 'independent variable', 'control result'],
        correctAnswer: 'independent variable',
      },
      {
        prompt: 'Classical conditioning is associated with:',
        options: ['Pavlov', 'Piaget', 'Milgram', 'Bandura'],
        correctAnswer: 'Pavlov',
      },
      {
        prompt: 'Conformity research is strongly linked to:',
        options: ['Asch', 'Freud', 'Skinner', 'Bowlby'],
        correctAnswer: 'Asch',
      },
      {
        prompt: 'In memory models, STM stands for:',
        options: ['short-term memory', 'simple task model', 'sensory trace map', 'stored transfer method'],
        correctAnswer: 'short-term memory',
      },
      {
        prompt: 'The fight-or-flight response is linked to the:',
        options: ['parasympathetic system', 'sympathetic system', 'digestive system', 'skeletal system'],
        correctAnswer: 'sympathetic system',
      },
      {
        prompt: 'A social role is best described as:',
        options: [
          'biological reflex',
          'expected behaviour in a position',
          'genetic inheritance',
          'memory rehearsal',
        ],
        correctAnswer: 'expected behaviour in a position',
      },
      {
        prompt: 'Reliability in research means:',
        options: [
          'participants always agree',
          'results are consistent over time',
          'hypothesis is true',
          'sample is very small',
        ],
        correctAnswer: 'results are consistent over time',
      },
    ],
    shortAnswers: [
      {
        prompt: 'Name one ethical issue psychologists must consider.',
        correctAnswer: 'informed consent',
      },
      {
        prompt: 'Define validity in research methods.',
        correctAnswer: 'measuring what was intended',
      },
    ],
  },
  geography: {
    mcq: [
      {
        prompt: 'Which atmospheric layer contains most weather?',
        options: ['Troposphere', 'Stratosphere', 'Mesosphere', 'Thermosphere'],
        correctAnswer: 'Troposphere',
      },
      {
        prompt: 'Urban sprawl describes:',
        options: [
          'high-rise growth in city centres',
          'low-density expansion at city edges',
          'rural tourism growth',
          'coastal erosion only',
        ],
        correctAnswer: 'low-density expansion at city edges',
      },
      {
        prompt: 'A meander is typically found in the:',
        options: ['upper course only', 'middle/lower river course', 'watershed only', 'delta only'],
        correctAnswer: 'middle/lower river course',
      },
      {
        prompt: 'The process where rock is broken down in place is:',
        options: ['Erosion', 'Weathering', 'Deposition', 'Transportation'],
        correctAnswer: 'Weathering',
      },
      {
        prompt: 'The line joining points of equal pressure on a map is an:',
        options: ['isotherm', 'isobar', 'contour', 'gridline'],
        correctAnswer: 'isobar',
      },
      {
        prompt: 'Deforestation can increase atmospheric:',
        options: ['oxygen only', 'carbon dioxide', 'argon', 'nitrogen'],
        correctAnswer: 'carbon dioxide',
      },
      {
        prompt: 'A country with high birth and death rates is likely in:',
        options: ['DTM stage 1', 'DTM stage 4', 'DTM stage 5', 'post-industrial only'],
        correctAnswer: 'DTM stage 1',
      },
      {
        prompt: 'Primary economic activity includes:',
        options: ['software design', 'farming', 'retail', 'banking'],
        correctAnswer: 'farming',
      },
    ],
    shortAnswers: [
      {
        prompt: 'Define sustainable development.',
        correctAnswer: 'meeting present needs without harming future generations',
      },
      {
        prompt: 'Give one human cause of climate change.',
        correctAnswer: 'burning fossil fuels',
      },
    ],
  },
};

export const assessmentDefs: AssessmentSeedDef[] = [
  {
    slug: 'maths-foundation-practice',
    title: 'Mathematics - Foundation practice',
    description: 'GCSE-style number and algebra fluency practice for core foundation learners.',
    subjectSlug: 'mathematics',
    difficulty: AssessmentDifficulty.FOUNDATION,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 50,
    estimatedFaralinMax: 150,
    questions: buildPracticeQuestions(questionBanks.mathematics, 0),
  },
  {
    slug: 'maths-standard-verified',
    title: 'Mathematics - Standard verified',
    description:
      'A timed GCSE standard mathematics check combining procedural fluency with short written reasoning.',
    subjectSlug: 'mathematics',
    difficulty: AssessmentDifficulty.STANDARD,
    trustLevel: FaralinTrustLevel.VERIFIED,
    isTimed: true,
    durationMinutes: 35,
    estimatedFaralinMin: 100,
    estimatedFaralinMax: 350,
    questions: buildVerifiedQuestions(questionBanks.mathematics),
  },
  {
    slug: 'maths-advanced-partner',
    title: 'Mathematics - Advanced partner verified',
    description:
      'A-Level style advanced maths challenge with partnered verification and structured short responses.',
    subjectSlug: 'mathematics',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.PARTNER_VERIFIED,
    isTimed: true,
    durationMinutes: 45,
    estimatedFaralinMin: 180,
    estimatedFaralinMax: 560,
    questions: buildPartnerQuestions(questionBanks.mathematics),
  },
  {
    slug: 'maths-foundation-verified',
    title: 'Mathematics - Foundation verified',
    description:
      'A timed foundational paper focused on arithmetic, linear equations, and concise method explanation.',
    subjectSlug: 'mathematics',
    difficulty: AssessmentDifficulty.FOUNDATION,
    trustLevel: FaralinTrustLevel.VERIFIED,
    isTimed: true,
    durationMinutes: 30,
    estimatedFaralinMin: 85,
    estimatedFaralinMax: 230,
    questions: buildVerifiedQuestions(questionBanks.mathematics),
  },
  {
    slug: 'maths-advanced-practice',
    title: 'Mathematics - Advanced practice',
    description:
      'Higher-tier and A-Level transition practice on functions, trigonometry, and algebraic structure.',
    subjectSlug: 'mathematics',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 95,
    estimatedFaralinMax: 260,
    questions: buildPracticeQuestions(questionBanks.mathematics, 2),
  },

  {
    slug: 'physics-standard-verified',
    title: 'Physics - Standard verified',
    description:
      'A timed mechanics and electricity assessment with short-answer checks on key physical definitions.',
    subjectSlug: 'physics',
    difficulty: AssessmentDifficulty.STANDARD,
    trustLevel: FaralinTrustLevel.VERIFIED,
    isTimed: true,
    durationMinutes: 35,
    estimatedFaralinMin: 90,
    estimatedFaralinMax: 300,
    questions: buildVerifiedQuestions(questionBanks.physics),
  },
  {
    slug: 'physics-foundation-practice',
    title: 'Physics - Foundation practice',
    description:
      'Core GCSE physics practice on motion, forces, and simple energy transfers in familiar contexts.',
    subjectSlug: 'physics',
    difficulty: AssessmentDifficulty.FOUNDATION,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 45,
    estimatedFaralinMax: 125,
    questions: buildPracticeQuestions(questionBanks.physics, 0),
  },
  {
    slug: 'physics-foundation-verified',
    title: 'Physics - Foundation verified',
    description:
      'Timed foundational physics coverage of force, charge, and thermal transfer with concise written recall.',
    subjectSlug: 'physics',
    difficulty: AssessmentDifficulty.FOUNDATION,
    trustLevel: FaralinTrustLevel.VERIFIED,
    isTimed: true,
    durationMinutes: 30,
    estimatedFaralinMin: 80,
    estimatedFaralinMax: 220,
    questions: buildVerifiedQuestions(questionBanks.physics),
  },
  {
    slug: 'physics-standard-practice',
    title: 'Physics - Standard practice',
    description:
      'GCSE standard question set covering equations, wave properties, and electricity fundamentals.',
    subjectSlug: 'physics',
    difficulty: AssessmentDifficulty.STANDARD,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 70,
    estimatedFaralinMax: 210,
    questions: buildPracticeQuestions(questionBanks.physics, 1),
  },
  {
    slug: 'physics-advanced-partner',
    title: 'Physics - Advanced partner verified',
    description:
      'An A-Level style physics challenge with timed partner verification and short analytical responses.',
    subjectSlug: 'physics',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.PARTNER_VERIFIED,
    isTimed: true,
    durationMinutes: 45,
    estimatedFaralinMin: 175,
    estimatedFaralinMax: 540,
    questions: buildPartnerQuestions(questionBanks.physics),
  },

  {
    slug: 'biology-foundation-practice',
    title: 'Biology - Foundation practice',
    description:
      'Entry-level GCSE biology practice on cells, organ systems, and basic biological processes.',
    subjectSlug: 'biology',
    difficulty: AssessmentDifficulty.FOUNDATION,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 40,
    estimatedFaralinMax: 120,
    questions: buildPracticeQuestions(questionBanks.biology, 0),
  },
  {
    slug: 'biology-foundation-verified',
    title: 'Biology - Foundation verified',
    description:
      'A timed foundational biology paper with short responses on enzyme function and photosynthesis.',
    subjectSlug: 'biology',
    difficulty: AssessmentDifficulty.FOUNDATION,
    trustLevel: FaralinTrustLevel.VERIFIED,
    isTimed: true,
    durationMinutes: 30,
    estimatedFaralinMin: 78,
    estimatedFaralinMax: 215,
    questions: buildVerifiedQuestions(questionBanks.biology),
  },
  {
    slug: 'biology-standard-practice',
    title: 'Biology - Standard practice',
    description:
      'GCSE standard biology practice including genetics, circulation, and gas exchange.',
    subjectSlug: 'biology',
    difficulty: AssessmentDifficulty.STANDARD,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 68,
    estimatedFaralinMax: 205,
    questions: buildPracticeQuestions(questionBanks.biology, 1),
  },
  {
    slug: 'biology-standard-verified',
    title: 'Biology - Standard verified',
    description:
      'A timed verified biology assessment balancing objective questions with concise scientific definitions.',
    subjectSlug: 'biology',
    difficulty: AssessmentDifficulty.STANDARD,
    trustLevel: FaralinTrustLevel.VERIFIED,
    isTimed: true,
    durationMinutes: 35,
    estimatedFaralinMin: 105,
    estimatedFaralinMax: 320,
    questions: buildVerifiedQuestions(questionBanks.biology),
  },
  {
    slug: 'biology-advanced-partner',
    title: 'Biology - Advanced partner verified',
    description:
      'A-Level style biology challenge with partnered verification and short-answer exam technique.',
    subjectSlug: 'biology',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.PARTNER_VERIFIED,
    isTimed: true,
    durationMinutes: 45,
    estimatedFaralinMin: 170,
    estimatedFaralinMax: 520,
    questions: buildPartnerQuestions(questionBanks.biology),
  },

  {
    slug: 'chemistry-foundation-practice',
    title: 'Chemistry - Foundation practice',
    description:
      'GCSE chemistry foundations on particles, pH, and basic reaction understanding.',
    subjectSlug: 'chemistry',
    difficulty: AssessmentDifficulty.FOUNDATION,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 45,
    estimatedFaralinMax: 130,
    questions: buildPracticeQuestions(questionBanks.chemistry, 0),
  },
  {
    slug: 'chemistry-standard-verified',
    title: 'Chemistry - Standard verified',
    description:
      'Timed chemistry assessment on bonding, catalysts, and practical interpretation with short responses.',
    subjectSlug: 'chemistry',
    difficulty: AssessmentDifficulty.STANDARD,
    trustLevel: FaralinTrustLevel.VERIFIED,
    isTimed: true,
    durationMinutes: 35,
    estimatedFaralinMin: 95,
    estimatedFaralinMax: 320,
    questions: buildVerifiedQuestions(questionBanks.chemistry),
  },
  {
    slug: 'chemistry-standard-practice',
    title: 'Chemistry - Standard practice',
    description:
      'GCSE standard chemistry revision on ionic ideas, equations, and reaction trends.',
    subjectSlug: 'chemistry',
    difficulty: AssessmentDifficulty.STANDARD,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 72,
    estimatedFaralinMax: 215,
    questions: buildPracticeQuestions(questionBanks.chemistry, 1),
  },
  {
    slug: 'chemistry-advanced-practice',
    title: 'Chemistry - Advanced practice',
    description:
      'Advanced pre-A-Level chemistry questions covering energetics, empirical formulae, and redox language.',
    subjectSlug: 'chemistry',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 96,
    estimatedFaralinMax: 270,
    questions: buildPracticeQuestions(questionBanks.chemistry, 2),
  },
  {
    slug: 'chemistry-advanced-partner',
    title: 'Chemistry - Advanced partner verified',
    description:
      'A timed partner-verified chemistry challenge with short-answer emphasis on core theory precision.',
    subjectSlug: 'chemistry',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.PARTNER_VERIFIED,
    isTimed: true,
    durationMinutes: 45,
    estimatedFaralinMin: 176,
    estimatedFaralinMax: 540,
    questions: buildPartnerQuestions(questionBanks.chemistry),
  },

  {
    slug: 'english-advanced-verified',
    title: 'English - Advanced verified',
    description:
      'A timed higher-level English paper with language analysis and concise written justification.',
    subjectSlug: 'english',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.VERIFIED,
    isTimed: true,
    durationMinutes: 40,
    estimatedFaralinMin: 120,
    estimatedFaralinMax: 400,
    questions: buildVerifiedQuestions(questionBanks.english),
  },
  {
    slug: 'english-foundation-practice',
    title: 'English - Foundation practice',
    description:
      'Foundational GCSE English language and literary terminology practice for secure recall.',
    subjectSlug: 'english',
    difficulty: AssessmentDifficulty.FOUNDATION,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 42,
    estimatedFaralinMax: 125,
    questions: buildPracticeQuestions(questionBanks.english, 0),
  },
  {
    slug: 'english-standard-practice',
    title: 'English - Standard practice',
    description:
      'GCSE standard English skills focusing on persuasive methods and structural awareness.',
    subjectSlug: 'english',
    difficulty: AssessmentDifficulty.STANDARD,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 70,
    estimatedFaralinMax: 205,
    questions: buildPracticeQuestions(questionBanks.english, 1),
  },
  {
    slug: 'english-standard-verified',
    title: 'English - Standard verified',
    description:
      'Timed verified English assessment combining terminology, reading interpretation, and short written responses.',
    subjectSlug: 'english',
    difficulty: AssessmentDifficulty.STANDARD,
    trustLevel: FaralinTrustLevel.VERIFIED,
    isTimed: true,
    durationMinutes: 35,
    estimatedFaralinMin: 102,
    estimatedFaralinMax: 315,
    questions: buildVerifiedQuestions(questionBanks.english),
  },
  {
    slug: 'english-advanced-partner',
    title: 'English - Advanced partner verified',
    description:
      'A-Level aligned English challenge with partner verification and concise evaluative writing.',
    subjectSlug: 'english',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.PARTNER_VERIFIED,
    isTimed: true,
    durationMinutes: 45,
    estimatedFaralinMin: 178,
    estimatedFaralinMax: 535,
    questions: buildPartnerQuestions(questionBanks.english),
  },

  {
    slug: 'history-foundation-practice',
    title: 'History - Foundation practice',
    description:
      'Foundation history practice on source types, chronology, and key GCSE-era events.',
    subjectSlug: 'history',
    difficulty: AssessmentDifficulty.FOUNDATION,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 40,
    estimatedFaralinMax: 110,
    questions: buildPracticeQuestions(questionBanks.history, 0),
  },
  {
    slug: 'history-advanced-verified',
    title: 'History - Advanced verified',
    description:
      'Timed advanced history assessment requiring interpretation, causation judgement, and concise written evidence.',
    subjectSlug: 'history',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.VERIFIED,
    isTimed: true,
    durationMinutes: 40,
    estimatedFaralinMin: 130,
    estimatedFaralinMax: 420,
    questions: buildVerifiedQuestions(questionBanks.history),
  },
  {
    slug: 'history-standard-practice',
    title: 'History - Standard practice',
    description:
      'GCSE standard history practice covering industrial change, international conflict, and chronology.',
    subjectSlug: 'history',
    difficulty: AssessmentDifficulty.STANDARD,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 68,
    estimatedFaralinMax: 198,
    questions: buildPracticeQuestions(questionBanks.history, 1),
  },
  {
    slug: 'history-standard-verified',
    title: 'History - Standard verified',
    description:
      'A timed verified history paper balancing factual recall with short historical reasoning.',
    subjectSlug: 'history',
    difficulty: AssessmentDifficulty.STANDARD,
    trustLevel: FaralinTrustLevel.VERIFIED,
    isTimed: true,
    durationMinutes: 35,
    estimatedFaralinMin: 100,
    estimatedFaralinMax: 310,
    questions: buildVerifiedQuestions(questionBanks.history),
  },
  {
    slug: 'history-advanced-partner',
    title: 'History - Advanced partner verified',
    description:
      'A-Level style partner-verified history challenge with concise explanations of reliability and causation.',
    subjectSlug: 'history',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.PARTNER_VERIFIED,
    isTimed: true,
    durationMinutes: 45,
    estimatedFaralinMin: 175,
    estimatedFaralinMax: 530,
    questions: buildPartnerQuestions(questionBanks.history),
  },

  {
    slug: 'economics-standard-verified',
    title: 'Economics - Standard verified',
    description:
      'Timed GCSE economics paper on market forces, elasticity, and short policy definitions.',
    subjectSlug: 'economics',
    difficulty: AssessmentDifficulty.STANDARD,
    trustLevel: FaralinTrustLevel.VERIFIED,
    isTimed: true,
    durationMinutes: 35,
    estimatedFaralinMin: 85,
    estimatedFaralinMax: 280,
    questions: buildVerifiedQuestions(questionBanks.economics),
  },
  {
    slug: 'economics-foundation-practice',
    title: 'Economics - Foundation practice',
    description:
      'Foundational economics practice on demand, supply, and basic macroeconomic terms.',
    subjectSlug: 'economics',
    difficulty: AssessmentDifficulty.FOUNDATION,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 44,
    estimatedFaralinMax: 128,
    questions: buildPracticeQuestions(questionBanks.economics, 0),
  },
  {
    slug: 'economics-foundation-verified',
    title: 'Economics - Foundation verified',
    description:
      'Timed foundation economics questions with short-answer checks on market failure and fiscal policy.',
    subjectSlug: 'economics',
    difficulty: AssessmentDifficulty.FOUNDATION,
    trustLevel: FaralinTrustLevel.VERIFIED,
    isTimed: true,
    durationMinutes: 30,
    estimatedFaralinMin: 82,
    estimatedFaralinMax: 225,
    questions: buildVerifiedQuestions(questionBanks.economics),
  },
  {
    slug: 'economics-advanced-practice',
    title: 'Economics - Advanced practice',
    description:
      'Advanced economics practice spanning labour markets, central banking, and policy outcomes.',
    subjectSlug: 'economics',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 96,
    estimatedFaralinMax: 270,
    questions: buildPracticeQuestions(questionBanks.economics, 2),
  },
  {
    slug: 'economics-advanced-partner',
    title: 'Economics - Advanced partner verified',
    description:
      'A-Level style economics challenge with partner verification and concise analytical responses.',
    subjectSlug: 'economics',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.PARTNER_VERIFIED,
    isTimed: true,
    durationMinutes: 45,
    estimatedFaralinMin: 180,
    estimatedFaralinMax: 545,
    questions: buildPartnerQuestions(questionBanks.economics),
  },

  {
    slug: 'computer-science-partner',
    title: 'Computer Science - Partner verified challenge',
    description:
      'A timed advanced computing challenge with partner verification and concise conceptual explanations.',
    subjectSlug: 'computer-science',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.PARTNER_VERIFIED,
    isTimed: true,
    durationMinutes: 45,
    estimatedFaralinMin: 200,
    estimatedFaralinMax: 600,
    questions: buildPartnerQuestions(questionBanks['computer-science']),
  },
  {
    slug: 'computer-science-foundation-practice',
    title: 'Computer Science - Foundation practice',
    description:
      'Core GCSE computing practice on binary, algorithms, and simple systems understanding.',
    subjectSlug: 'computer-science',
    difficulty: AssessmentDifficulty.FOUNDATION,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 46,
    estimatedFaralinMax: 132,
    questions: buildPracticeQuestions(questionBanks['computer-science'], 0),
  },
  {
    slug: 'computer-science-standard-verified',
    title: 'Computer Science - Standard verified',
    description:
      'Timed verified computing assessment with coding-concept recall and short software engineering definitions.',
    subjectSlug: 'computer-science',
    difficulty: AssessmentDifficulty.STANDARD,
    trustLevel: FaralinTrustLevel.VERIFIED,
    isTimed: true,
    durationMinutes: 35,
    estimatedFaralinMin: 104,
    estimatedFaralinMax: 325,
    questions: buildVerifiedQuestions(questionBanks['computer-science']),
  },
  {
    slug: 'computer-science-advanced-practice',
    title: 'Computer Science - Advanced practice',
    description:
      'Advanced algorithm and systems practice aimed at strong GCSE and early A-Level students.',
    subjectSlug: 'computer-science',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 98,
    estimatedFaralinMax: 275,
    questions: buildPracticeQuestions(questionBanks['computer-science'], 2),
  },
  {
    slug: 'computer-science-advanced-verified',
    title: 'Computer Science - Advanced verified',
    description:
      'Timed advanced computing paper that combines algorithmic multiple choice with short conceptual clarity.',
    subjectSlug: 'computer-science',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.VERIFIED,
    isTimed: true,
    durationMinutes: 40,
    estimatedFaralinMin: 145,
    estimatedFaralinMax: 430,
    questions: buildVerifiedQuestions(questionBanks['computer-science']),
  },

  {
    slug: 'psychology-standard-practice',
    title: 'Psychology - Standard practice',
    description:
      'GCSE psychology practice on research methods, memory, and social influence basics.',
    subjectSlug: 'psychology',
    difficulty: AssessmentDifficulty.STANDARD,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 55,
    estimatedFaralinMax: 160,
    questions: buildPracticeQuestions(questionBanks.psychology, 0),
  },
  {
    slug: 'psychology-foundation-practice',
    title: 'Psychology - Foundation practice',
    description:
      'Foundational psychology recall covering variables, methods, and introductory core studies.',
    subjectSlug: 'psychology',
    difficulty: AssessmentDifficulty.FOUNDATION,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 43,
    estimatedFaralinMax: 122,
    questions: buildPracticeQuestions(questionBanks.psychology, 1),
  },
  {
    slug: 'psychology-standard-verified',
    title: 'Psychology - Standard verified',
    description:
      'Timed verified psychology assessment that includes short definitions of ethics and validity.',
    subjectSlug: 'psychology',
    difficulty: AssessmentDifficulty.STANDARD,
    trustLevel: FaralinTrustLevel.VERIFIED,
    isTimed: true,
    durationMinutes: 35,
    estimatedFaralinMin: 96,
    estimatedFaralinMax: 295,
    questions: buildVerifiedQuestions(questionBanks.psychology),
  },
  {
    slug: 'psychology-advanced-practice',
    title: 'Psychology - Advanced practice',
    description:
      'Higher-level psychology practice linking research design, social behaviour, and memory theory.',
    subjectSlug: 'psychology',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 92,
    estimatedFaralinMax: 258,
    questions: buildPracticeQuestions(questionBanks.psychology, 2),
  },
  {
    slug: 'psychology-advanced-partner',
    title: 'Psychology - Advanced partner verified',
    description:
      'A-Level style partner-verified psychology challenge with short-answer methodological precision.',
    subjectSlug: 'psychology',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.PARTNER_VERIFIED,
    isTimed: true,
    durationMinutes: 45,
    estimatedFaralinMin: 172,
    estimatedFaralinMax: 520,
    questions: buildPartnerQuestions(questionBanks.psychology),
  },

  {
    slug: 'geography-foundation-practice',
    title: 'Geography - Foundation practice',
    description:
      'Foundation geography practice on atmosphere, rivers, and introductory human geography concepts.',
    subjectSlug: 'geography',
    difficulty: AssessmentDifficulty.FOUNDATION,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 40,
    estimatedFaralinMax: 115,
    questions: buildPracticeQuestions(questionBanks.geography, 0),
  },
  {
    slug: 'geography-advanced-verified',
    title: 'Geography - Advanced verified',
    description:
      'Timed advanced geography assessment integrating physical processes with concise evaluative short answers.',
    subjectSlug: 'geography',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.VERIFIED,
    isTimed: true,
    durationMinutes: 40,
    estimatedFaralinMin: 110,
    estimatedFaralinMax: 380,
    questions: buildVerifiedQuestions(questionBanks.geography),
  },
  {
    slug: 'geography-standard-practice',
    title: 'Geography - Standard practice',
    description:
      'GCSE standard geography practice on weather, development, and resource-use fundamentals.',
    subjectSlug: 'geography',
    difficulty: AssessmentDifficulty.STANDARD,
    trustLevel: FaralinTrustLevel.PRACTICE,
    estimatedFaralinMin: 66,
    estimatedFaralinMax: 198,
    questions: buildPracticeQuestions(questionBanks.geography, 1),
  },
  {
    slug: 'geography-standard-verified',
    title: 'Geography - Standard verified',
    description:
      'A timed verified geography paper that includes short definitions for sustainability and climate drivers.',
    subjectSlug: 'geography',
    difficulty: AssessmentDifficulty.STANDARD,
    trustLevel: FaralinTrustLevel.VERIFIED,
    isTimed: true,
    durationMinutes: 35,
    estimatedFaralinMin: 99,
    estimatedFaralinMax: 305,
    questions: buildVerifiedQuestions(questionBanks.geography),
  },
  {
    slug: 'geography-advanced-partner',
    title: 'Geography - Advanced partner verified',
    description:
      'A-Level style geography challenge with partner verification and concise analytical written responses.',
    subjectSlug: 'geography',
    difficulty: AssessmentDifficulty.ADVANCED,
    trustLevel: FaralinTrustLevel.PARTNER_VERIFIED,
    isTimed: true,
    durationMinutes: 45,
    estimatedFaralinMin: 176,
    estimatedFaralinMax: 532,
    questions: buildPartnerQuestions(questionBanks.geography),
  },
];
