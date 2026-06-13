const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const auditService = require('../services/auditService');

exports.getAlerts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Optional filters
    const status = req.query.status; // OPEN, INVESTIGATING, etc.
    const severity = req.query.severity;

    const where = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const [total, alertsRaw] = await Promise.all([
      prisma.fraudAlert.count({ where }),
      prisma.fraudAlert.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { severity: 'desc' },
          { created_at: 'desc' }
        ],
        include: {
          user: { select: { email: true, risk_tier: true } }
        }
      })
    ]);

    // Prisma sorts enums alphabetically or definition order if not specified correctly,
    // but Prisma doesn't sort Enum values by logical weight natively without raw queries. 
    // We sort here just in case if Prisma relies on db order. Actually Prisma 5 sorts by enum definition order.

    return successResponse(res, {
      alerts: alertsRaw,
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

exports.updateAlertStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['OPEN', 'INVESTIGATING', 'DISMISSED', 'ESCALATED', 'RESOLVED'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status', 400);
    }

    const alert = await prisma.fraudAlert.findUnique({ where: { id } });
    if (!alert) {
      return errorResponse(res, 'Alert not found', 404);
    }

    // Begin transaction if escalating
    await prisma.$transaction(async (tx) => {
      await tx.fraudAlert.update({
        where: { id },
        data: { status }
      });

      if (status === 'ESCALATED' && alert.status !== 'ESCALATED') {
        // Automatically provision a Fraud Case
        await tx.fraudCase.create({
          data: {
            alert_id: id,
            assigned_to: req.user.userId || req.user.id // Assign to the escalating admin
          }
        });
      }
    });

    // Log the audit
    await auditService.logAdminAction(req.user.userId || req.user.id, 'UPDATE_FRAUD_ALERT', id, { newStatus: status });

    return successResponse(res, { message: `Alert status updated to ${status}` });
  } catch (err) {
    next(err);
  }
};

exports.getCases = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const resolved = req.query.resolved === 'true';

    const where = {};
    if (resolved) {
      where.resolved_at = { not: null };
    } else {
      where.resolved_at = null;
    }

    const [total, cases] = await Promise.all([
      prisma.fraudCase.count({ where }),
      prisma.fraudCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          alert: {
            include: {
              user: { select: { email: true } }
            }
          },
          assignee: { select: { name: true, email: true } }
        }
      })
    ]);

    return successResponse(res, {
      cases,
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

exports.resolveCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution, notes } = req.body;

    const validResolutions = ['FALSE_POSITIVE', 'ACCOUNT_FROZEN', 'WALLET_FROZEN', 'USER_WARNED', 'MONITOR_ONLY'];
    if (!validResolutions.includes(resolution)) {
      return errorResponse(res, 'Invalid resolution type', 400);
    }

    const fraudCase = await prisma.fraudCase.findUnique({ where: { id }, include: { alert: true } });
    if (!fraudCase) {
      return errorResponse(res, 'Fraud Case not found', 404);
    }

    if (fraudCase.resolved_at) {
      return errorResponse(res, 'Case is already resolved', 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.fraudCase.update({
        where: { id },
        data: {
          resolution,
          notes: notes || null,
          resolved_at: new Date()
        }
      });

      await tx.fraudAlert.update({
        where: { id: fraudCase.alert_id },
        data: { status: 'RESOLVED' }
      });
    });

    await auditService.logAdminAction(req.user.userId || req.user.id, 'RESOLVE_FRAUD_CASE', id, { resolution, notes });

    return successResponse(res, { message: `Case resolved as ${resolution}` });
  } catch (err) {
    next(err);
  }
};
