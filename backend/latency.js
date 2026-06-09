const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const s = Date.now();
  await prisma.$connect();
  console.log('Connect:', Date.now() - s);
  
  const s2 = Date.now();
  await prisma.$queryRawUnsafe('SELECT 1');
  console.log('Raw Query 1:', Date.now() - s2);
  
  const s3 = Date.now();
  await prisma.$queryRawUnsafe('SELECT 1');
  console.log('Raw Query 2:', Date.now() - s3);

  const s4 = Date.now();
  await prisma.wallet.findUnique({ where: { wallet_number: 'NOT_FOUND' }});
  console.log('Find Unique:', Date.now() - s4);
}
main().finally(() => prisma.$disconnect());
