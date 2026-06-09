const prisma = require('./src/config/db');

async function run() {
  const [
    users,
    wallets,
    beneficiaries,
    transactions,
    ledgerBatches,
    ledgerEntries,
    credits,
    debits
  ] = await Promise.all([
    prisma.user.count(),
    prisma.wallet.findMany({ select: { id: true, balance: true, user: { select: { name: true } } } }),
    prisma.beneficiary.count(),
    prisma.transaction.count(),
    prisma.ledgerBatch.count(),
    prisma.ledgerEntry.count(),
    prisma.ledgerEntry.aggregate({ _sum: { amount: true }, where: { entry_type: 'CREDIT' } }),
    prisma.ledgerEntry.aggregate({ _sum: { amount: true }, where: { entry_type: 'DEBIT' } })
  ]);

  const totalCredits = Number(credits._sum.amount || 0);
  const totalDebits = Number(debits._sum.amount || 0);

  console.log(JSON.stringify({
    users,
    wallets,
    beneficiaries,
    transactions,
    ledgerBatches,
    ledgerEntries,
    totalCredits,
    totalDebits
  }, null, 2));
}

run().catch(console.error).finally(() => process.exit(0));
