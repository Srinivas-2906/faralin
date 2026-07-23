-- CreateEnum
CREATE TYPE "AssessmentCategory" AS ENUM ('EMPLOYABILITY', 'ACADEMIC_SKILLS', 'FINANCIAL_WELLBEING', 'MENTAL_WELLBEING', 'DIGITAL_SKILLS', 'SUSTAINABILITY', 'DIVERSITY_INCLUSION', 'STUDENT_LIFE', 'ACADEMIC_SUBJECT');

-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN "category" "AssessmentCategory" NOT NULL DEFAULT 'ACADEMIC_SUBJECT';
ALTER TABLE "Assessment" ADD COLUMN "seriesSlug" TEXT;
ALTER TABLE "Assessment" ADD COLUMN "levelOrder" INTEGER;

-- CreateTable
CREATE TABLE "UniversityAssessmentConfig" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "isCompulsory" BOOLEAN NOT NULL DEFAULT false,
    "yearGroups" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "availableFrom" TIMESTAMP(3),
    "availableTo" TIMESTAMP(3),
    "affectsBursaryEligibility" BOOLEAN NOT NULL DEFAULT true,
    "bonusRules" JSONB,
    "unlocksAfterAssessmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityAssessmentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityProblemTrackConfig" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "problemTrackId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "isCompulsory" BOOLEAN NOT NULL DEFAULT false,
    "bonusRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityProblemTrackConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UniversityAssessmentConfig_universityId_assessmentId_key" ON "UniversityAssessmentConfig"("universityId", "assessmentId");
CREATE INDEX "UniversityAssessmentConfig_universityId_enabled_idx" ON "UniversityAssessmentConfig"("universityId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityProblemTrackConfig_universityId_problemTrackId_key" ON "UniversityProblemTrackConfig"("universityId", "problemTrackId");
CREATE INDEX "UniversityProblemTrackConfig_universityId_enabled_idx" ON "UniversityProblemTrackConfig"("universityId", "enabled");

-- AddForeignKey
ALTER TABLE "UniversityAssessmentConfig" ADD CONSTRAINT "UniversityAssessmentConfig_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UniversityAssessmentConfig" ADD CONSTRAINT "UniversityAssessmentConfig_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UniversityAssessmentConfig" ADD CONSTRAINT "UniversityAssessmentConfig_unlocksAfterAssessmentId_fkey" FOREIGN KEY ("unlocksAfterAssessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityProblemTrackConfig" ADD CONSTRAINT "UniversityProblemTrackConfig_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UniversityProblemTrackConfig" ADD CONSTRAINT "UniversityProblemTrackConfig_problemTrackId_fkey" FOREIGN KEY ("problemTrackId") REFERENCES "ProblemTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
