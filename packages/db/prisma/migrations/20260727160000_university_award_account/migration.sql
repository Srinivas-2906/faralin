-- CreateEnum
CREATE TYPE "UniversityAwardAccountStatus" AS ENUM (
  'PROJECTED',
  'ELIGIBLE',
  'RESERVED',
  'CONFIRMED',
  'CONVERTED',
  'EXPIRED',
  'FORFEITED'
);

-- AlterEnum ApplicationStatus (appended; Prisma equality does not depend on ordinal)
ALTER TYPE "ApplicationStatus" ADD VALUE 'FARALIN_ACTIVE';
ALTER TYPE "ApplicationStatus" ADD VALUE 'FIRM';
ALTER TYPE "ApplicationStatus" ADD VALUE 'INSURANCE';

-- CreateTable
CREATE TABLE "UniversityAwardAccount" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "status" "UniversityAwardAccountStatus" NOT NULL DEFAULT 'PROJECTED',
    "eligibleCoreFaralins" INTEGER NOT NULL DEFAULT 0,
    "projectedAwardGbp" DECIMAL(10,2) NOT NULL,
    "reservedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "forfeitedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "forfeitureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityAwardAccount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UniversityAwardAccount_studentProfileId_status_idx" ON "UniversityAwardAccount"("studentProfileId", "status");
CREATE INDEX "UniversityAwardAccount_universityId_status_idx" ON "UniversityAwardAccount"("universityId", "status");
CREATE UNIQUE INDEX "UniversityAwardAccount_studentProfileId_universityId_key" ON "UniversityAwardAccount"("studentProfileId", "universityId");

ALTER TABLE "UniversityAwardAccount" ADD CONSTRAINT "UniversityAwardAccount_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UniversityAwardAccount" ADD CONSTRAINT "UniversityAwardAccount_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
