import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const brotherPassword = await bcrypt.hash('brother123', 10);
  const contributorPassword = await bcrypt.hash('contributor123', 10);

  // Admin (KHK)
  await prisma.user.upsert({
    where: { email: 'admin@ceremony.app' },
    update: {},
    create: {
      email: 'admin@ceremony.app',
      password: adminPassword,
      name: 'KHK (Admin)',
      role: 'ADMIN'
    }
  });

  // Brothers
  const brothers = [
    { email: 'hnk@ceremony.app', name: 'H N K', brotherId: 'HNK' },
    { email: 'hnp@ceremony.app', name: 'H N P', brotherId: 'HNP' },
    { email: 'hns@ceremony.app', name: 'H N S', brotherId: 'HNS' },
    { email: 'hnm@ceremony.app', name: 'H N M', brotherId: 'HNM' }
  ];

  for (const brother of brothers) {
    await prisma.user.upsert({
      where: { email: brother.email },
      update: {},
      create: {
        email: brother.email,
        password: brotherPassword,
        name: brother.name,
        role: 'BROTHER',
        brotherId: brother.brotherId
      }
    });
  }

  // Contributors
  await prisma.user.upsert({
    where: { email: 'hnu@ceremony.app' },
    update: {},
    create: {
      email: 'hnu@ceremony.app',
      password: contributorPassword,
      name: 'H N U (Sister)',
      role: 'CONTRIBUTOR'
    }
  });

  await prisma.user.upsert({
    where: { email: 'contributor@ceremony.app' },
    update: {},
    create: {
      email: 'contributor@ceremony.app',
      password: contributorPassword,
      name: 'Relative',
      role: 'CONTRIBUTOR'
    }
  });

  // Create default app settings
  await prisma.settings.upsert({
    where: { id: 'app_settings' },
    update: {},
    create: {
      id: 'app_settings',
      overallBudget: 500000,
      isClosed: false
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('Default users created:');
  console.log('  Admin:       admin@ceremony.app / admin123');
  console.log('  Brothers:    hnk@ceremony.app, hnp@ceremony.app, hns@ceremony.app, hnm@ceremony.app / brother123');
  console.log('  Contributors: hnu@ceremony.app, contributor@ceremony.app / contributor123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
