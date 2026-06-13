const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Transferring admin privileges...');

  // Promote abhi
  const abhiResult = await prisma.user.updateMany({
    where: { email: 'abhi@securePay' },
    data: { role: 'ADMIN' }
  });
  console.log(`Updated abhi@securePay to ADMIN: ${abhiResult.count > 0 ? 'Success' : 'User not found'}`);

  // Demote sam
  const samResult = await prisma.user.updateMany({
    where: { email: 'samsulek@securePay' },
    data: { role: 'USER' }
  });
  console.log(`Demoted samsulek@securePay to USER: ${samResult.count > 0 ? 'Success' : 'User not found'}`);

  // Verify
  console.log('\n--- VERIFICATION OUTPUT ---');
  const abhiUser = await prisma.user.findFirst({
    where: { email: 'abhi@securePay' },
    select: { email: true, role: true }
  });
  
  if (abhiUser) {
    console.log(`${abhiUser.email} | ${abhiUser.role}`);
  } else {
    console.log('abhi@securePay not found in database.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
