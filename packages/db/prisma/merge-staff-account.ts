import { PrismaClient, UserRole } from '@prisma/client';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: tsx prisma/merge-staff-account.ts <email>');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const pendingStaff = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: 'insensitive' },
      role: UserRole.UNIVERSITY_STAFF,
      clerkUserId: { startsWith: 'pending_' },
    },
    include: { universityStaffProfile: true },
  });

  const linkedStaff = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: 'insensitive' },
      role: UserRole.UNIVERSITY_STAFF,
      clerkUserId: { not: { startsWith: 'pending_' } },
    },
    include: { universityStaffProfile: { include: { university: true } } },
  });

  if (linkedStaff) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          alreadyLinked: true,
          email: linkedStaff.email,
          clerkUserId: linkedStaff.clerkUserId,
          university: linkedStaff.universityStaffProfile?.university.name,
        },
        null,
        2,
      ),
    );
    return;
  }

  const studentCandidates = await prisma.user.findMany({
    where: {
      role: UserRole.STUDENT,
      NOT: { clerkUserId: { startsWith: 'pending_' } },
      OR: [
        { email: { equals: email, mode: 'insensitive' } },
        { email: { endsWith: '@faralin.local' } },
        { clerkUserId: { startsWith: 'user_' } },
      ],
    },
    include: { studentProfile: true, universityStaffProfile: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const candidate = studentCandidates[0];
  if (!candidate) {
    throw new Error(
      `No Clerk-linked student account found to merge for ${email}. Sign in once at the university portal, then rerun.`,
    );
  }

  const universityId = pendingStaff?.universityStaffProfile?.universityId;
  if (!universityId) {
    const university = await prisma.university.findFirst({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    if (!university) throw new Error('No university found');
  }

  const resolvedUniversityId =
    pendingStaff?.universityStaffProfile?.universityId ??
    (
      await prisma.university.findFirst({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      })
    )!.id;

  const merged = await prisma.$transaction(async (tx) => {
    if (pendingStaff) {
      await tx.universityStaffProfile.deleteMany({ where: { userId: pendingStaff.id } }).catch(() => undefined);
      await tx.user.delete({ where: { id: pendingStaff.id } });
    }

    return tx.user.update({
      where: { id: candidate.id },
      data: {
        email,
        role: UserRole.UNIVERSITY_STAFF,
        universityStaffProfile: candidate.universityStaffProfile
          ? {
              update: {
                universityId: resolvedUniversityId,
                jobTitle: 'University staff',
              },
            }
          : {
              create: {
                universityId: resolvedUniversityId,
                jobTitle: 'University staff',
              },
            },
      },
      include: {
        universityStaffProfile: { include: { university: true } },
      },
    });
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        merged: true,
        email: merged.email,
        clerkUserId: merged.clerkUserId,
        previousEmail: candidate.email,
        university: merged.universityStaffProfile?.university.name,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
