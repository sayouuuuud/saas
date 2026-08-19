import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@test.com';
  const passwordHash = await bcrypt.hash('123456', 10); // Common test password

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Admin User',
      passwordHash,
      isStaff: true,
      staffRole: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
  });
  
  // also create a workspace for them
  const plan = await prisma.plan.findFirst();
  if (plan) {
    await prisma.workspace.upsert({
      where: { ownerId: user.id },
      update: {},
      create: {
        name: 'Admin Workspace',
        ownerId: user.id,
        planId: plan.id,
      }
    });
  }

  console.log(`Created admin user: ${user.email} (ID: ${user.id})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
