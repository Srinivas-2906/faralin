import { PrismaClient } from '@prisma/client';
import { universityDefs } from './data/universities';

const prisma = new PrismaClient();

const subjectDefs = [
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
];

async function main() {
  console.log('Seeding universities (non-destructive)…');

  // Ensure base subjects exist (idempotent)
  await Promise.all(
    subjectDefs.map((s) =>
      prisma.subject.upsert({
        where: { slug: s.slug },
        create: s,
        update: { name: s.name },
      }),
    ),
  );

  const subjects = await prisma.subject.findMany({
    where: { slug: { in: subjectDefs.map((s) => s.slug) } },
  });

  const subjectBySlug = Object.fromEntries(subjects.map((s) => [s.slug, s]));

  let upserted = 0;

  for (const def of universityDefs) {
    const { conversion, rules, ...uniData } = def;

    const university = await prisma.university.upsert({
      where: { slug: uniData.slug },
      create: uniData,
      update: {
        name: uniData.name,
        shortName: uniData.shortName,
        logoUrl: uniData.logoUrl,
        description: uniData.description,
        websiteUrl: uniData.websiteUrl,
        applyUrl: uniData.applyUrl,
        isDemo: uniData.isDemo,
        isActive: true,
      },
    });

    await prisma.universityConversionRule.upsert({
      where: { universityId: university.id },
      create: {
        universityId: university.id,
        faralinsPerGbp: conversion.faralinsPerGbp,
        minVerifiedPercent: conversion.minVerifiedPercent,
        disclaimerText: conversion.disclaimerText,
      },
      update: {
        faralinsPerGbp: conversion.faralinsPerGbp,
        minVerifiedPercent: conversion.minVerifiedPercent,
        disclaimerText: conversion.disclaimerText,
      },
    });

    // Keep seeded subject rules clean/idempotent:
    // delete only the subject-based rules we seed (assessmentId null, subjectId set).
    await prisma.faralinRule.deleteMany({
      where: { universityId: university.id, assessmentId: null, subjectId: { not: null } },
    });

    await Promise.all(
      Object.values(subjectBySlug).map((subject) =>
        prisma.faralinRule.create({
          data: {
            universityId: university.id,
            subjectId: subject.id,
            baseAmount: rules.baseAmount,
            scoreMultiplier: rules.scoreMultiplier,
            improvementBonus: rules.improvementBonus,
            difficultyMultiplier: rules.difficultyMultiplier,
          },
        }),
      ),
    );

    upserted++;
  }

  console.log(`Subjects ensured: ${subjects.length}`);
  console.log(`Universities upserted: ${upserted}`);
  console.log('University seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

