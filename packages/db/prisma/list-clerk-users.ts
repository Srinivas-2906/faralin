import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { role: UserRole.STUDENT, NOT: { clerkUserId: { startsWith: 'clerk_' } } },
        { email: { contains: 'navy', mode: 'insensitive' } },
        { email: { endsWith: '@faralin.local' } },
      ],
    },
    select: {
      id: true,
      email: true,
      clerkUserId: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
