import { PrismaClient, UserRole } from '@prisma/client';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: tsx prisma/provision-staff.ts <email> [universitySlug]');
  process.exit(1);
}

const universitySlug = process.argv[3]?.trim();

const prisma = new PrismaClient();

async function main() {
  const university = universitySlug
    ? await prisma.university.findUnique({ where: { slug: universitySlug } })
    : await prisma.university.findFirst({ where: { isActive: true }, orderBy: { name: 'asc' } });

  if (!university) {
    throw new Error('No university found');
  }

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    include: { universityStaffProfile: true, studentProfile: true },
  });

  if (!existing) {
    const user = await prisma.user.create({
      data: {
        clerkUserId: `pending_${crypto.randomUUID().replace(/-/g, '')}`,
        email,
        role: UserRole.UNIVERSITY_STAFF,
        universityStaffProfile: {
          create: {
            universityId: university.id,
            jobTitle: 'University staff',
          },
        },
      },
      include: {
        universityStaffProfile: { include: { university: true } },
      },
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          created: true,
          email: user.email,
          role: user.role,
          university: user.universityStaffProfile?.university.name,
          note: 'Pending account created. Sign out of the university portal, then sign in again with this email.',
        },
        null,
        2,
      ),
    );
    return;
  }

  const user = await prisma.user.update({
    where: { id: existing.id },
    data: {
      role: UserRole.UNIVERSITY_STAFF,
      universityStaffProfile: existing.universityStaffProfile
        ? {
            update: {
              universityId: university.id,
              jobTitle: existing.universityStaffProfile.jobTitle ?? 'University staff',
            },
          }
        : {
            create: {
              universityId: university.id,
              jobTitle: 'University staff',
            },
          },
    },
    include: {
      universityStaffProfile: { include: { university: true } },
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        email: user.email,
        clerkUserId: user.clerkUserId,
        role: user.role,
        university: user.universityStaffProfile?.university.name,
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
