const devService = require('../services/devService');
const { successResponse } = require('../utils/response');

exports.fundWallet = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      const err = new Error('Endpoint disabled in production');
      err.statusCode = 403;
      throw err;
    }

    const { amount } = req.body;
    const result = await devService.fundWallet(req.user.userId, amount);
    
    return successResponse(res, { 
      success: true,
      newBalance: result.newBalance,
      batchReference: result.batchReference
    });
  } catch (err) {
    next(err);
  }
};
