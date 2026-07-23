import { AssessmentCategory, AssessmentDifficulty, FaralinTrustLevel } from '@prisma/client';
import type { AssessmentSeedDef } from './assessments';

export type TemplateSeedDef = AssessmentSeedDef & {
  category: AssessmentCategory;
  seriesSlug?: string;
  levelOrder?: number;
};

type McqOptions = [string, string, string, string];

function mcq(prompt: string, options: McqOptions, correctAnswer: string) {
  return { prompt, questionType: 'MCQ' as const, options, correctAnswer };
}

function templateQuestions(title: string) {
  return [
    mcq(`What is the primary focus of "${title}"?`, ['Skill building', 'Memorisation only', 'Unrelated trivia', 'None of the above'], 'Skill building'),
    mcq('Which approach best supports meaningful learning in this area?', ['Reflection and practice', 'Avoiding feedback', 'Skipping steps', 'Guessing answers'], 'Reflection and practice'),
    mcq('Why is verified completion valuable for students?', ['It demonstrates development', 'It replaces attendance', 'It guarantees admission', 'It removes assessment'], 'It demonstrates development'),
    mcq('What should you do when unsure about a concept?', ['Review guidance and retry', 'Submit blank answers', 'Copy others', 'Abandon the activity'], 'Review guidance and retry'),
    mcq('How can you apply this learning beyond the assessment?', ['Set a practical next step', 'Ignore the topic', 'Avoid further practice', 'Delete your notes'], 'Set a practical next step'),
    mcq('Which statement best describes responsible progress?', ['Steady improvement over time', 'One-off completion only', 'Avoiding challenge', 'Sharing login details'], 'Steady improvement over time'),
  ];
}

function tpl(
  slug: string,
  title: string,
  category: AssessmentCategory,
  description: string,
  min: number,
  max: number,
  series?: { seriesSlug: string; levelOrder: number },
): TemplateSeedDef {
  return {
    slug,
    title,
    description,
    subjectSlug: 'co-curricular',
    category,
    difficulty: AssessmentDifficulty.STANDARD,
    trustLevel: FaralinTrustLevel.VERIFIED,
    estimatedFaralinMin: min,
    estimatedFaralinMax: max,
    isTimed: false,
    questions: templateQuestions(title),
    ...(series ? { seriesSlug: series.seriesSlug, levelOrder: series.levelOrder } : {}),
  };
}

/** Level series used for Phase 2A progression chains */
export const assessmentSeriesDefs = [
  {
    seriesSlug: 'cv-builder',
    title: 'CV Builder',
    levels: [
      tpl('cv-builder-skills', 'CV Builder', AssessmentCategory.EMPLOYABILITY, 'Build a strong CV structure and highlight achievements clearly.', 80, 200, { seriesSlug: 'cv-builder', levelOrder: 1 }),
      tpl('cv-builder-advanced', 'CV Builder — Advanced', AssessmentCategory.EMPLOYABILITY, 'Tailor your CV for roles and demonstrate impact with evidence.', 100, 240, { seriesSlug: 'cv-builder', levelOrder: 2 }),
      tpl('cv-builder-portfolio', 'CV Builder — Portfolio', AssessmentCategory.EMPLOYABILITY, 'Integrate portfolio links and prepare a polished application package.', 120, 280, { seriesSlug: 'cv-builder', levelOrder: 3 }),
    ],
  },
  {
    seriesSlug: 'ai-literacy',
    title: 'AI Literacy',
    levels: [
      tpl('ai-literacy', 'AI Literacy', AssessmentCategory.DIGITAL_SKILLS, 'Use AI tools responsibly for learning and productivity.', 100, 300, { seriesSlug: 'ai-literacy', levelOrder: 1 }),
      tpl('ai-literacy-advanced', 'AI Literacy — Advanced', AssessmentCategory.DIGITAL_SKILLS, 'Apply AI workflows to research, drafting, and revision with integrity.', 120, 320, { seriesSlug: 'ai-literacy', levelOrder: 2 }),
      tpl('ai-literacy-ethics', 'AI Literacy — Ethics', AssessmentCategory.DIGITAL_SKILLS, 'Evaluate bias, attribution, and responsible AI use in academic work.', 110, 280, { seriesSlug: 'ai-literacy', levelOrder: 3 }),
    ],
  },
  {
    seriesSlug: 'budgeting',
    title: 'Budgeting',
    levels: [
      tpl('budgeting-basics', 'Budgeting', AssessmentCategory.FINANCIAL_WELLBEING, 'Build a student budget and track spending responsibly.', 70, 180, { seriesSlug: 'budgeting', levelOrder: 1 }),
      tpl('budgeting-advanced', 'Budgeting — Advanced', AssessmentCategory.FINANCIAL_WELLBEING, 'Plan termly finances and handle irregular income.', 90, 210, { seriesSlug: 'budgeting', levelOrder: 2 }),
      tpl('budgeting-investing', 'Budgeting — Investing Basics', AssessmentCategory.FINANCIAL_WELLBEING, 'Understand saving, investing basics, and long-term planning.', 100, 230, { seriesSlug: 'budgeting', levelOrder: 3 }),
    ],
  },
  {
    seriesSlug: 'academic-writing',
    title: 'Academic Writing',
    levels: [
      tpl('academic-writing', 'Academic Writing', AssessmentCategory.ACADEMIC_SKILLS, 'Structure arguments and write clearly for university study.', 90, 220, { seriesSlug: 'academic-writing', levelOrder: 1 }),
      tpl('academic-writing-essays', 'Academic Writing — Essays', AssessmentCategory.ACADEMIC_SKILLS, 'Develop thesis-driven essays with strong evidence.', 110, 250, { seriesSlug: 'academic-writing', levelOrder: 2 }),
      tpl('academic-writing-dissertation', 'Academic Writing — Dissertation Prep', AssessmentCategory.ACADEMIC_SKILLS, 'Plan longer projects and manage academic writing at scale.', 130, 290, { seriesSlug: 'academic-writing', levelOrder: 3 }),
    ],
  },
] as const;

export const assessmentTemplateDefs: TemplateSeedDef[] = [
  // Employability (standalone + series level 1)
  ...assessmentSeriesDefs.find((s) => s.seriesSlug === 'cv-builder')!.levels,
  tpl('interview-skills', 'Interview Skills', AssessmentCategory.EMPLOYABILITY, 'Prepare for interviews with structured responses and professional communication.', 90, 220),
  tpl('linkedin-profile', 'LinkedIn Profile', AssessmentCategory.EMPLOYABILITY, 'Create a professional online profile that supports career discovery.', 70, 180),
  tpl('networking-basics', 'Networking', AssessmentCategory.EMPLOYABILITY, 'Develop confident networking habits for events and online communities.', 60, 160),
  tpl('career-planning', 'Career Planning', AssessmentCategory.EMPLOYABILITY, 'Explore career pathways and set realistic development goals.', 100, 250),

  // Academic skills
  ...assessmentSeriesDefs.find((s) => s.seriesSlug === 'academic-writing')!.levels,
  tpl('referencing-skills', 'Referencing', AssessmentCategory.ACADEMIC_SKILLS, 'Understand citation basics and academic integrity.', 70, 170),
  tpl('time-management', 'Time Management', AssessmentCategory.ACADEMIC_SKILLS, 'Plan study schedules and manage deadlines effectively.', 60, 150),
  tpl('research-skills', 'Research Skills', AssessmentCategory.ACADEMIC_SKILLS, 'Find credible sources and evaluate evidence.', 80, 200),

  // Financial wellbeing
  ...assessmentSeriesDefs.find((s) => s.seriesSlug === 'budgeting')!.levels,
  tpl('student-finance', 'Student Finance', AssessmentCategory.FINANCIAL_WELLBEING, 'Understand loans, grants, and student funding basics.', 80, 190),
  tpl('saving-habits', 'Saving', AssessmentCategory.FINANCIAL_WELLBEING, 'Develop practical saving habits during university life.', 60, 150),
  tpl('credit-score-awareness', 'Credit Score', AssessmentCategory.FINANCIAL_WELLBEING, 'Learn how credit works and avoid common pitfalls.', 70, 170),

  // Mental wellbeing
  tpl('stress-management', 'Stress Management', AssessmentCategory.MENTAL_WELLBEING, 'Recognise stress signals and apply coping strategies.', 60, 160),
  tpl('anxiety-awareness', 'Anxiety Awareness', AssessmentCategory.MENTAL_WELLBEING, 'Understand anxiety and when to seek support.', 60, 150),
  tpl('healthy-sleep', 'Healthy Sleep', AssessmentCategory.MENTAL_WELLBEING, 'Improve sleep routines for study and wellbeing.', 50, 140),
  tpl('mindfulness-basics', 'Mindfulness', AssessmentCategory.MENTAL_WELLBEING, 'Practice mindfulness techniques for focus and calm.', 50, 130),

  // Digital skills
  ...assessmentSeriesDefs.find((s) => s.seriesSlug === 'ai-literacy')!.levels,
  tpl('cyber-security', 'Cyber Security', AssessmentCategory.DIGITAL_SKILLS, 'Protect accounts, data, and identity online.', 70, 180),
  tpl('microsoft-office', 'Microsoft Office', AssessmentCategory.DIGITAL_SKILLS, 'Core productivity skills for documents, sheets, and slides.', 60, 150),
  tpl('digital-identity', 'Digital Identity', AssessmentCategory.DIGITAL_SKILLS, 'Manage your professional digital footprint.', 60, 160),

  // Sustainability
  tpl('climate-awareness', 'Climate Awareness', AssessmentCategory.SUSTAINABILITY, 'Understand climate basics and personal impact.', 50, 140),
  tpl('recycling-basics', 'Recycling', AssessmentCategory.SUSTAINABILITY, 'Apply recycling and waste reduction on campus.', 40, 120),
  tpl('carbon-footprint', 'Carbon Footprint', AssessmentCategory.SUSTAINABILITY, 'Estimate and reduce your carbon footprint.', 60, 150),

  // Diversity & inclusion
  tpl('equality-basics', 'Equality', AssessmentCategory.DIVERSITY_INCLUSION, 'Understand equality principles in university life.', 60, 150),
  tpl('accessibility-awareness', 'Accessibility', AssessmentCategory.DIVERSITY_INCLUSION, 'Support inclusive participation and accessibility.', 60, 160),
  tpl('cultural-awareness', 'Cultural Awareness', AssessmentCategory.DIVERSITY_INCLUSION, 'Build respectful cross-cultural communication.', 70, 170),

  // Student life
  tpl('volunteering-basics', 'Volunteering', AssessmentCategory.STUDENT_LIFE, 'Explore volunteering opportunities and community impact.', 70, 180),
  tpl('clubs-societies', 'Clubs & Societies', AssessmentCategory.STUDENT_LIFE, 'Get involved in clubs and societies on campus.', 50, 130),
  tpl('sports-participation', 'Sports', AssessmentCategory.STUDENT_LIFE, 'Understand benefits and pathways for sports participation.', 50, 130),
  tpl('leadership-basics', 'Leadership', AssessmentCategory.STUDENT_LIFE, 'Develop foundational leadership and teamwork skills.', 90, 220),
];
