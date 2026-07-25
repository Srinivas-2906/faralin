import { PrismaClient } from '@prisma/client';

const email = process.argv[2]?.trim().toLowerCase();
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: email ? { email: { equals: email, mode: 'insensitive' } } : undefined,
    include: {
      studentProfile: true,
      universityStaffProfile: { include: { university: true } },
    },
  });

  const byClerk = await prisma.user.findMany({
    where: {
      OR: [
        { clerkUserId: { startsWith: 'user_3Fb' } },
        { clerkUserId: { startsWith: 'user_3FY' } },
      ],
    },
    include: {
      studentProfile: true,
      universityStaffProfile: { include: { university: true } },
    },
  });

  console.log(JSON.stringify({ emailLookup: user, clerkMatches: byClerk }, null, 2));
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
