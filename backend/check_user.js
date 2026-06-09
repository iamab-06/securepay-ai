const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log('All Users:');
  users.forEach(u => console.log(u.email));
  
  const user = await prisma.user.findUnique({ where: { email: 'samsulek@securepay.com' } });
  console.log('Target user found:', user !== null);
}
main().catch(console.error).finally(() => prisma.$disconnect());
