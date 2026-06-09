const crypto = require('crypto');
const prisma = require('../config/db');
const { limits } = require('../config/transfer');
const ledgerService = require('./ledgerService');
const fraudDetectionService = require('./fraudDetectionService');

const generateTxnReference = () => {
  // Cryptographically unique reference preventing sequential guessing
  return `TXN-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
};

exports.executeTransfer = async (senderUserId, receiverWalletId, amount, description) => {
  // 1. VALIDATE & AUTHORIZE
  const transferAmount = Number(amount);
  
  if (isNaN(transferAmount) || transferAmount < limits.MIN_TRANSFER_AMOUNT || transferAmount > limits.MAX_TRANSFER_AMOUNT) {
    const err = new Error(`Amount must be between ₹${limits.MIN_TRANSFER_AMOUNT} and ₹${limits.MAX_TRANSFER_AMOUNT}`);
    err.statusCode = 400;
    throw err;
  }

  // Load Sender Wallet & Ledger
  const senderWallet = await prisma.wallet.findUnique({
    where: { user_id: senderUserId },
    include: { ledger_account: true }
  });

  if (!senderWallet || senderWallet.status !== 'ACTIVE' || !senderWallet.ledger_account) {
    const err = new Error('Sender wallet or ledger account is invalid/inactive');
    err.statusCode = 400;
    throw err;
  }

  // Load Receiver Wallet & Ledger
  const receiverWallet = await prisma.wallet.findUnique({
    where: { id: receiverWalletId },
    include: { ledger_account: true }
  });

  if (!receiverWallet || receiverWallet.status !== 'ACTIVE' || !receiverWallet.ledger_account) {
    const err = new Error('Receiver wallet or ledger account is invalid/inactive');
    err.statusCode = 400;
    throw err;
  }

  if (senderWallet.id === receiverWallet.id) {
    const err = new Error('Cannot transfer to your own wallet');
    err.statusCode = 400;
    throw err;
  }

  // Fast-fail balance check before opening the transaction
  if (Number(senderWallet.balance) < transferAmount) {
    const err = new Error('Insufficient funds');
    err.statusCode = 400;
    throw err;
  }

  const txnReference = generateTxnReference();

  // 1.5. EVALUATE RISK (Before ANY ledger side effects)
  const riskResult = await fraudDetectionService.evaluateTransferRisk(senderWallet.id, receiverWallet.id, transferAmount);

  if (riskResult.isBlocked) {
    // Persist BLOCKED Transaction & Risk Assessment Only
    await prisma.transaction.create({
      data: {
        transaction_reference: txnReference,
        sender_wallet_id: senderWallet.id,
        receiver_wallet_id: receiverWallet.id,
        amount: transferAmount,
        status: 'BLOCKED',
        description: description || 'Money Transfer',
        risk_assessment: {
          create: {
            risk_score: riskResult.score,
            flagged_rules: riskResult.flaggedRules.map(r => r.code)
          }
        }
      }
    });

    const err = new Error('Transfer blocked by security policies');
    err.statusCode = 403;
    throw err;
  }

  // ALLOWED FLOW
  const batchReference = ledgerService.generateBatchReference();

  // 2. EXECUTE & RECORD (Atomic Prisma Transaction)
  try {
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Create Posted Ledger Batch (Removing redundant PENDING -> POSTED update)
      const batch = await tx.ledgerBatch.create({
        data: {
          batch_reference: batchReference,
          status: 'POSTED',
          posted_at: new Date()
        }
      });

      // B. Create High-Level Transaction Record
      const transaction = await tx.transaction.create({
        data: {
          transaction_reference: txnReference,
          sender_wallet_id: senderWallet.id,
          receiver_wallet_id: receiverWallet.id,
          amount: transferAmount,
          status: 'SUCCESS', // Allowed through risk validation
          description: description || 'Money Transfer',
          risk_assessment: {
            create: {
              risk_score: riskResult.score,
              flagged_rules: riskResult.flaggedRules.map(r => r.code)
            }
          }
        }
      });

      // C. Create Immutable Ledger Entries (Double Entry Rule)
      const entries = [
        {
          transaction_id: transaction.id,
          ledger_batch_id: batch.id,
          ledger_account_id: senderWallet.ledger_account.id,
          entry_type: 'DEBIT',
          amount: transferAmount,
          description: `Transfer out to ${receiverWallet.ledger_account.account_code}`
        },
        {
          transaction_id: transaction.id,
          ledger_batch_id: batch.id,
          ledger_account_id: receiverWallet.ledger_account.id,
          entry_type: 'CREDIT',
          amount: transferAmount,
          description: `Transfer in from ${senderWallet.ledger_account.account_code}`
        }
      ];

      // D. Enforce Balancing Integrity
      ledgerService.validateEntriesBalance(entries);
      await tx.ledgerEntry.createMany({ data: entries });

      // E. Update Derived Wallet Snapshots (ACQUIRES ROW LOCKS)
      // Moving these to the absolute END of the transaction ensures the exclusive row 
      // lock is held for the shortest possible duration, preventing concurrent timeout errors.
      
      // Consistent lock acquisition order (Lexicographical by ID) prevents deadlocks
      // if User A sends to User B, while User B sends to User A concurrently.
      const sortedWalletIds = [senderWallet.id, receiverWallet.id].sort();
      
      let updatedSender;
      for (const id of sortedWalletIds) {
        if (id === senderWallet.id) {
          updatedSender = await tx.wallet.update({
            where: { id: senderWallet.id },
            data: { balance: { decrement: transferAmount } }
          });
        } else {
          await tx.wallet.update({
            where: { id: receiverWallet.id },
            data: { balance: { increment: transferAmount } }
          });
        }
      }

      if (Number(updatedSender.balance) < 0) {
        throw new Error('Insufficient funds'); // Rolling back entire batch & transaction
      }

      return { transaction, newBalance: updatedSender.balance };
    });

    return result;
  } catch (error) {
    // If the transaction fails, we could theoretically log a FAILED transaction here
    // For Phase 2, we let the exception bubble up to the controller to inform the user
    if (error.message === 'Insufficient funds') {
       const err = new Error(error.message);
       err.statusCode = 400;
       throw err;
    }
    throw error;
  }
};

exports.getTransactionHistory = async (userId, limit = 20, offset = 0) => {
  const wallet = await prisma.wallet.findUnique({
    where: { user_id: userId }
  });

  if (!wallet) return [];

  // API supports future filtering easily due to isolated service method
  return prisma.transaction.findMany({
    where: {
      OR: [
        { sender_wallet_id: wallet.id },
        { receiver_wallet_id: wallet.id }
      ]
    },
    include: {
      sender: {
        include: { user: { select: { id: true, name: true, email: true } } }
      },
      receiver: {
        include: { user: { select: { id: true, name: true, email: true } } }
      },
      risk_assessment: true
    },
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: offset
  });
};
