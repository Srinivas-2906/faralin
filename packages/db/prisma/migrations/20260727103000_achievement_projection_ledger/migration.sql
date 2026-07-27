-- CreateEnum
CREATE TYPE "AchievementActivityType" AS ENUM ('ASSESSMENT', 'PROBLEM_TRACK', 'PROBLEM_TRACK_SECTION', 'JOURNEY_MILESTONE');

-- CreateEnum
CREATE TYPE "AchievementVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UniversityProjectionStatus" AS ENUM ('ESTIMATE');

-- CreateTable
CREATE TABLE "AchievementEvent" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "activityType" "AchievementActivityType" NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "assessmentAttemptId" TEXT,
    "problemTrackAttemptId" TEXT,
    "sectionId" TEXT,
    "subjectId" TEXT,
    "difficulty" "AssessmentDifficulty",
    "rawScore" DECIMAL(5,2),
    "normalizedScore" DECIMAL(5,4),
    "trustLevel" "FaralinTrustLevel" NOT NULL DEFAULT 'VERIFIED',
    "verificationStatus" "AchievementVerificationStatus" NOT NULL DEFAULT 'VERIFIED',
    "coreFaralins" INTEGER NOT NULL,
    "improvementBonus" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AchievementEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityProjection" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "eligibleCoreFaralins" INTEGER NOT NULL DEFAULT 0,
    "universityBoost" DECIMAL(5,4) NOT NULL,
    "subjectAlignmentBoost" DECIMAL(5,4) NOT NULL DEFAULT 1.0,
    "verificationBoost" DECIMAL(5,4) NOT NULL DEFAULT 1.0,
    "estimatedAwardGbp" DECIMAL(10,2) NOT NULL,
    "perStudentCapGbp" DECIMAL(10,2),
    "campaignId" TEXT,
    "status" "UniversityProjectionStatus" NOT NULL DEFAULT 'ESTIMATE',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshotVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "UniversityProjection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformConfig" (
    "id" TEXT NOT NULL,
    "coreFaralinsPerGbp" INTEGER NOT NULL DEFAULT 100,
    "maxFollowedUniversities" INTEGER NOT NULL DEFAULT 10,
    "maxFaralinActiveUniversities" INTEGER NOT NULL DEFAULT 5,
    "maxOfferStageUniversities" INTEGER NOT NULL DEFAULT 2,
    "maxConvertedAwards" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AchievementEvent_idempotencyKey_key" ON "AchievementEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AchievementEvent_studentProfileId_completedAt_idx" ON "AchievementEvent"("studentProfileId", "completedAt");

-- CreateIndex
CREATE INDEX "AchievementEvent_studentProfileId_verificationStatus_idx" ON "AchievementEvent"("studentProfileId", "verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityProjection_studentProfileId_universityId_key" ON "UniversityProjection"("studentProfileId", "universityId");

-- CreateIndex
CREATE INDEX "UniversityProjection_universityId_idx" ON "UniversityProjection"("universityId");

-- AddForeignKey
ALTER TABLE "AchievementEvent" ADD CONSTRAINT "AchievementEvent_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementEvent" ADD CONSTRAINT "AchievementEvent_assessmentAttemptId_fkey" FOREIGN KEY ("assessmentAttemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementEvent" ADD CONSTRAINT "AchievementEvent_problemTrackAttemptId_fkey" FOREIGN KEY ("problemTrackAttemptId") REFERENCES "ProblemTrackAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementEvent" ADD CONSTRAINT "AchievementEvent_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityProjection" ADD CONSTRAINT "UniversityProjection_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityProjection" ADD CONSTRAINT "UniversityProjection_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default platform config
INSERT INTO "PlatformConfig" ("id", "coreFaralinsPerGbp", "maxFollowedUniversities", "maxFaralinActiveUniversities", "maxOfferStageUniversities", "maxConvertedAwards", "updatedAt")
VALUES ('default', 100, 10, 5, 2, 1, CURRENT_TIMESTAMP);
