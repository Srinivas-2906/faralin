import { createClerkClient } from '@clerk/backend';
import { PrismaClient, UserRole } from '@prisma/client';
import {
  ADMIN_EMAIL,
  SUPPORT_AGENT_COUNT,
  supportAgentEmail,
} from './support-email';

const prisma = new PrismaClient();

const clerkSecretKey = process.env.CLERK_SECRET_KEY?.trim();
const supportDemoPassword =
  process.env.SUPPORT_DEMO_PASSWORD?.trim() ?? process.env.STAFF_DEMO_PASSWORD?.trim();

if (!clerkSecretKey) {
  console.error('CLERK_SECRET_KEY is required');
  process.exit(1);
}

if (!supportDemoPassword) {
  console.error('SUPPORT_DEMO_PASSWORD or STAFF_DEMO_PASSWORD is required');
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
    password: supportDemoPassword,
    skipPasswordChecks: true,
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

async function provisionAdmin() {
  const { clerkUserId, action: clerkAction } = await ensureClerkUser(ADMIN_EMAIL);

  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    include: { adminProfile: true },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        clerkUserId,
        email: ADMIN_EMAIL,
        role: UserRole.ADMIN,
        adminProfile: { create: {} },
      },
    });
    return { email: ADMIN_EMAIL, role: 'ADMIN', clerkAction, dbAction: 'created' as const };
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: {
      clerkUserId,
      role: UserRole.ADMIN,
      adminProfile: existing.adminProfile ? undefined : { create: {} },
    },
  });

  return { email: ADMIN_EMAIL, role: 'ADMIN', clerkAction, dbAction: 'updated' as const };
}

async function provisionAgent(index: number) {
  const email = supportAgentEmail(index);
  const displayName = `Support Agent ${index}`;
  const { clerkUserId, action: clerkAction } = await ensureClerkUser(email);

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { supportAgentProfile: true },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        clerkUserId,
        email,
        role: UserRole.SUPPORT_AGENT,
        supportAgentProfile: {
          create: {
            displayName,
            jobTitle: 'Support Agent',
          },
        },
      },
    });
    return { email, role: 'SUPPORT_AGENT', clerkAction, dbAction: 'created' as const };
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: {
      clerkUserId,
      role: UserRole.SUPPORT_AGENT,
      supportAgentProfile: existing.supportAgentProfile
        ? {
            update: {
              displayName: existing.supportAgentProfile.displayName ?? displayName,
              jobTitle: existing.supportAgentProfile.jobTitle ?? 'Support Agent',
              isActive: true,
            },
          }
        : {
            create: {
              displayName,
              jobTitle: 'Support Agent',
            },
          },
    },
  });

  return { email, role: 'SUPPORT_AGENT', clerkAction, dbAction: 'updated' as const };
}

async function main() {
  const results = [await provisionAdmin()];

  for (let i = 1; i <= SUPPORT_AGENT_COUNT; i += 1) {
    results.push(await provisionAgent(i));
  }

  const summary = {
    clerkCreated: results.filter((r) => r.clerkAction === 'created').length,
    clerkRecreated: results.filter((r) => r.clerkAction === 'recreated').length,
    dbCreated: results.filter((r) => r.dbAction === 'created').length,
    updated: results.filter((r) => r.dbAction === 'updated').length,
  };

  console.log(
    JSON.stringify(
      {
        ok: true,
        summary,
        passwordNote: 'Use SUPPORT_DEMO_PASSWORD or STAFF_DEMO_PASSWORD env value to sign in',
        adminPortal: 'https://admin.faralin.kaana.in/sign-in',
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
