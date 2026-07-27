import { ApplicationStatus } from '@faralin/db';
import { mapStudentWithProfile } from '../auth/auth-user.service';
import { PrismaService } from '../prisma/prisma.service';

export type StaffStudentRow = ReturnType<typeof mapStudentWithProfile> & {
  studentProfileId: string;
  totalFaralins: number;
  verifiedFaralins: number;
  subjectNames: string[];
  performanceBand: 'developing' | 'steady' | 'strong' | 'exceptional';
  applicationStatus: ApplicationStatus | 'FOLLOWER';
};

export function getPerformanceBand(
  totalFaralins: number,
  assessmentsCompleted: number,
): StaffStudentRow['performanceBand'] {
  const score = totalFaralins + assessmentsCompleted * 50;
  if (score >= 3000) return 'exceptional';
  if (score >= 1500) return 'strong';
  if (score >= 500) return 'steady';
  return 'developing';
}

export async function buildStaffStudentRoster(
  prisma: PrismaService,
  universityId: string,
): Promise<StaffStudentRow[]> {
  const [selections, faralinTotals, verifiedTotals] = await Promise.all([
    prisma.studentUniversitySelection.findMany({
      where: { universityId },
      include: {
        studentProfile: {
          include: {
            subjects: { include: { subject: true } },
            assessmentAttempts: {
              where: { completedAt: { not: null }, isVoided: false },
            },
            applications: { where: { universityId } },
          },
        },
      },
      orderBy: { selectedAt: 'desc' },
    }),
    prisma.faralinTransaction.groupBy({
      by: ['studentProfileId'],
      where: { universityId },
      _sum: { amount: true },
    }),
    prisma.faralinTransaction.groupBy({
      by: ['studentProfileId'],
      where: {
        universityId,
        trustLevel: { not: 'PRACTICE' },
        status: { in: ['CONDITIONAL', 'CONFIRMED'] },
      },
      _sum: { amount: true },
    }),
  ]);

  const faralinByStudent = Object.fromEntries(
    faralinTotals.map((row) => [row.studentProfileId, row._sum.amount ?? 0]),
  );
  const verifiedByStudent = Object.fromEntries(
    verifiedTotals.map((row) => [row.studentProfileId, row._sum.amount ?? 0]),
  );

  return selections.map((selection) => {
    const profile = selection.studentProfile;
    const totalFaralins = faralinByStudent[profile.id] ?? 0;
    const verifiedFaralins = verifiedByStudent[profile.id] ?? 0;
    const application = profile.applications[0];
    const mapped = mapStudentWithProfile(profile, {
      subjectSlugs: profile.subjects.map((s) => s.subject.slug),
      assessmentsCompleted: profile.assessmentAttempts.length,
      totalFaralins,
    });

    return {
      ...mapped,
      studentProfileId: profile.id,
      totalFaralins,
      verifiedFaralins,
      subjectNames: profile.subjects.map((s) => s.subject.name),
      performanceBand: getPerformanceBand(totalFaralins, profile.assessmentAttempts.length),
      applicationStatus: application?.status ?? ApplicationStatus.FOLLOWER,
    };
  });
}

export function buildSubjectInterests(roster: StaffStudentRow[]) {
  const counts: Record<string, { name: string; count: number }> = {};
  for (const student of roster) {
    student.subjectSlugs.forEach((slug, index) => {
      const name = student.subjectNames[index] ?? slug;
      if (!counts[slug]) {
        counts[slug] = { name, count: 0 };
      }
      counts[slug].count += 1;
    });
  }
  return Object.entries(counts)
    .map(([slug, value]) => ({ slug, name: value.name, count: value.count }))
    .sort((a, b) => b.count - a.count);
}

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  FOLLOWER: 'Following',
  FARALIN_ACTIVE: 'Faralin active',
  REFERRAL_CLICKED: 'Referral clicked',
  APPLIED: 'Applied',
  OFFER_RECEIVED: 'Offer received',
  OFFER_ACCEPTED: 'Offer accepted',
  FIRM: 'Firm choice',
  INSURANCE: 'Insurance choice',
  ENROLLED: 'Enrolled',
  WITHDRAWN: 'Withdrawn',
  REJECTED: 'Rejected',
};
