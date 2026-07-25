import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: new Date('2026-07-21T19:30:00Z') },
    },
    include: {
      universityStaffProfile: { include: { university: true } },
      studentProfile: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
