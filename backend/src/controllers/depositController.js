const depositService = require('../services/depositService');
const { successResponse } = require('../utils/response');

exports.createDeposit = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const intent = await depositService.initiateDeposit(req.user.userId, amount);
    return successResponse(res, intent, 201);
  } catch (err) {
    next(err);
  }
};

exports.getDepositHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const history = await depositService.getDepositHistory(req.user.userId, limit, offset);
    return successResponse(res, { deposits: history });
  } catch (err) {
    next(err);
  }
};

exports.getDepositByReference = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const intent = await depositService.getDepositByReference(req.user.userId, reference);
    return successResponse(res, { intent });
  } catch (err) {
    next(err);
  }
};
