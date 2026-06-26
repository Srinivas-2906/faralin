import { CourseLevel } from '@prisma/client';

const PLACEHOLDER_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export const courseDefs = [
  {
    slug: 'introduction-to-faralins',
    title: 'Introduction to Faralins',
    subtitle: 'How university-backed recognition works for students',
    description:
      'Learn how Faralins connect your assessment progress to conditional bursary value at partner universities.',
    learningOutcomes: [
      'Understand what a Faralin is and how it is earned',
      'See how trust levels affect recognition value',
      'Learn how to choose partner universities on your dashboard',
      'Know what happens when you apply and enrol',
    ],
    instructorName: 'Faralin Team',
    level: CourseLevel.BEGINNER,
    durationMinutes: 45,
    subjectTags: ['mathematics', 'economics'],
    sections: [
      {
        title: 'Getting started',
        lessons: [
          { title: 'Welcome to Faralin', durationSeconds: 300, isPreviewFree: true },
          { title: 'What is a Faralin?', durationSeconds: 420 },
          { title: 'Choosing your universities', durationSeconds: 360 },
        ],
      },
      {
        title: 'Earning recognition',
        lessons: [
          { title: 'Taking your first assessment', durationSeconds: 480 },
          { title: 'Trust levels explained', durationSeconds: 540 },
          { title: 'Reading your portfolio', durationSeconds: 390 },
        ],
      },
    ],
  },
  {
    slug: 'physics-foundations',
    title: 'Physics Foundations',
    subtitle: 'Core concepts for A-level and early undergraduate study',
    description:
      'Build confidence in mechanics, waves, and electricity with structured video lessons aligned to Faralin assessments.',
    learningOutcomes: [
      'Apply Newton’s laws to common mechanics problems',
      'Describe wave behaviour and interference',
      'Analyse simple electrical circuits',
      'Connect theory to assessment-style questions',
    ],
    instructorName: 'Dr. Sarah Chen',
    level: CourseLevel.INTERMEDIATE,
    durationMinutes: 90,
    subjectTags: ['physics'],
    sections: [
      {
        title: 'Mechanics',
        lessons: [
          { title: 'Forces and equilibrium', durationSeconds: 600, isPreviewFree: true },
          { title: 'Kinematics in one dimension', durationSeconds: 720 },
          { title: 'Energy and work', durationSeconds: 660 },
        ],
      },
      {
        title: 'Waves and fields',
        lessons: [
          { title: 'Wave properties', durationSeconds: 540 },
          { title: 'Electric circuits', durationSeconds: 600 },
        ],
      },
    ],
  },
  {
    slug: 'writing-strong-applications',
    title: 'Writing Strong Applications',
    subtitle: 'Personal statements and subject passion for competitive courses',
    description:
      'Practical guidance on structuring personal statements and demonstrating subject engagement beyond grades.',
    learningOutcomes: [
      'Structure a compelling personal statement opening',
      'Link extracurricular work to your chosen subject',
      'Avoid common pitfalls in competitive applications',
      'Prepare for subject-specific interview questions',
    ],
    instructorName: 'James Okonkwo',
    level: CourseLevel.BEGINNER,
    durationMinutes: 60,
    subjectTags: ['english', 'history'],
    sections: [
      {
        title: 'Personal statements',
        lessons: [
          { title: 'What admissions tutors look for', durationSeconds: 480, isPreviewFree: true },
          { title: 'Opening paragraphs that work', durationSeconds: 540 },
          { title: 'Subject passion without clichés', durationSeconds: 510 },
        ],
      },
      {
        title: 'Next steps',
        lessons: [
          { title: 'Interview preparation basics', durationSeconds: 600 },
        ],
      },
    ],
  },
] as const;

export function getLessonVideoUrl() {
  return PLACEHOLDER_VIDEO;
}
