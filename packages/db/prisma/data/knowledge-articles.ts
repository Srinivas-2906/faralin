import { ArticleType } from '@prisma/client';

export const knowledgeArticleDefs = [
  {
    universitySlug: 'oxford',
    type: ArticleType.BLOG,
    slug: 'why-verified-assessments-matter',
    title: 'Why verified assessments matter more than practice scores',
    excerpt:
      'Practice builds confidence, but verified recognition is what partner universities weight in your portfolio.',
    content: `When you first join Faralin, practice assessments help you learn the format and build confidence. They are valuable — but they are not the same as verified recognition.

Partner universities look at verified and partner-verified Faralins when estimating conditional bursary value. That is because verified attempts include integrity checks and consistent scoring rules.

**What to do next:** complete a few practice assessments in your weakest subjects, then move to verified attempts once you are scoring steadily. Track your improvement delta on the dashboard — universities notice upward trends.`,
    subjectTags: ['mathematics', 'physics'],
  },
  {
    universitySlug: 'cambridge',
    type: ArticleType.BLOG,
    slug: 'building-a-subject-portfolio',
    title: 'Building a subject portfolio universities actually read',
    excerpt:
      'Spread effort across two or three subjects rather than chasing every badge on the platform.',
    content: `Admissions teams do not need to see fifty completed assessments. They need a clear signal: which subjects you care about, how consistently you perform, and whether you improve over time.

Pick two or three subjects aligned with your intended degree. Complete verified assessments in those areas first. Use the dashboard to follow updates from your chosen universities — their advice articles often explain what they value.

Your Faralin portfolio is a living record. Treat it like coursework: steady progress beats last-minute cramming.`,
    subjectTags: ['economics', 'history'],
  },
  {
    universitySlug: 'oxford',
    type: ArticleType.NEWS,
    slug: 'oxford-widening-participation-update',
    title: 'Oxford widening participation update for 2026 applicants',
    excerpt:
      'New guidance on how Faralin recognition supports conditional bursary estimates for offer holders.',
    content: `Oxford has published updated guidance for students using Faralin as part of their widening participation profile.

Recognised Faralins remain **conditional** until enrolment is confirmed. Offer holders should continue verified assessments through the summer where possible, as improvement trends may inform bursary discussions at enrolment.

Read the full guidance on the university website and check your dashboard for Oxford-specific articles and events.`,
    subjectTags: ['mathematics'],
  },
  {
    universitySlug: 'imperial',
    type: ArticleType.NEWS,
    slug: 'imperial-stem-taster-series',
    title: 'Imperial launches STEM taster webinar series',
    excerpt:
      'Register for live subject tasters and connect your Faralin progress with department outreach.',
    content: `Imperial College is running a new STEM taster webinar series for Year 12 and 13 students on Faralin.

Sessions cover engineering, computing, and natural sciences. Register through the Events section on Imperial's Faralin page. Attendance does not directly award Faralins, but helps you choose assessments aligned with your interests.

Places are limited — register early through your dashboard events feed.`,
    subjectTags: ['physics', 'computer-science'],
  },
] as const;
