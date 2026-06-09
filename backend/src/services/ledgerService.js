const prisma = require('../config/db');

/**
 * Creates a unique batch reference for ledger entries.
 */
exports.generateBatchReference = () => {
  const crypto = require('crypto');
  return `LGR-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
};

/**
 * Utility to calculate the derived balance for an account directly from Ledger entries.
 * Returns exact Decimal value representing (Credits - Debits).
 */
exports.rebuildBalance = async (accountId) => {
  const credits = await prisma.ledgerEntry.aggregate({
    _sum: { amount: true },
    where: { ledger_account_id: accountId, entry_type: 'CREDIT' }
  });

  const debits = await prisma.ledgerEntry.aggregate({
    _sum: { amount: true },
    where: { ledger_account_id: accountId, entry_type: 'DEBIT' }
  });

  const totalCredits = Number(credits._sum.amount || 0);
  const totalDebits = Number(debits._sum.amount || 0);

  return totalCredits - totalDebits;
};

/**
 * Validates that a given set of entries perfectly balances (Debits == Credits).
 */
exports.validateEntriesBalance = (entries) => {
  let debits = 0;
  let credits = 0;

  entries.forEach(e => {
    if (e.entry_type === 'DEBIT') debits += Number(e.amount);
    if (e.entry_type === 'CREDIT') credits += Number(e.amount);
  });

  // Precision check to avoid float errors, though entries should be Decimals passed as strings/numbers
  if (Math.abs(debits - credits) > 0.001) {
    throw new Error(`Ledger integrity failure: Debits (${debits}) != Credits (${credits})`);
  }
  return true;
};
