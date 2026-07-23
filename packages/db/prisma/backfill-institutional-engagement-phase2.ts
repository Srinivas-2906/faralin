import { PrismaClient, StudentRecognitionTier } from '@prisma/client';
import { problemTrackJourneyDefs } from './data/problem-track-journeys';
import { universityDefs } from './data/universities';

const prisma = new PrismaClient();

const DEFAULT_TIERS: Array<{
  tier: StudentRecognitionTier;
  minVerifiedFaralins: number;
  benefitsSummary: string;
}> = [
  { tier: 'EXPLORER', minVerifiedFaralins: 0, benefitsSummary: 'Starting your recognition journey' },
  { tier: 'BUILDER', minVerifiedFaralins: 500, benefitsSummary: 'Consistent verified activity' },
  { tier: 'ACHIEVER', minVerifiedFaralins: 1500, benefitsSummary: 'Strong portfolio of verified work' },
  { tier: 'CHAMPION', minVerifiedFaralins: 3000, benefitsSummary: 'Outstanding verified recognition' },
];

async function main() {
  console.log('Backfilling Phase 2 journeys, recognition tiers, leaderboard configs…');

  for (const def of problemTrackJourneyDefs) {
    await prisma.problemTrackJourney.upsert({
      where: { slug: def.slug },
      create: {
        slug: def.slug,
        title: def.title,
        description: def.description,
        milestones: def.milestones,
      },
      update: {
        title: def.title,
        description: def.description,
        milestones: def.milestones,
      },
    });
  }

  const universities = await prisma.university.findMany({
    where: { slug: { in: universityDefs.map((u) => u.slug) } },
  });
  const journeys = await prisma.problemTrackJourney.findMany();

  for (const university of universities) {
    for (const tier of DEFAULT_TIERS) {
      await prisma.universityRecognitionTierConfig.upsert({
        where: { universityId_tier: { universityId: university.id, tier: tier.tier } },
        create: { universityId: university.id, ...tier },
        update: {},
      });
    }

    await prisma.universityLeaderboardConfig.upsert({
      where: { universityId: university.id },
      create: { universityId: university.id, enabled: false },
      update: {},
    });

    for (const journey of journeys) {
      await prisma.universityProblemTrackJourneyConfig.upsert({
        where: {
          universityId_journeyId: { universityId: university.id, journeyId: journey.id },
        },
        create: { universityId: university.id, journeyId: journey.id, enabled: false },
        update: {},
      });
    }
  }

  console.log(`Journeys: ${journeys.length}, universities: ${universities.length}`);
  console.log('Phase 2 backfill complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
