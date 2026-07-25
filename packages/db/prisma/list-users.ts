import { PrismaClient } from '@prisma/client';

const query = process.argv[2]?.trim() ?? '';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { clerkUserId: { contains: query } },
          ],
        }
      : undefined,
    take: 20,
    select: {
      id: true,
      email: true,
      clerkUserId: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
