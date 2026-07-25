-- Faralin recognition ledger core tables (idempotent for environments created via db push)

DO $$ BEGIN
  CREATE TYPE "FaralinTrustLevel" AS ENUM ('PRACTICE', 'VERIFIED', 'PARTNER_VERIFIED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FaralinTransactionType" AS ENUM ('EARNED', 'BONUS', 'ADJUSTMENT', 'CONVERSION', 'FORFEIT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FaralinTransactionStatus" AS ENUM ('CONDITIONAL', 'CONFIRMED', 'CONVERTED', 'FORFEITED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "FaralinRule" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "problemTrackId" TEXT,
    "subjectId" TEXT,
    "trustLevel" "FaralinTrustLevel",
    "difficulty" "AssessmentDifficulty",
    "baseAmount" INTEGER NOT NULL,
    "scoreMultiplier" DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    "improvementBonus" INTEGER NOT NULL DEFAULT 0,
    "consistencyBonus" INTEGER NOT NULL DEFAULT 0,
    "difficultyMultiplier" DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FaralinRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FaralinRule_universityId_isActive_idx" ON "FaralinRule"("universityId", "isActive");

DO $$ BEGIN
  ALTER TABLE "FaralinRule" ADD CONSTRAINT "FaralinRule_universityId_fkey"
    FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "FaralinRule" ADD CONSTRAINT "FaralinRule_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "FaralinRule" ADD CONSTRAINT "FaralinRule_problemTrackId_fkey"
    FOREIGN KEY ("problemTrackId") REFERENCES "ProblemTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "FaralinRule" ADD CONSTRAINT "FaralinRule_subjectId_fkey"
    FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "UniversityConversionRule" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "faralinsPerGbp" INTEGER NOT NULL,
    "minVerifiedPercent" INTEGER NOT NULL DEFAULT 70,
    "disclaimerText" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityConversionRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UniversityConversionRule_universityId_key" ON "UniversityConversionRule"("universityId");

DO $$ BEGIN
  ALTER TABLE "UniversityConversionRule" ADD CONSTRAINT "UniversityConversionRule_universityId_fkey"
    FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "FaralinTransaction" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "assessmentAttemptId" TEXT,
    "problemTrackAttemptId" TEXT,
    "type" "FaralinTransactionType" NOT NULL,
    "status" "FaralinTransactionStatus" NOT NULL DEFAULT 'CONDITIONAL',
    "trustLevel" "FaralinTrustLevel" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaralinTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FaralinTransaction_studentProfileId_universityId_idx" ON "FaralinTransaction"("studentProfileId", "universityId");
CREATE INDEX IF NOT EXISTS "FaralinTransaction_studentProfileId_createdAt_idx" ON "FaralinTransaction"("studentProfileId", "createdAt");
CREATE INDEX IF NOT EXISTS "FaralinTransaction_universityId_createdAt_idx" ON "FaralinTransaction"("universityId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "FaralinTransaction" ADD CONSTRAINT "FaralinTransaction_studentProfileId_fkey"
    FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "FaralinTransaction" ADD CONSTRAINT "FaralinTransaction_universityId_fkey"
    FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "FaralinTransaction" ADD CONSTRAINT "FaralinTransaction_assessmentAttemptId_fkey"
    FOREIGN KEY ("assessmentAttemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "FaralinTransaction" ADD CONSTRAINT "FaralinTransaction_problemTrackAttemptId_fkey"
    FOREIGN KEY ("problemTrackAttemptId") REFERENCES "ProblemTrackAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
