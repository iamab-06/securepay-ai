const prisma = require('../config/db');
const ledgerService = require('./ledgerService');

/**
 * Compares Wallet table snapshot balances against Ledger-derived balances.
 * Returns structured health status.
 */
exports.runFullReconciliation = async () => {
  const wallets = await prisma.wallet.findMany({
    include: { ledger_account: true }
  });

  const report = {
    status: 'HEALTHY',
    totalAccounts: wallets.length,
    discrepancies: []
  };

  for (const wallet of wallets) {
    if (!wallet.ledger_account) {
      report.discrepancies.push({
        walletId: wallet.id,
        issue: 'No associated ledger account found'
      });
      continue;
    }

    const derivedBalance = await ledgerService.rebuildBalance(wallet.ledger_account.id);
    const snapshotBalance = Number(wallet.balance);

    if (Math.abs(derivedBalance - snapshotBalance) > 0.001) {
      report.discrepancies.push({
        walletId: wallet.id,
        snapshotBalance,
        derivedBalance,
        difference: derivedBalance - snapshotBalance
      });
    }
  }

  if (report.discrepancies.length > 0) {
    report.status = 'CRITICAL';
  }

  return report;
};
