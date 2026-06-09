const prisma = require('../config/db');
const { successResponse } = require('../utils/response');

exports.getSystemStatus = async (req, res, next) => {
  try {
    const [
      users,
      wallets,
      beneficiaries,
      transactions,
      fraudAttempts,
      ledgerEntries,
      ledgerBatches,
      creditSumObj,
      debitSumObj
    ] = await Promise.all([
      prisma.user.count(),
      prisma.wallet.count(),
      prisma.beneficiary.count(),
      prisma.transaction.count({ where: { status: 'SUCCESS' } }),
      prisma.transaction.count({ where: { status: 'BLOCKED' } }),
      prisma.ledgerEntry.count(),
      prisma.ledgerBatch.count(),
      prisma.ledgerEntry.aggregate({ _sum: { amount: true }, where: { entry_type: 'CREDIT' } }),
      prisma.ledgerEntry.aggregate({ _sum: { amount: true }, where: { entry_type: 'DEBIT' } })
    ]);

    const totalCredits = Number(creditSumObj._sum.amount || 0);
    const totalDebits = Number(debitSumObj._sum.amount || 0);

    const integrityStatus = Math.abs(totalCredits - totalDebits) < 0.001 ? 'HEALTHY' : 'DEGRADED';
    const reconciliationStatus = integrityStatus === 'HEALTHY' ? 'HEALTHY' : 'PENDING_REVIEW';

    return successResponse(res, {
      users,
      wallets,
      beneficiaries,
      transactions,
      fraudAttempts,
      ledgerEntries,
      ledgerBatches,
      reconciliationStatus,
      integrityStatus
    });
  } catch (err) {
    next(err);
  }
};

exports.getLedgerHealth = async (req, res, next) => {
  try {
    const totalEntries = await prisma.ledgerEntry.count();
    const batches = await prisma.ledgerBatch.count();
    
    // Quick integrity check: Sum of all Debits must equal Sum of all Credits system-wide.
    const credits = await prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { entry_type: 'CREDIT' }
    });
    const debits = await prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { entry_type: 'DEBIT' }
    });

    const totalCredits = Number(credits._sum.amount || 0);
    const totalDebits = Number(debits._sum.amount || 0);

    const isBalanced = Math.abs(totalCredits - totalDebits) < 0.001;

    return successResponse(res, {
      totalEntries,
      totalBatches: batches,
      systemBalanced: isBalanced,
      totalCredits,
      totalDebits
    });
  } catch (err) {
    next(err);
  }
};

exports.getFraudAnalytics = async (req, res, next) => {
  try {
    const [totalAssessments, totalBlocked, recentBlocked, assessments] = await Promise.all([
      prisma.riskAssessment.count(),
      prisma.transaction.count({ where: { status: 'BLOCKED' } }),
      prisma.transaction.findMany({
        where: { status: 'BLOCKED' },
        orderBy: { created_at: 'desc' },
        take: 10,
        include: {
          risk_assessment: true,
          sender: { include: { user: { select: { id: true, name: true, email: true } } } },
          receiver: { include: { user: { select: { id: true, name: true, email: true } } } }
        }
      }),
      prisma.riskAssessment.findMany({ select: { flagged_rules: true } })
    ]);

    const ruleDistribution = {};
    assessments.forEach(a => {
      a.flagged_rules.forEach(rule => {
        ruleDistribution[rule] = (ruleDistribution[rule] || 0) + 1;
      });
    });

    // Aggregate High Risk Users
    const highRiskUsersRaw = await prisma.riskAssessment.findMany({
      where: { risk_score: { gt: 0 } },
      include: {
        transaction: {
          include: {
            sender: { include: { user: { select: { id: true, name: true, email: true } } } }
          }
        }
      }
    });

    const userRiskMap = {};
    highRiskUsersRaw.forEach(a => {
      const user = a.transaction?.sender?.user;
      if (user) {
        if (!userRiskMap[user.id]) {
          userRiskMap[user.id] = { user, totalScore: 0, count: 0, blocks: 0 };
        }
        userRiskMap[user.id].totalScore += a.risk_score;
        userRiskMap[user.id].count += 1;
        if (a.transaction.status === 'BLOCKED') userRiskMap[user.id].blocks += 1;
      }
    });

    const highRiskUsers = Object.values(userRiskMap)
      .map(u => ({
        user: u.user,
        avgScore: Math.round(u.totalScore / u.count),
        totalAssessments: u.count,
        blockedTransfers: u.blocks
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);

    return successResponse(res, {
      summary: { totalAssessments, totalBlocked },
      ruleDistribution,
      blockedTransactions: recentBlocked,
      highRiskUsers
    });
  } catch (err) {
    next(err);
  }
};
