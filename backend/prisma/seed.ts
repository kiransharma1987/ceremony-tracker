import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Product (Event)
  let product = await prisma.product.findFirst({
    where: { name: "Padmamma's First Year Ceremony 2026" }
  });

  if (!product) {
    product = await prisma.product.create({
      data: {
        name: "Padmamma's First Year Ceremony 2026",
        type: 'CEREMONY',
        description: 'First year anniversary celebration',
        currency: '₹',
        overallBudget: 500000,
        isClosed: false
      }
    });
    console.log(`✓ Created product: ${product.name}`);
  } else {
    console.log(`✓ Product exists: ${product.name}`);
  }

  // 2. Create Super Admin User (you)
  let superAdmin = await prisma.user.findUnique({
    where: { email: 'super@ceremony.local' }
  });

  if (!superAdmin) {
    const hashedPasswordSuperAdmin = await bcrypt.hash('superadmin123', 10);
    superAdmin = await prisma.user.create({
      data: {
        email: 'super@ceremony.local',
        password: hashedPasswordSuperAdmin,
        name: 'Super Admin',
        displayName: 'System Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
        productId: null
      }
    });
    console.log(`✓ Created super admin: ${superAdmin.email}`);
  } else {
    console.log(`✓ Super admin exists: ${superAdmin.email}`);
  }

  // 3. Create Admin User
  let admin = await prisma.user.findUnique({
    where: { email: 'admin@ceremony.local' }
  });

  if (!admin) {
    const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
    admin = await prisma.user.create({
      data: {
        email: 'admin@ceremony.local',
        password: hashedPasswordAdmin,
        name: 'Admin',
        displayName: 'Event Admin',
        role: 'ADMIN',
        isActive: true,
        productId: product.id
      }
    });
    console.log(`✓ Created admin: ${admin.email}`);
  } else {
    console.log(`✓ Admin exists: ${admin.email}`);
  }

  // 4. Create Participant Users
  const participants = [
    { email: 'hnk@ceremony.local', name: 'HNK', brotherId: 'HNK' },
    { email: 'hnp@ceremony.local', name: 'HNP', brotherId: 'HNP' },
    { email: 'hns@ceremony.local', name: 'HNS', brotherId: 'HNS' },
    { email: 'hnm@ceremony.local', name: 'HNM', brotherId: 'HNM' }
  ];

  for (const participantData of participants) {
    let participant = await prisma.user.findUnique({
      where: { email: participantData.email }
    });

    if (!participant) {
      const hashedPassword = await bcrypt.hash(`${participantData.brotherId}123`, 10);
      await prisma.user.create({
        data: {
          email: participantData.email,
          password: hashedPassword,
          name: participantData.name,
          displayName: participantData.name,
          role: 'PARTICIPANT',
          isActive: true,
          productId: product.id,
          brotherId: participantData.brotherId
        }
      });
      console.log(`✓ Created participant: ${participantData.email}`);
    } else {
      console.log(`✓ Participant exists: ${participantData.email}`);
    }
  }

  // 5. Create Contributor User
  let contributor = await prisma.user.findUnique({
    where: { email: 'hnu@ceremony.local' }
  });

  if (!contributor) {
    const hashedPassword = await bcrypt.hash('hnu123', 10);
    await prisma.user.create({
      data: {
        email: 'hnu@ceremony.local',
        password: hashedPassword,
        name: 'HNU (Sister)',
        displayName: 'HNU',
        role: 'CONTRIBUTOR',
        isActive: true,
        productId: product.id
      }
    });
    console.log(`✓ Created contributor: hnu@ceremony.local`);
  } else {
    console.log(`✓ Contributor exists: hnu@ceremony.local`);
  }

  // 6. Create sample budget categories if not exist
  const budgetCategories = [
    { category: 'Food & Catering', amount: 150000 },
    { category: 'Priest Renumeration', amount: 50000 },
    { category: 'Pooje Items', amount: 30000 },
    { category: 'Dhaanas', amount: 100000 },
    { category: 'Venue', amount: 50000 },
    { category: 'Return Gifts', amount: 50000 },
    { category: 'Transport', amount: 30000 },
    { category: 'Miscellaneous', amount: 40000 }
  ];

  for (const budget of budgetCategories) {
    const existingBudget = await prisma.budget.findFirst({
      where: {
        productId: product.id,
        category: budget.category
      }
    });

    if (!existingBudget) {
      await prisma.budget.create({
        data: {
          ...budget,
          productId: product.id
        }
      });
    }
  }

  const budgetCount = await prisma.budget.count({
    where: { productId: product.id }
  });
  console.log(`✓ Ensured ${budgetCount} budget categories exist`);

  console.log('\n✅ Database seeding completed!');
  console.log('\n📝 Test Credentials:');
  console.log('Super Admin: super@ceremony.local / superadmin123');
  console.log('Admin: admin@ceremony.local / admin123');
  console.log('Participants: hnk@ceremony.local / hnk123 (and similar for hnp, hns, hnm)');
  console.log('Contributor: hnu@ceremony.local / hnu123');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

