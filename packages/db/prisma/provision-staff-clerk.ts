import { createClerkClient } from '@clerk/backend';
import { PrismaClient, UserRole } from '@prisma/client';
import { universityDefs } from './data/universities';
import { legacyStaffEmailForSlug, staffEmailForSlug } from './staff-email';

const prisma = new PrismaClient();

const clerkSecretKey = process.env.CLERK_SECRET_KEY?.trim();
const staffDemoPassword = process.env.STAFF_DEMO_PASSWORD?.trim();

if (!clerkSecretKey) {
  console.error('CLERK_SECRET_KEY is required');
  process.exit(1);
}

if (!staffDemoPassword) {
  console.error('STAFF_DEMO_PASSWORD is required');
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: clerkSecretKey });

async function findClerkUserByEmail(email: string) {
  const { data } = await clerk.users.getUserList({
    emailAddress: [email],
    limit: 1,
  });
  return data[0] ?? null;
}

async function ensureClerkUser(email: string) {
  const existing = await findClerkUserByEmail(email);
  if (existing) {
    await clerk.users.deleteUser(existing.id);
  }

  const user = await clerk.users.createUser({
    emailAddress: [email],
    password: staffDemoPassword,
    skipPasswordChecks: true,
    // Demo staff accounts use non-mailbox emails — skip new-device email OTP (Client Trust).
    bypassClientTrust: true,
  } as Parameters<typeof clerk.users.createUser>[0]);

  const primaryEmail =
    user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId) ??
    user.emailAddresses[0];

  if (primaryEmail && primaryEmail.verification?.status !== 'verified') {
    await clerk.emailAddresses.updateEmailAddress(primaryEmail.id, {
      verified: true,
    });
  }

  return {
    clerkUserId: user.id,
    action: existing ? ('recreated' as const) : ('created' as const),
  };
}

async function removeLegacyUser(legacyEmail: string, keepUserId: string) {
  const legacy = await prisma.user.findFirst({
    where: { email: { equals: legacyEmail, mode: 'insensitive' } },
    include: { universityStaffProfile: true },
  });

  if (!legacy || legacy.id === keepUserId) return;

  await prisma.$transaction(async (tx) => {
    if (legacy.universityStaffProfile) {
      await tx.universityStaffProfile.delete({ where: { userId: legacy.id } });
    }
    await tx.user.delete({ where: { id: legacy.id } });
  });
}

async function provisionStaffForUniversity(
  slug: string,
  name: string,
  universityId: string,
) {
  const email = staffEmailForSlug(slug);
  const legacyEmail = legacyStaffEmailForSlug(slug);

  const { clerkUserId, action: clerkAction } = await ensureClerkUser(email);

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    include: { universityStaffProfile: true },
  });

  if (existing?.clerkUserId === clerkUserId && existing.role === UserRole.UNIVERSITY_STAFF) {
    await removeLegacyUser(legacyEmail, existing.id);
    return { email, university: name, clerkAction, dbAction: 'skipped' as const };
  }

  const byClerk = await prisma.user.findUnique({
    where: { clerkUserId },
    include: { universityStaffProfile: true, studentProfile: true },
  });

  if (byClerk && byClerk.email.toLowerCase() !== email.toLowerCase()) {
    await prisma.user.update({
      where: { id: byClerk.id },
      data: {
        email,
        role: UserRole.UNIVERSITY_STAFF,
        universityStaffProfile: byClerk.universityStaffProfile
          ? {
              update: {
                universityId,
                jobTitle: 'Widening Participation Officer',
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
    await removeLegacyUser(legacyEmail, byClerk.id);
    return { email, university: name, clerkAction, dbAction: 'upgraded' as const };
  }

  if (!existing) {
    await prisma.user.create({
      data: {
        clerkUserId,
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
    await removeLegacyUser(legacyEmail, '');
    return { email, university: name, clerkAction, dbAction: 'created' as const };
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: {
      clerkUserId,
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
  await removeLegacyUser(legacyEmail, existing.id);
  return { email, university: name, clerkAction, dbAction: 'updated' as const };
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
      results.push({
        email: staffEmailForSlug(def.slug),
        university: def.name,
        clerkAction: 'missing_university',
        dbAction: 'missing_university',
      });
      continue;
    }
    results.push(await provisionStaffForUniversity(def.slug, def.name, university.id));
  }

  const summary = {
    clerkCreated: results.filter((r) => r.clerkAction === 'created').length,
    clerkRecreated: results.filter((r) => r.clerkAction === 'recreated').length,
    dbCreated: results.filter((r) => r.dbAction === 'created').length,
    updated: results.filter((r) => r.dbAction === 'updated' || r.dbAction === 'upgraded').length,
    skipped: results.filter((r) => r.dbAction === 'skipped').length,
    missing: results.filter((r) => r.dbAction === 'missing_university').length,
  };

  console.log(
    JSON.stringify(
      {
        ok: true,
        summary,
        passwordNote: 'Use STAFF_DEMO_PASSWORD env value to sign in',
        results,
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
