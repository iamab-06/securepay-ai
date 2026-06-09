const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
  const users = await prisma.user.findMany({ take: 2, include: { wallet: true } });
  const senderWallet = users[0].wallet;
  const receiverWallet = users[1].wallet;

  await prisma.wallet.update({ where: { id: senderWallet.id }, data: { balance: 10000 } });

  console.log('Starting single transaction trace...');
  
  const start = Date.now();
  try {
    await prisma.$transaction(async (tx) => {
      console.log(`[${Date.now() - start}ms] Transaction started`);
      
      const batchReference = `LGR-${crypto.randomBytes(6).toString('hex')}`;
      await tx.ledgerBatch.create({ data: { batch_reference: batchReference, status: 'POSTED' }});
      console.log(`[${Date.now() - start}ms] Batch created`);
      
      const transaction = await tx.transaction.create({
        data: {
          transaction_reference: `TXN-${crypto.randomBytes(6).toString('hex')}`,
          sender_wallet_id: senderWallet.id,
          receiver_wallet_id: receiverWallet.id,
          amount: 1,
          status: 'SUCCESS'
        }
      });
      console.log(`[${Date.now() - start}ms] Transaction created`);

      const sortedWalletIds = [senderWallet.id, receiverWallet.id].sort();
      for (const id of sortedWalletIds) {
        console.log(`[${Date.now() - start}ms] Updating wallet ${id}`);
        const t1 = Date.now();
        if (id === senderWallet.id) {
          await tx.wallet.update({ where: { id: senderWallet.id }, data: { balance: { decrement: 1 } } });
        } else {
          await tx.wallet.update({ where: { id: receiverWallet.id }, data: { balance: { increment: 1 } } });
        }
        console.log(`[${Date.now() - start}ms] Finished wallet ${id} (took ${Date.now() - t1}ms)`);
      }
      console.log(`[${Date.now() - start}ms] Transaction callback ending`);
    });
    console.log(`[${Date.now() - start}ms] Transaction fully committed`);
  } catch (e) {
    console.error(e);
  }

  // Now let's trace multiple overlapping transactions
  console.log('\nStarting 5 overlapping transaction traces...');
  const promises = [];
  const startConcurrent = Date.now();
  for (let i = 0; i < 5; i++) {
    promises.push(
      prisma.$transaction(async (tx) => {
        const localStart = Date.now();
        console.log(`  [T${i}] Started at ${localStart - startConcurrent}ms`);
        await tx.ledgerBatch.create({ data: { batch_reference: `LGR-${crypto.randomBytes(6).toString('hex')}`, status: 'POSTED' }});
        await tx.transaction.create({
          data: {
            transaction_reference: `TXN-${crypto.randomBytes(6).toString('hex')}`,
            sender_wallet_id: senderWallet.id, receiver_wallet_id: receiverWallet.id, amount: 1, status: 'SUCCESS'
          }
        });
        
        console.log(`  [T${i}] Waiting for locks at ${Date.now() - startConcurrent}ms`);
        const sortedWalletIds = [senderWallet.id, receiverWallet.id].sort();
        for (const id of sortedWalletIds) {
          if (id === senderWallet.id) {
            await tx.wallet.update({ where: { id: senderWallet.id }, data: { balance: { decrement: 1 } } });
          } else {
            await tx.wallet.update({ where: { id: receiverWallet.id }, data: { balance: { increment: 1 } } });
          }
        }
        console.log(`  [T${i}] Locks released at ${Date.now() - startConcurrent}ms`);
      })
    );
  }
  await Promise.all(promises);
  console.log(`Overlapping finished at ${Date.now() - startConcurrent}ms`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
