const prisma = require('../config/db');
const { successResponse } = require('../utils/response');

exports.getUserRiskProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const wallet = await prisma.wallet.findUnique({ where: { user_id: userId } });
    
    if (!wallet) return successResponse(res, { score: 0, insights: [] });

    // Fetch the 10 most recent transactions with risk assessments for this user
    const recentAssessments = await prisma.riskAssessment.findMany({
      where: {
        transaction: {
          sender_wallet_id: wallet.id
        }
      },
      orderBy: { evaluated_at: 'desc' },
      take: 10,
      include: {
        transaction: {
          select: {
            transaction_reference: true,
            amount: true,
            status: true,
            created_at: true
          }
        }
      }
    });

    if (recentAssessments.length === 0) {
      return successResponse(res, { 
        score: 0, 
        insights: ["Not enough transaction history available yet to generate AI spending forecasts and behavior anomaly models."] 
      });
    }

    // Calculate average score
    const avgScore = Math.round(recentAssessments.reduce((sum, a) => sum + a.risk_score, 0) / recentAssessments.length);
    
    // Generate explainable insights
    const insights = [];
    const allFlags = recentAssessments.flatMap(a => a.flagged_rules);
    
    if (allFlags.includes("LARGE_TRANSFER_RISK")) {
      insights.push("Unusually large transfer volume detected recently.");
    }
    if (allFlags.includes("VELOCITY_RISK")) {
      insights.push("High frequency of transfers detected in a short time window.");
    }
    if (allFlags.includes("NEW_BENEFICIARY_RISK")) {
      insights.push("Transfers to newly added beneficiaries may increase your risk profile temporarily.");
    }

    if (insights.length === 0) {
      insights.push("Your spending patterns appear normal and secure.");
    }

    return successResponse(res, {
      score: avgScore,
      history: recentAssessments,
      insights
    });
  } catch (err) {
    next(err);
  }
};
