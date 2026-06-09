const beneficiaryService = require('../services/beneficiaryService');
const { successResponse } = require('../utils/response');

exports.addBeneficiary = async (req, res, next) => {
  try {
    const { targetEmail, nickname } = req.body;
    const beneficiary = await beneficiaryService.addBeneficiary(req.user.userId, targetEmail, nickname);
    return successResponse(res, { beneficiary }, 201);
  } catch (err) {
    next(err);
  }
};

exports.getBeneficiaries = async (req, res, next) => {
  try {
    const beneficiaries = await beneficiaryService.getBeneficiaries(req.user.userId);
    return successResponse(res, { beneficiaries });
  } catch (err) {
    next(err);
  }
};

exports.removeBeneficiary = async (req, res, next) => {
  try {
    const { id } = req.params;
    await beneficiaryService.removeBeneficiary(req.user.userId, id);
    return successResponse(res, { message: 'Beneficiary removed' });
  } catch (err) {
    next(err);
  }
};
