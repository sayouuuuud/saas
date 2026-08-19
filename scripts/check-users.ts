import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log('Users in DB:', users.map(u => ({ email: u.email, id: u.id, hasPassword: !!u.passwordHash })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
