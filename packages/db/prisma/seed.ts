import {
  PrismaClient,
  UserRole,
  ArticleType,
  EventType,
} from '@prisma/client';
import { assessmentDefs } from './data/assessments';
import { universityDefs } from './data/universities';
import { courseDefs, getLessonVideoUrl } from './data/courses';
import { knowledgeArticleDefs } from './data/knowledge-articles';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Faralin database...');

  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.courseLessonProgress.deleteMany();
  await prisma.courseLesson.deleteMany();
  await prisma.courseSection.deleteMany();
  await prisma.course.deleteMany();
  await prisma.faralinTransaction.deleteMany();
  await prisma.assessmentAnswer.deleteMany();
  await prisma.assessmentAttempt.deleteMany();
  await prisma.assessmentQuestion.deleteMany();
  await prisma.faralinRule.deleteMany();
  await prisma.application.deleteMany();
  await prisma.event.deleteMany();
  await prisma.article.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.studentSubject.deleteMany();
  await prisma.studentUniversitySelection.deleteMany();
  await prisma.universityConversionRule.deleteMany();
  await prisma.universityPartnership.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.universityStaffProfile.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.university.deleteMany();

  const subjects = await Promise.all(
    [
      { slug: 'mathematics', name: 'Mathematics' },
      { slug: 'physics', name: 'Physics' },
      { slug: 'biology', name: 'Biology' },
      { slug: 'chemistry', name: 'Chemistry' },
      { slug: 'english', name: 'English Literature' },
      { slug: 'history', name: 'History' },
      { slug: 'economics', name: 'Economics' },
      { slug: 'computer-science', name: 'Computer Science' },
      { slug: 'psychology', name: 'Psychology' },
      { slug: 'geography', name: 'Geography' },
    ].map((s) => prisma.subject.create({ data: s })),
  );

  const subjectMap = Object.fromEntries(subjects.map((s) => [s.slug, s]));

  const universities = await Promise.all(
    universityDefs.map(async (u) => {
      const { conversion, rules, ...uniData } = u;
      const university = await prisma.university.create({ data: uniData });
      await prisma.universityConversionRule.create({
        data: { universityId: university.id, ...conversion },
      });
      for (const subject of subjects) {
        await prisma.faralinRule.create({
          data: {
            universityId: university.id,
            subjectId: subject.id,
            baseAmount: rules.baseAmount,
            scoreMultiplier: rules.scoreMultiplier,
            improvementBonus: rules.improvementBonus,
            difficultyMultiplier: rules.difficultyMultiplier,
          },
        });
      }
      return university;
    }),
  );

  const adminUser = await prisma.user.create({
    data: {
      clerkUserId: 'clerk_admin_demo',
      email: 'admin@faralin.com',
      role: UserRole.ADMIN,
      adminProfile: { create: {} },
    },
  });

  const universityBySlug = Object.fromEntries(universities.map((u) => [u.slug, u]));

  for (const article of knowledgeArticleDefs) {
    const university = universityBySlug[article.universitySlug];
    if (!university) continue;
    await prisma.article.create({
      data: {
        universityId: university.id,
        type: article.type,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        subjectTags: [...article.subjectTags],
        isPublished: true,
        publishedAt: new Date(),
      },
    });
  }

  for (const courseDef of courseDefs) {
    const { sections, ...courseData } = courseDef;
    await prisma.course.create({
      data: {
        ...courseData,
        isPublished: true,
        publishedAt: new Date(),
        sections: {
          create: sections.map((section, sectionIndex) => ({
            title: section.title,
            sortOrder: sectionIndex + 1,
            lessons: {
              create: section.lessons.map((lesson, lessonIndex) => ({
                title: lesson.title,
                sortOrder: lessonIndex + 1,
                durationSeconds: lesson.durationSeconds,
                videoUrl: getLessonVideoUrl(),
                isPreviewFree: lesson.isPreviewFree ?? false,
              })),
            },
          })),
        },
      },
    });
  }

  for (const university of universities) {
    await prisma.user.create({
      data: {
        clerkUserId: `clerk_staff_${university.slug}`,
        email: `staff@${university.slug}.demo`,
        role: UserRole.UNIVERSITY_STAFF,
        universityStaffProfile: {
          create: {
            universityId: university.id,
            jobTitle: 'Widening Participation Officer',
          },
        },
      },
    });

    await prisma.article.create({
      data: {
        universityId: university.id,
        type: ArticleType.ADVICE,
        title: `How ${university.shortName} recognises your progress on Faralin`,
        slug: 'recognition-guide',
        excerpt: 'Understand how your effort converts into conditional bursary value.',
        content:
          'Universities you selected can recognise your progress through verified assessments and consistent improvement.',
        subjectTags: ['mathematics', 'physics'],
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    await prisma.event.create({
      data: {
        universityId: university.id,
        type: EventType.WEBINAR,
        title: `${university.shortName} subject taster webinar`,
        description: 'An introduction to studying at this university.',
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        externalUrl: university.websiteUrl ?? undefined,
        isPublished: true,
      },
    });
  }

  for (const def of assessmentDefs) {
    const { questions, subjectSlug, ...assessmentData } = def;
    const assessment = await prisma.assessment.create({
      data: {
        ...assessmentData,
        subjectId: subjectMap[subjectSlug].id,
      },
    });

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await prisma.assessmentQuestion.create({
        data: {
          assessmentId: assessment.id,
          sortOrder: i + 1,
          prompt: q.prompt,
          questionType: q.questionType,
          options: q.options ?? undefined,
          correctAnswer: q.correctAnswer,
        },
      });
    }

    for (const university of universities) {
      await prisma.faralinRule.create({
        data: {
          universityId: university.id,
          assessmentId: assessment.id,
          baseAmount: 150,
          scoreMultiplier: 1.15,
          improvementBonus: 55,
          difficultyMultiplier: 1.2,
        },
      });
    }
  }

  console.log(`Seeded ${subjects.length} subjects`);
  console.log(`Seeded ${universities.length} universities`);
  console.log(`Seeded ${assessmentDefs.length} assessments`);
  console.log(`Seeded ${knowledgeArticleDefs.length} knowledge articles`);
  console.log(`Seeded ${courseDefs.length} courses`);
  console.log(`Admin user: ${adminUser.email}`);
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
