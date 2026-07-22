import {
  ApplicationStatus,
  FaralinTransactionStatus,
  FaralinTransactionType,
  FaralinTrustLevel,
  PrismaClient,
  UserRole,
} from '@prisma/client';

export async function seedStudentPipeline(
  prisma: PrismaClient,
  universityBySlug: Record<string, { id: string; slug: string }>,
  subjectMap: Record<string, { id: string; slug: string }>,
) {
  const demoStudents = [
    {
      email: 'demo.student.1@faralin.com',
      anonymousId: 'STU-DEMO-001',
      firstName: 'Alex',
      lastName: 'Morgan',
      subjects: ['mathematics', 'physics'],
      universities: [
        { slug: 'oxford', priority: 1, status: ApplicationStatus.APPLIED, faralins: 1200 },
        { slug: 'cambridge', priority: 2, status: ApplicationStatus.FOLLOWER, faralins: 0 },
      ],
    },
    {
      email: 'demo.student.2@faralin.com',
      anonymousId: 'STU-DEMO-002',
      subjects: ['biology', 'chemistry'],
      universities: [
        { slug: 'oxford', priority: 1, status: ApplicationStatus.REFERRAL_CLICKED, faralins: 450 },
        { slug: 'imperial', priority: 2, status: ApplicationStatus.OFFER_RECEIVED, faralins: 2100 },
      ],
    },
    {
      email: 'demo.student.3@faralin.com',
      anonymousId: 'STU-DEMO-003',
      subjects: ['economics', 'history'],
      universities: [
        { slug: 'lse', priority: 1, status: ApplicationStatus.ENROLLED, faralins: 3200 },
        { slug: 'ucl', priority: 2, status: ApplicationStatus.FOLLOWER, faralins: 0 },
      ],
    },
    {
      email: 'demo.student.4@faralin.com',
      anonymousId: 'STU-DEMO-004',
      subjects: ['computer-science'],
      universities: [
        { slug: 'cardiff', priority: 1, status: ApplicationStatus.FOLLOWER, faralins: 0 },
        { slug: 'bath', priority: 2, status: ApplicationStatus.REFERRAL_CLICKED, faralins: 180 },
      ],
    },
    {
      email: 'demo.student.5@faralin.com',
      anonymousId: 'STU-DEMO-005',
      subjects: ['english', 'psychology'],
      universities: [
        { slug: 'edinburgh', priority: 1, status: ApplicationStatus.OFFER_ACCEPTED, faralins: 890 },
        { slug: 'durham', priority: 2, status: ApplicationStatus.APPLIED, faralins: 620 },
      ],
    },
  ];

  for (const [index, student] of demoStudents.entries()) {
    const user = await prisma.user.create({
      data: {
        clerkUserId: `clerk_demo_student_${index + 1}`,
        email: student.email,
        role: UserRole.STUDENT,
        studentProfile: {
          create: {
            anonymousId: student.anonymousId,
            firstName: student.firstName ?? null,
            lastName: student.lastName ?? null,
            schoolName: 'Demo High School',
            yearGroup: 13,
            onboardingComplete: true,
          },
        },
      },
      include: { studentProfile: true },
    });

    const profile = user.studentProfile!;

    for (const subjectSlug of student.subjects) {
      const subject = subjectMap[subjectSlug];
      if (!subject) continue;
      await prisma.studentSubject.create({
        data: { studentProfileId: profile.id, subjectId: subject.id },
      });
    }

    for (const selection of student.universities) {
      const university = universityBySlug[selection.slug];
      if (!university) continue;

      await prisma.studentUniversitySelection.create({
        data: {
          studentProfileId: profile.id,
          universityId: university.id,
          priority: selection.priority,
        },
      });

      await prisma.application.create({
        data: {
          studentProfileId: profile.id,
          universityId: university.id,
          status: selection.status,
          referralClickedAt:
            selection.status !== ApplicationStatus.FOLLOWER ? new Date() : undefined,
          appliedAt: ['APPLIED', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'ENROLLED'].includes(
            selection.status,
          )
            ? new Date()
            : undefined,
          offerReceivedAt: ['OFFER_RECEIVED', 'OFFER_ACCEPTED', 'ENROLLED'].includes(
            selection.status,
          )
            ? new Date()
            : undefined,
          offerAcceptedAt: ['OFFER_ACCEPTED', 'ENROLLED'].includes(selection.status)
            ? new Date()
            : undefined,
          enrolledAt:
            selection.status === ApplicationStatus.ENROLLED ? new Date() : undefined,
        },
      });

      if (selection.faralins > 0) {
        await prisma.faralinTransaction.create({
          data: {
            studentProfileId: profile.id,
            universityId: university.id,
            type: FaralinTransactionType.EARNED,
            amount: selection.faralins,
            status: FaralinTransactionStatus.CONDITIONAL,
            trustLevel: FaralinTrustLevel.VERIFIED,
            reason: 'Demo seed pipeline data',
          },
        });
      }
    }
  }

  console.log(`Seeded ${demoStudents.length} demo students with pipeline data`);
}
