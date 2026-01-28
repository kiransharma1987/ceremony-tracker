import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('puranjana@2026', 10);
  await prisma.user.update({
    where: { email: 'admin@ceremony.app' },
    data: { password: hash }
  });
  console.log('Admin password updated to: puranjana@2026');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
