const kycService = require('../services/kycService');
const activityService = require('../services/activityService');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');

/**
 * [USER] POST /api/kyc/submit
 */
exports.submitKyc = async (req, res) => {
  try {
    const { panNumber, aadhaarNumber } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!panNumber || !aadhaarNumber) {
      return res.status(400).json({ message: 'PAN and Aadhaar are required' });
    }

    const kyc = await kycService.createKycSubmission({
      userId,
      panNumber,
      aadhaarNumber
    });

    // Fire off async events
    await activityService.logActivity({
      userId,
      type: 'KYC_SUBMITTED',
      ipAddress: req.ip,
      device: req.headers['user-agent']
    });

    await notificationService.createNotification({
      userId,
      type: 'USER_REGISTERED', // reusing types, can be custom mapped
      title: 'KYC Submitted',
      message: 'Your KYC documents are under review. We will notify you once approved.',
      actionUrl: '/settings/kyc'
    });

    res.status(200).json({
      message: 'KYC submitted successfully',
      kyc: {
        id: kyc.id,
        status: kyc.status,
        aadhaarLast4: kyc.aadhaar_last4
        // Plaintext never sent back
      }
    });
  } catch (error) {
    console.error('[KYC Controller Error]', error);
    res.status(500).json({ message: `Failed to submit KYC: ${error.message}` });
  }
};

/**
 * [USER] GET /api/kyc/status
 */
exports.getKycStatus = async (req, res) => {
  try {
    const kyc = await kycService.getUserKycStatus(req.user.userId || req.user.id);
    if (!kyc) {
      return res.status(200).json({ status: 'PENDING' });
    }
    res.status(200).json(kyc);
  } catch (error) {
    console.error('[KYC Controller Error]', error);
    res.status(500).json({ message: 'Failed to fetch KYC status' });
  }
};

/**
 * [ADMIN] GET /api/admin/kyc
 */
exports.getKycQueue = async (req, res) => {
  try {
    const status = req.query.status || 'UNDER_REVIEW';
    const queue = await kycService.getAdminKycQueue(status);
    res.status(200).json(queue);
  } catch (error) {
    console.error('[KYC Controller Error]', error);
    res.status(500).json({ message: 'Failed to fetch KYC queue' });
  }
};

/**
 * [ADMIN] POST /api/admin/kyc/:id/review
 */
exports.reviewKyc = async (req, res) => {
  try {
    const { action, reason } = req.body; // action: 'APPROVE' or 'REJECT'
    const kycId = req.params.id;
    const adminId = req.user.userId || req.user.id;

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use APPROVE or REJECT' });
    }

    let kyc;
    if (action === 'APPROVE') {
      kyc = await kycService.approveKyc(kycId);
      
      await activityService.logActivity({
        userId: kyc.user_id,
        type: 'KYC_APPROVED'
      });

      await notificationService.createNotification({
        userId: kyc.user_id,
        type: 'KYC_APPROVED',
        title: 'KYC Approved',
        message: 'Your identity has been verified. Higher transfer limits are now unlocked!',
        actionUrl: '/settings/kyc'
      });
    } else {
      kyc = await kycService.rejectKyc(kycId, reason);
      
      await activityService.logActivity({
        userId: kyc.user_id,
        type: 'KYC_REJECTED'
      });

      await notificationService.createNotification({
        userId: kyc.user_id,
        type: 'KYC_REJECTED',
        title: 'KYC Rejected',
        message: `Your KYC was rejected: ${reason}. Please update your documents.`,
        actionUrl: '/settings/kyc'
      });
    }

    await auditService.logAdminAction({
      adminId,
      action: `KYC_${action}`,
      targetId: kycId,
      details: { reason: reason || null }
    });

    res.status(200).json({
      message: `KYC successfully ${action.toLowerCase()}ed`,
      kyc
    });
  } catch (error) {
    console.error('[KYC Controller Error]', error);
    res.status(500).json({ message: 'Failed to review KYC' });
  }
};
