const transactionService = require('../services/transactionService');
const beneficiaryService = require('../services/beneficiaryService');
const { successResponse } = require('../utils/response');

exports.transfer = async (req, res, next) => {
  try {
    const { beneficiaryId, amount, description } = req.body;
    
    // Phase 2 constraint: we receive beneficiaryId from frontend.
    // Need to resolve this to a receiverWalletId.
    const beneficiaries = await beneficiaryService.getBeneficiaries(req.user.userId);
    const beneficiary = beneficiaries.find(b => b.id === beneficiaryId);
    
    if (!beneficiary) {
      const err = new Error('Beneficiary not found in your account');
      err.statusCode = 404;
      throw err;
    }

    const prisma = require('../config/db');
    const receiverWallet = await prisma.wallet.findUnique({
      where: { user_id: beneficiary.beneficiary_user_id }
    });

    if (!receiverWallet) {
      const err = new Error('Target user does not have a valid wallet');
      err.statusCode = 400;
      throw err;
    }

    const result = await transactionService.executeTransfer(
      req.user.userId, 
      receiverWallet.id, 
      amount, 
      description
    );
    
    return successResponse(res, result, 201);
  } catch (err) {
    next(err);
  }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const transactions = await transactionService.getTransactionHistory(req.user.userId, limit, offset);
    return successResponse(res, { transactions });
  } catch (err) {
    next(err);
  }
};
