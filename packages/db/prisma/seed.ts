import { PrismaClient } from '@prisma/client';
import { seedDaNangPilot, seedPlatformAdmin } from './seed-da-nang';

const prisma = new PrismaClient();

async function main() {
  await seedPlatformAdmin(prisma);
  await seedDaNangPilot(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
