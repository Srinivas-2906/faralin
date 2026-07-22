import { PrismaClient, UserRole } from '@prisma/client';
import { universityDefs } from './data/universities';

const prisma = new PrismaClient();

async function provisionStaffForUniversity(
  slug: string,
  name: string,
  universityId: string,
) {
  const email = `staff@${slug}.demo`;

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    include: { universityStaffProfile: true, studentProfile: true },
  });

  if (existing?.universityStaffProfile?.universityId === universityId && existing.role === UserRole.UNIVERSITY_STAFF) {
    if (existing.clerkUserId.startsWith('pending_') || existing.clerkUserId.startsWith('clerk_')) {
      return { email, university: name, action: 'skipped' as const };
    }
    return { email, university: name, action: 'exists' as const };
  }

  if (!existing) {
    await prisma.user.create({
      data: {
        clerkUserId: `pending_${crypto.randomUUID().replace(/-/g, '')}`,
        email,
        role: UserRole.UNIVERSITY_STAFF,
        universityStaffProfile: {
          create: {
            universityId,
            jobTitle: 'Widening Participation Officer',
          },
        },
      },
    });
    return { email, university: name, action: 'created' as const };
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: {
      role: UserRole.UNIVERSITY_STAFF,
      universityStaffProfile: existing.universityStaffProfile
        ? {
            update: {
              universityId,
              jobTitle: existing.universityStaffProfile.jobTitle ?? 'Widening Participation Officer',
            },
          }
        : {
            create: {
              universityId,
              jobTitle: 'Widening Participation Officer',
            },
          },
    },
  });

  return { email, university: name, action: 'upgraded' as const };
}

async function main() {
  const universities = await prisma.university.findMany({
    where: { slug: { in: universityDefs.map((u) => u.slug) } },
    orderBy: { name: 'asc' },
  });

  const bySlug = Object.fromEntries(universities.map((u) => [u.slug, u]));
  const results = [];

  for (const def of universityDefs) {
    const university = bySlug[def.slug];
    if (!university) {
      results.push({ email: `staff@${def.slug}.demo`, university: def.name, action: 'missing_university' });
      continue;
    }
    results.push(await provisionStaffForUniversity(def.slug, def.name, university.id));
  }

  const summary = {
    created: results.filter((r) => r.action === 'created').length,
    upgraded: results.filter((r) => r.action === 'upgraded').length,
    skipped: results.filter((r) => r.action === 'skipped' || r.action === 'exists').length,
    missing: results.filter((r) => r.action === 'missing_university').length,
  };

  console.log(JSON.stringify({ ok: true, summary, results }, null, 2));
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
