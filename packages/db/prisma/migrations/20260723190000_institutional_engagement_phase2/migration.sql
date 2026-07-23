-- Phase 2B–2E: journeys, recognition tiers, HEAR track flag, leaderboards

CREATE TYPE "StudentRecognitionTier" AS ENUM ('EXPLORER', 'BUILDER', 'ACHIEVER', 'CHAMPION');

ALTER TABLE "StudentProfile" ADD COLUMN "leaderboardOptIn" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "UniversityProblemTrackConfig" ADD COLUMN "affectsBursaryEligibility" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "ProblemTrackJourney" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "milestones" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemTrackJourney_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProblemTrackJourney_slug_key" ON "ProblemTrackJourney"("slug");

CREATE TABLE "UniversityProblemTrackJourneyConfig" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "bonusRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityProblemTrackJourneyConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UniversityProblemTrackJourneyConfig_universityId_journeyId_key" ON "UniversityProblemTrackJourneyConfig"("universityId", "journeyId");
CREATE INDEX "UniversityProblemTrackJourneyConfig_universityId_enabled_idx" ON "UniversityProblemTrackJourneyConfig"("universityId", "enabled");

ALTER TABLE "UniversityProblemTrackJourneyConfig" ADD CONSTRAINT "UniversityProblemTrackJourneyConfig_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UniversityProblemTrackJourneyConfig" ADD CONSTRAINT "UniversityProblemTrackJourneyConfig_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "ProblemTrackJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UniversityRecognitionTierConfig" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "tier" "StudentRecognitionTier" NOT NULL,
    "minVerifiedFaralins" INTEGER NOT NULL,
    "benefitsSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityRecognitionTierConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UniversityRecognitionTierConfig_universityId_tier_key" ON "UniversityRecognitionTierConfig"("universityId", "tier");

ALTER TABLE "UniversityRecognitionTierConfig" ADD CONSTRAINT "UniversityRecognitionTierConfig_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UniversityLeaderboardConfig" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT NOT NULL DEFAULT 'VERIFIED_FARALINS',
    "optInRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityLeaderboardConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UniversityLeaderboardConfig_universityId_key" ON "UniversityLeaderboardConfig"("universityId");

ALTER TABLE "UniversityLeaderboardConfig" ADD CONSTRAINT "UniversityLeaderboardConfig_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
