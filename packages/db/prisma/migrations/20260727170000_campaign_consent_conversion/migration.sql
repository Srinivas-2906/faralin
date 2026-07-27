-- CreateEnum
CREATE TYPE "UkJurisdiction" AS ENUM ('ENGLAND', 'SCOTLAND', 'WALES', 'NORTHERN_IRELAND');
CREATE TYPE "CampaignDeliveryType" AS ENUM ('BURSARY', 'FEE_WAIVER', 'SCHOLARSHIP', 'OTHER');
CREATE TYPE "ConsentScope" AS ENUM (
  'ANONYMOUS_ANALYTICS',
  'ANONYMOUS_SKILL_PROFILE',
  'SHARED_PORTFOLIO',
  'APPLICATION_EVIDENCE',
  'OFFER_VERIFICATION',
  'ENROLMENT_RECONCILIATION'
);
CREATE TYPE "AwardConversionAppealStatus" AS ENUM ('NONE', 'OPEN', 'RESOLVED');

-- AlterTable University
ALTER TABLE "University" ADD COLUMN "jurisdiction" "UkJurisdiction";

-- CreateTable UniversityCampaign
CREATE TABLE "UniversityCampaign" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "budgetGbp" DECIMAL(12,2) NOT NULL,
    "perStudentCapGbp" DECIMAL(10,2),
    "spentGbp" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "universityBoost" DECIMAL(5,4) NOT NULL,
    "subjectAlignmentBoost" DECIMAL(5,4) NOT NULL DEFAULT 1.0,
    "subjectFilters" JSONB,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "deliveryType" "CampaignDeliveryType" NOT NULL DEFAULT 'BURSARY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UniversityCampaign_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UniversityCampaign_universityId_slug_key" ON "UniversityCampaign"("universityId", "slug");
CREATE INDEX "UniversityCampaign_universityId_isActive_idx" ON "UniversityCampaign"("universityId", "isActive");
CREATE INDEX "UniversityCampaign_startsAt_endsAt_idx" ON "UniversityCampaign"("startsAt", "endsAt");

ALTER TABLE "UniversityCampaign" ADD CONSTRAINT "UniversityCampaign_universityId_fkey"
  FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Link projections to campaigns
CREATE INDEX "UniversityProjection_campaignId_idx" ON "UniversityProjection"("campaignId");
ALTER TABLE "UniversityProjection" ADD CONSTRAINT "UniversityProjection_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "UniversityCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AwardConversion
CREATE TABLE "AwardConversion" (
    "id" TEXT NOT NULL,
    "awardAccountId" TEXT NOT NULL,
    "deliveryType" "CampaignDeliveryType" NOT NULL DEFAULT 'BURSARY',
    "amountGbp" DECIMAL(10,2) NOT NULL,
    "institutionReference" TEXT,
    "convertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appealStatus" "AwardConversionAppealStatus" NOT NULL DEFAULT 'NONE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AwardConversion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AwardConversion_awardAccountId_key" ON "AwardConversion"("awardAccountId");
ALTER TABLE "AwardConversion" ADD CONSTRAINT "AwardConversion_awardAccountId_fkey"
  FOREIGN KEY ("awardAccountId") REFERENCES "UniversityAwardAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- StudentConsent
CREATE TABLE "StudentConsent" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "scope" "ConsentScope" NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudentConsent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentConsent_studentProfileId_scope_key" ON "StudentConsent"("studentProfileId", "scope");
CREATE INDEX "StudentConsent_studentProfileId_idx" ON "StudentConsent"("studentProfileId");
ALTER TABLE "StudentConsent" ADD CONSTRAINT "StudentConsent_studentProfileId_fkey"
  FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
