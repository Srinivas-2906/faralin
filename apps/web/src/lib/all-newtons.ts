export const ALL_NEWTONS_URL =
  process.env.NEXT_PUBLIC_ALL_NEWTONS_URL ?? 'https://allnewtons.com';

export const ALL_NEWTONS_RESOURCES = [
  {
    title: 'Subject revision worksheets',
    description: 'Printable practice packs aligned to GCSE and A-level topics.',
    category: 'Worksheets',
  },
  {
    title: 'Exam technique guides',
    description: 'Step-by-step approaches for structured exam answers.',
    category: 'Guides',
  },
  {
    title: 'Formula reference sheets',
    description: 'Quick-reference PDFs for maths and science courses.',
    category: 'Reference',
  },
  {
    title: 'Interactive problem sets',
    description: 'Self-marking questions with worked solutions.',
    category: 'Practice',
  },
] as const;
