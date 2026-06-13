const analyticsService = require('../services/analyticsService');
const { successResponse } = require('../utils/response');

exports.getUserInsights = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const insights = await analyticsService.generateUserInsights(userId);
    return successResponse(res, insights);
  } catch (err) {
    next(err);
  }
};
