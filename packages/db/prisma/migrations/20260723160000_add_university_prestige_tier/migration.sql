-- CreateEnum
CREATE TYPE "UniversityPrestigeTier" AS ENUM ('ELITE', 'PREMIER', 'ESTABLISHED', 'ACCESSIBLE');

-- AlterTable
ALTER TABLE "University" ADD COLUMN     "guardianRank2025" INTEGER,
ADD COLUMN     "prestigeTier" "UniversityPrestigeTier",
ADD COLUMN     "rankingSource" TEXT DEFAULT 'Guardian University Guide 2025';
