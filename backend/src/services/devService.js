const prisma = require('../config/db');
const ledgerService = require('./ledgerService');
const crypto = require('crypto');

exports.fundWallet = async (userId, amount) => {
  const fundAmount = Number(amount);
  
  if (isNaN(fundAmount) || fundAmount <= 0) {
    const err = new Error('Amount must be greater than 0');
    err.statusCode = 400;
    throw err;
  }

  // Find User Wallet
  const wallet = await prisma.wallet.findUnique({
    where: { user_id: userId },
    include: { ledger_account: true }
  });

  if (!wallet || !wallet.ledger_account) {
    const err = new Error('User wallet or ledger account not found');
    err.statusCode = 400;
    throw err;
  }

  // Find System Reserve Account
  const reserveAccount = await prisma.ledgerAccount.findUnique({
    where: { account_code: 'SYS-RESERVE' }
  });

  if (!reserveAccount) {
    const err = new Error('System Reserve account not found');
    err.statusCode = 500;
    throw err;
  }

  const batchReference = ledgerService.generateBatchReference();
  const txnReference = `TXN-DEV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  // Execute Funding Transaction
  const result = await prisma.$transaction(async (tx) => {
    
    const batch = await tx.ledgerBatch.create({
      data: {
        batch_reference: batchReference,
        status: 'PENDING'
      }
    });

    // Create a transaction record just for auditing purposes
    const transaction = await tx.transaction.create({
      data: {
        transaction_reference: txnReference,
        sender_wallet_id: null, // No sender wallet, it's system funding
        receiver_wallet_id: wallet.id,
        amount: fundAmount,
        status: 'SUCCESS',
        description: 'Development Funding'
      }
    });

    const entries = [
      {
        transaction_id: transaction.id,
        ledger_batch_id: batch.id,
        ledger_account_id: reserveAccount.id,
        entry_type: 'DEBIT',
        amount: fundAmount,
        description: `Dev Funding - Reserve Outflow`
      },
      {
        transaction_id: transaction.id,
        ledger_batch_id: batch.id,
        ledger_account_id: wallet.ledger_account.id,
        entry_type: 'CREDIT',
        amount: fundAmount,
        description: `Dev Funding - Wallet Inflow`
      }
    ];

    ledgerService.validateEntriesBalance(entries);

    await tx.ledgerEntry.createMany({ data: entries });

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: fundAmount } }
    });

    await tx.ledgerBatch.update({
      where: { id: batch.id },
      data: { 
        status: 'POSTED',
        posted_at: new Date()
      }
    });

    return { 
      newBalance: updatedWallet.balance,
      batchReference: batchReference
    };
  });

  return result;
};
