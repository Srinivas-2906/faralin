import { PrismaClient } from '@prisma/client';
import { supportCategoryDefs } from './data/support-categories';

const prisma = new PrismaClient();

async function main() {
  console.log('Backfilling support categories…');

  for (const def of supportCategoryDefs) {
    await prisma.supportCategory.upsert({
      where: { slug: def.slug },
      create: def,
      update: {
        name: def.name,
        description: def.description,
        sortOrder: def.sortOrder,
        isActive: true,
      },
    });
  }

  console.log(`Upserted ${supportCategoryDefs.length} support categories`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
