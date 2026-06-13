const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const auditService = require('../services/auditService');
const activityService = require('../services/activityService');
const notificationService = require('../services/notificationService');

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
      debitSumObj,
      pendingKyc,
      approvedKyc,
      rejectedKyc,
      frozenUsers,
      frozenWallets,
      highRiskUsersCount,
      criticalRiskUsersCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.wallet.count(),
      prisma.beneficiary.count(),
      prisma.transaction.count({ where: { status: 'SUCCESS' } }),
      prisma.transaction.count({ where: { status: 'BLOCKED' } }),
      prisma.ledgerEntry.count(),
      prisma.ledgerBatch.count(),
      prisma.ledgerEntry.aggregate({ _sum: { amount: true }, where: { entry_type: 'CREDIT' } }),
      prisma.ledgerEntry.aggregate({ _sum: { amount: true }, where: { entry_type: 'DEBIT' } }),
      prisma.kycSubmission.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.kycSubmission.count({ where: { status: 'VERIFIED' } }),
      prisma.kycSubmission.count({ where: { status: 'REJECTED' } }),
      prisma.user.count({ where: { status: 'FROZEN' } }),
      prisma.wallet.count({ where: { status: 'FROZEN' } }),
      prisma.user.count({ where: { risk_tier: 'HIGH' } }),
      prisma.user.count({ where: { risk_tier: 'CRITICAL' } })
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
      integrityStatus,
      kyc: {
        pending: pendingKyc,
        approved: approvedKyc,
        rejected: rejectedKyc
      },
      frozen: {
        users: frozenUsers,
        wallets: frozenWallets
      },
      risk: {
        high: highRiskUsersCount,
        critical: criticalRiskUsersCount
      }
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

/**
 * GET /api/admin/users
 * Fetch paginated, searchable, filterable list of users.
 */
exports.getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { search, status, riskTier } = req.query;

    const where = {};
    if (search) {
      // Use exact match or startsWith to utilize B-Tree indices and prevent full-table sequential scans
      where.email = { startsWith: search };
    }
    if (status) {
      where.status = status;
    }
    if (riskTier) {
      where.risk_tier = riskTier;
    }

    const [total, usersRaw] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          risk_tier: true,
          created_at: true,
          wallet: {
            select: { id: true, status: true }
          },
          kyc_submission: {
            select: { status: true }
          }
        }
      })
    ]);

    // Format output
    const users = usersRaw.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      risk_tier: u.risk_tier,
      created_at: u.created_at,
      wallet_id: u.wallet?.id || null,
      wallet_status: u.wallet?.status || null,
      kyc_status: u.kyc_submission?.status || null
    }));

    return successResponse(res, {
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/users/:id/status
 * Update a user's status.
 */
exports.updateUserStatus = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;
    const adminId = req.user.userId || req.user.id;

    if (!['ACTIVE', 'SUSPENDED', 'COMPLIANCE_REVIEW', 'FROZEN'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.status === status) {
      return res.status(400).json({ success: false, message: `User is already ${status}` });
    }

    const previousStatus = user.status;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status }
    });

    // Fire telemetry asynchronously
    Promise.all([
      auditService.logAdminAction({
        adminId,
        action: 'UPDATE_USER_STATUS',
        targetId: userId,
        details: { 
          previousStatus, 
          newStatus: status, 
          targetType: 'USER', 
          timestamp: new Date().toISOString() 
        }
      }),
      activityService.logActivity({
        userId,
        type: 'ADMIN_ACTION',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        metadata: { action: 'STATUS_CHANGE', previousStatus, newStatus: status }
      }),
      notificationService.createNotification({
        userId,
        type: status === 'FROZEN' ? 'WALLET_FROZEN' : (status === 'ACTIVE' ? 'WALLET_UNFROZEN' : 'LIMIT_WARNING'),
        title: 'Account Status Updated',
        message: `Your account status has been changed to ${status}. Please contact support if you have questions.`
      })
    ]).catch(err => console.error('[Telemetry Error]', err));

    return successResponse(res, { user: updatedUser });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/wallets/:id/status
 * Update a wallet's status.
 */
exports.updateWalletStatus = async (req, res, next) => {
  try {
    const walletId = req.params.id;
    const { status } = req.body;
    const adminId = req.user.userId || req.user.id;

    if (!['ACTIVE', 'FROZEN'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    if (wallet.status === status) {
      return res.status(400).json({ success: false, message: `Wallet is already ${status}` });
    }

    const previousStatus = wallet.status;

    const updatedWallet = await prisma.wallet.update({
      where: { id: walletId },
      data: { status }
    });

    // Fire telemetry asynchronously
    Promise.all([
      auditService.logAdminAction({
        adminId,
        action: 'UPDATE_WALLET_STATUS',
        targetId: walletId,
        details: { 
          previousStatus, 
          newStatus: status, 
          targetType: 'WALLET', 
          timestamp: new Date().toISOString() 
        }
      }),
      activityService.logActivity({
        userId: wallet.user_id,
        type: status === 'FROZEN' ? 'WALLET_FROZEN' : 'WALLET_UNFROZEN',
        ipAddress: req.ip,
        device: req.headers['user-agent'],
        metadata: { action: 'WALLET_STATUS_CHANGE', previousStatus, newStatus: status }
      }),
      notificationService.createNotification({
        userId: wallet.user_id,
        type: status === 'FROZEN' ? 'WALLET_FROZEN' : 'WALLET_UNFROZEN',
        title: 'Wallet Status Updated',
        message: `Your wallet status has been changed to ${status}.`
      })
    ]).catch(err => console.error('[Telemetry Error]', err));

    return successResponse(res, { wallet: updatedWallet });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/wallets
 * Fetch paginated list of wallets.
 */
exports.getWallets = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { search, status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { wallet_number: { startsWith: search } },
        { user: { email: { startsWith: search } } }
      ];
    }

    const [total, walletsRaw] = await Promise.all([
      prisma.wallet.count({ where }),
      prisma.wallet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { email: true, status: true } }
        }
      })
    ]);

    const wallets = walletsRaw.map(w => ({
      id: w.id,
      wallet_number: w.wallet_number,
      balance: w.balance,
      status: w.status,
      created_at: w.created_at,
      user_email: w.user?.email || 'N/A',
      user_status: w.user?.status || 'N/A'
    }));

    return successResponse(res, {
      wallets,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

