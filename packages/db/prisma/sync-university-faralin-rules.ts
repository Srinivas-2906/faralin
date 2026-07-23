import { PrismaClient } from '@prisma/client';
import { universityDefs } from './data/universities';
import {
  buildAssessmentRule,
  getTierEconomics,
} from '@faralin/types';

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

async function upsertUniversity(def: (typeof universityDefs)[number]) {
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
      guardianRank2025: uniData.guardianRank2025,
      prestigeTier: uniData.prestigeTier,
      rankingSource: uniData.rankingSource,
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

  await prisma.faralinRule.deleteMany({
    where: { universityId: university.id, assessmentId: null, subjectId: { not: null } },
  });

  const subjects = await prisma.subject.findMany({
    where: { slug: { in: subjectDefs.map((s) => s.slug) } },
  });

  await Promise.all(
    subjects.map((subject) =>
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

  return university;
}

async function syncAssessmentRules(universityId: string, slug: string) {
  const economics = getTierEconomics(slug);
  const assessmentRule = buildAssessmentRule(economics);

  const assessmentRules = await prisma.faralinRule.findMany({
    where: {
      universityId,
      assessmentId: { not: null },
      subjectId: null,
      problemTrackId: null,
    },
  });

  for (const rule of assessmentRules) {
    await prisma.faralinRule.update({
      where: { id: rule.id },
      data: assessmentRule,
    });
  }
}

async function syncTrackRules(universityId: string, slug: string) {
  const economics = getTierEconomics(slug);

  const trackRules = await prisma.faralinRule.findMany({
    where: {
      universityId,
      problemTrackId: { not: null },
    },
    include: { problemTrack: true },
  });

  for (const rule of trackRules) {
    await prisma.faralinRule.update({
      where: { id: rule.id },
      data: {
        baseAmount: rule.problemTrack?.maxFaralins ?? rule.baseAmount,
        scoreMultiplier: economics.trackScoreMultiplier,
        improvementBonus: 0,
        difficultyMultiplier: 1.0,
      },
    });
  }
}

async function main() {
  console.log('Syncing university Faralin rules (non-destructive)…');

  await Promise.all(
    subjectDefs.map((s) =>
      prisma.subject.upsert({
        where: { slug: s.slug },
        create: s,
        update: { name: s.name },
      }),
    ),
  );

  let synced = 0;
  let assessmentRulesUpdated = 0;
  let trackRulesUpdated = 0;

  for (const def of universityDefs) {
    const university = await upsertUniversity(def);

    const beforeAssessment = await prisma.faralinRule.count({
      where: { universityId: university.id, assessmentId: { not: null } },
    });
    await syncAssessmentRules(university.id, def.slug);
    assessmentRulesUpdated += beforeAssessment;

    const beforeTrack = await prisma.faralinRule.count({
      where: { universityId: university.id, problemTrackId: { not: null } },
    });
    await syncTrackRules(university.id, def.slug);
    trackRulesUpdated += beforeTrack;

    synced++;
  }

  console.log(`Universities synced: ${synced}`);
  console.log(`Assessment rules updated: ${assessmentRulesUpdated}`);
  console.log(`Track rules updated: ${trackRulesUpdated}`);
  console.log('University Faralin sync complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
