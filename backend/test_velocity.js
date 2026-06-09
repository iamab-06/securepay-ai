const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const transactionService = require('./src/services/transactionService');

async function main() {
  const users = await prisma.user.findMany({ take: 2, include: { wallet: true } });
  if (users.length < 2) {
    console.log("Need 2 users");
    return;
  }
  
  const senderUserId = users[0].id;
  const receiverWalletId = users[1].wallet.id;
  
  // ensure sender has enough balance
  await prisma.wallet.update({
    where: { id: users[0].wallet.id },
    data: { balance: 100000 }
  });

  console.log('Starting 10 concurrent transfers...');
  const start = Date.now();
  
  const promises = [];
  for (let i=0; i<10; i++) {
    promises.push(
      transactionService.executeTransfer(senderUserId, receiverWalletId, 1, 'Velocity Test')
        .then(() => console.log(`Transfer ${i} Success at ${Date.now() - start}ms`))
        .catch(e => console.log(`Transfer ${i} Failed at ${Date.now() - start}ms:`, e.message))
    );
  }
  
  await Promise.all(promises);
  console.log(`Total time: ${Date.now() - start}ms`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
