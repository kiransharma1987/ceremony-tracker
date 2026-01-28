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

  // 4. Create Attendee Users
  const attendees = [
    { email: 'attendee1@event.local', name: 'Attendee 1' },
    { email: 'attendee2@event.local', name: 'Attendee 2' },
    { email: 'attendee3@event.local', name: 'Attendee 3' },
    { email: 'attendee4@event.local', name: 'Attendee 4' }
  ];

  for (const attendeeData of attendees) {
    let attendee = await prisma.user.findUnique({
      where: { email: attendeeData.email }
    });

    if (!attendee) {
      const hashedPassword = await bcrypt.hash('attendee123', 10);
      await prisma.user.create({
        data: {
          email: attendeeData.email,
          password: hashedPassword,
          name: attendeeData.name,
          displayName: attendeeData.name,
          role: 'ATTENDEE',
          isActive: true,
          productId: product.id
        }
      });
      console.log(`✓ Created attendee: ${attendeeData.email}`);
    } else {
      console.log(`✓ Attendee exists: ${attendeeData.email}`);
    }
  }

  // 5. Create Sponsor User
  let sponsor = await prisma.user.findUnique({
    where: { email: 'sponsor@event.local' }
  });

  if (!sponsor) {
    const hashedPassword = await bcrypt.hash('sponsor123', 10);
    await prisma.user.create({
      data: {
        email: 'sponsor@event.local',
        password: hashedPassword,
        name: 'Event Sponsor',
        displayName: 'Sponsor',
        role: 'SPONSOR',
        isActive: true,
        productId: product.id
      }
    });
    console.log(`✓ Created sponsor: sponsor@event.local`);
  } else {
    console.log(`✓ Sponsor exists: sponsor@event.local`);
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
  console.log('Attendees: attendee1@event.local / attendee123 (and similar for attendee2, 3, 4)');
  console.log('Sponsor: sponsor@event.local / sponsor123');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

