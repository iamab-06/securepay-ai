const prisma = require('../config/db');

exports.generateUserInsights = async (userId) => {
  // 1. Fetch User Base Data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallet: true,
      kyc_submission: true,
      fraud_alerts: true,
      user_activities: {
        orderBy: { created_at: 'desc' },
        take: 1
      }
    }
  });

  if (!user) throw new Error('User not found');

  // 2. Compute Dates for MoM
  const now = new Date();
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // 3. Spending Intelligence
  const currentMonthTx = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      sender_wallet_id: user.wallet?.id || null,
      created_at: { gte: firstOfThisMonth }
    }
  });

  const lastMonthTx = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      sender_wallet_id: user.wallet?.id || null,
      created_at: { gte: firstOfLastMonth, lt: firstOfThisMonth }
    }
  });

  const currentVol = Number(currentMonthTx._sum.amount || 0);
  const lastVol = Number(lastMonthTx._sum.amount || 0);

  let trendDirection = 'STABLE';
  let trendPercentage = 0;

  if (lastVol === 0 && currentVol > 0) {
    trendDirection = 'UP';
    trendPercentage = 100;
  } else if (lastVol > 0) {
    trendPercentage = Math.round(((currentVol - lastVol) / lastVol) * 100);
    if (trendPercentage > 5) trendDirection = 'UP';
    else if (trendPercentage < -5) trendDirection = 'DOWN';
    else trendDirection = 'STABLE';
  }

  // 4. Decoupled Risk Intelligence
  let riskScore = 0;
  let riskTrend = 'STABLE';

  if (user.wallet) {
    const recentAssessments = await prisma.riskAssessment.findMany({
      where: { transaction: { sender_wallet_id: user.wallet.id } },
      orderBy: { evaluated_at: 'desc' },
      take: 2
    });

    if (recentAssessments.length > 0) {
      riskScore = recentAssessments[0].risk_score;
      if (recentAssessments.length > 1) {
        if (riskScore > recentAssessments[1].risk_score) riskTrend = 'INCREASING';
        if (riskScore < recentAssessments[1].risk_score) riskTrend = 'DECREASING';
      }
    }
  }

  // 5. Fraud Intelligence
  const activeAlerts = user.fraud_alerts.filter(a => a.status === 'OPEN' || a.status === 'INVESTIGATING').length;
  const historicalAlerts = user.fraud_alerts.length;
  const resolvedAlerts = user.fraud_alerts.filter(a => a.status === 'RESOLVED').length;

  // 6. Account Health Score
  let healthScore = 50; // Neutral starting base
  
  // Positive Indicators
  if (user.kyc_submission?.status === 'VERIFIED') healthScore += 30;
  if (user.wallet && user.wallet.status === 'ACTIVE') healthScore += 20;
  if (user.status === 'ACTIVE') healthScore += 10;
  if (historicalAlerts === 0 && currentVol > 0) healthScore += 10; // Clean record bonus

  // Negative Indicators
  if (user.kyc_submission?.status === 'REJECTED') healthScore -= 40;
  if (activeAlerts > 0) healthScore -= (activeAlerts * 20);
  if (user.status === 'FROZEN') healthScore -= 100;
  if (user.wallet?.status === 'FROZEN') healthScore -= 100;
  if (user.risk_tier === 'CRITICAL') healthScore -= 50;

  // Clamp 0-100
  healthScore = Math.max(0, Math.min(100, healthScore));

  // 7. Deterministic AI Observations (Empty State vs Active State)
  const observations = [];
  
  if (currentVol === 0 && lastVol === 0 && historicalAlerts === 0) {
    // Empty State / New User Onboarding
    observations.push('Welcome to SecurePay! Make your first transfer to begin generating insights.');
    if (!user.kyc_submission || user.kyc_submission.status === 'PENDING') {
      observations.push('Complete KYC verification to unlock higher transaction limits.');
    }
    const beneficiariesCount = await prisma.beneficiary.count({ where: { owner_user_id: user.id } });
    if (beneficiariesCount === 0) {
      observations.push('Add your first beneficiary to enable fast transfers.');
    }
  } else {
    // Active User
    if (trendDirection === 'UP') {
      observations.push(`Your spending volume is trending UP by ${Math.abs(trendPercentage)}% compared to last month.`);
    } else if (trendDirection === 'DOWN') {
      observations.push(`Your spending volume is trending DOWN by ${Math.abs(trendPercentage)}% compared to last month.`);
    }

    if (healthScore >= 90) {
      observations.push('Account health is optimal. No negative risk indicators detected.');
    } else if (healthScore < 50) {
      observations.push('Account health is critically low. Please resolve any active flags or contact support.');
    }

    if (activeAlerts > 0) {
      observations.push(`Attention: You have ${activeAlerts} active anomaly flag(s) under review by our compliance engine.`);
    }

    if (riskScore > 50) {
      observations.push('High transaction risk detected. Subsequent large transfers may be delayed for verification.');
    }
  }

  return {
    spending: {
      currentMonthVolume: currentVol,
      previousMonthVolume: lastVol,
      trend: {
        direction: trendDirection,
        percentage: Math.abs(trendPercentage)
      }
    },
    risk: {
      tier: user.risk_tier,
      latestScore: riskScore,
      trend: riskTrend
    },
    fraud: {
      activeAlerts,
      historicalAlerts,
      resolvedAlerts
    },
    health: {
      score: healthScore,
      kycStatus: user.kyc_submission?.status || 'NOT_SUBMITTED',
      accountStatus: user.status,
      walletStatus: user.wallet?.status || 'NOT_CREATED'
    },
    observations
  };
};
