const prisma = require('../config/db');
const { successResponse } = require('../utils/response');

exports.getWallet = async (req, res, next) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { user_id: req.user.userId }
    });
    
    if (!wallet) {
      const err = new Error('Wallet not found');
      err.statusCode = 404;
      throw err;
    }

    return successResponse(res, { wallet });
  } catch (err) {
    next(err);
  }
};

exports.getBalance = async (req, res, next) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { user_id: req.user.userId },
      select: { balance: true, status: true }
    });
    
    if (!wallet) {
      const err = new Error('Wallet not found');
      err.statusCode = 404;
      throw err;
    }

    return successResponse(res, { balance: wallet.balance, status: wallet.status });
  } catch (err) {
    next(err);
  }
};
