const crypto = require('crypto');
const prisma = require('../config/db');
const ledgerService = require('./ledgerService');

const generateDepositReference = () => {
  return `DEP-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
};

exports.initiateDeposit = async (userId, amount) => {
  const depositAmount = Number(amount);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    const err = new Error('Invalid deposit amount');
    err.statusCode = 400;
    throw err;
  }

  const wallet = await prisma.wallet.findUnique({
    where: { user_id: userId }
  });

  if (!wallet || wallet.status !== 'ACTIVE') {
    const err = new Error('Wallet is invalid/inactive');
    err.statusCode = 400;
    throw err;
  }

  const reference = generateDepositReference();

  const intent = await prisma.depositIntent.create({
    data: {
      reference,
      wallet_id: wallet.id,
      amount: depositAmount,
      currency: 'INR',
      status: 'PENDING'
    }
  });

  return intent;
};

exports.getDepositHistory = async (userId, limit = 20, offset = 0) => {
  const wallet = await prisma.wallet.findUnique({
    where: { user_id: userId }
  });

  if (!wallet) return [];

  return prisma.depositIntent.findMany({
    where: { wallet_id: wallet.id },
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: offset
  });
};

exports.getDepositByReference = async (userId, reference) => {
  const wallet = await prisma.wallet.findUnique({
    where: { user_id: userId }
  });

  if (!wallet) {
    const err = new Error('Wallet not found');
    err.statusCode = 404;
    throw err;
  }

  const intent = await prisma.depositIntent.findUnique({
    where: { reference }
  });

  if (!intent || intent.wallet_id !== wallet.id) {
    const err = new Error('Deposit intent not found');
    err.statusCode = 404;
    throw err;
  }

  return intent;
};

exports.processDepositSettlement = async (securepayReference, providerReference) => {
  // ZERO-TRUST: Load entirely from DB based on reference
  const intent = await prisma.depositIntent.findUnique({
    where: { reference: securepayReference },
    include: { wallet: { include: { ledger_account: true } } }
  });

  if (!intent) {
    const err = new Error('Deposit intent not found');
    err.statusCode = 404;
    throw err;
  }

  if (intent.status === 'COMPLETED') {
    // Idempotency constraint: Already settled
    return { status: 'ALREADY_SETTLED', intent };
  }
  if (intent.status !== 'PENDING' && intent.status !== 'PROCESSING') {
    const err = new Error(`Cannot settle deposit in status: ${intent.status}`);
    err.statusCode = 400;
    throw err;
  }

  const sysClearingAccount = await prisma.ledgerAccount.findUnique({
    where: { account_code: 'SYS-CLEARING' }
  });

  if (!sysClearingAccount) {
    throw new Error('Critical Error: SYS-CLEARING account not found');
  }

  const transferAmount = Number(intent.amount);
  const txnReference = `TXN-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  const batchReference = ledgerService.generateBatchReference();

  // ATOMIC SETTLEMENT TRANSACTION
  const result = await prisma.$transaction(async (tx) => {
    // 1. ATOMIC COMPARE-AND-SWAP (Idempotency Lock)
    const updatedCount = await tx.depositIntent.updateMany({
      where: {
        id: intent.id,
        status: { in: ['PENDING', 'PROCESSING'] }
      },
      data: {
        status: 'COMPLETED',
        provider_reference: providerReference,
        settled_at: new Date()
      }
    });

    if (updatedCount.count === 0) {
      // Race condition caught: Another process just completed it
      throw new Error('Concurrent modification detected or already settled');
    }

    // 2. CREATE LEDGER BATCH
    const batch = await tx.ledgerBatch.create({
      data: {
        batch_reference: batchReference,
        status: 'POSTED',
        posted_at: new Date()
      }
    });

    // 3. CREATE TRANSACTION RECORD
    const transaction = await tx.transaction.create({
      data: {
        transaction_reference: txnReference,
        sender_wallet_id: null, // External deposit has no sender wallet
        receiver_wallet_id: intent.wallet.id,
        amount: transferAmount,
        status: 'SUCCESS',
        description: `External Deposit via ${providerReference || 'Gateway'}`,
      }
    });

    // 4. DOUBLE ENTRY RECORDS
    const entries = [
      {
        transaction_id: transaction.id,
        ledger_batch_id: batch.id,
        ledger_account_id: sysClearingAccount.id, // DEBIT SYS-CLEARING
        entry_type: 'DEBIT',
        amount: transferAmount,
        description: `Deposit Funding (Ref: ${securepayReference})`
      },
      {
        transaction_id: transaction.id,
        ledger_batch_id: batch.id,
        ledger_account_id: intent.wallet.ledger_account.id, // CREDIT USER WALLET
        entry_type: 'CREDIT',
        amount: transferAmount,
        description: `Deposit Credit (Ref: ${securepayReference})`
      }
    ];

    ledgerService.validateEntriesBalance(entries);
    await tx.ledgerEntry.createMany({ data: entries });

    // 5. UPDATE WALLET BALANCE
    // We strictly update the USER wallet ONLY. SYS-CLEARING has no wallet.
    await tx.wallet.update({
      where: { id: intent.wallet.id },
      data: { balance: { increment: transferAmount } }
    });

    return { transaction, intent: { ...intent, status: 'COMPLETED' } };
  });

  return result;
};
