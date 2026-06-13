const prisma = require('../config/db');

/**
 * Asynchronously generates a Fraud Alert.
 * Does NOT block any running execution.
 */
const generateAlert = async (userId, transactionId, rule, title, description, severity) => {
  try {
    await prisma.fraudAlert.create({
      data: {
        user_id: userId,
        transaction_id: transactionId || null,
        rule,
        title,
        description,
        severity,
        status: 'OPEN'
      }
    });
    console.log(`[FRAUD ALERT] ${rule} generated for User ${userId}`);
  } catch (err) {
    console.error(`[FRAUD ENGINE ERROR] Failed to generate alert for ${rule}:`, err.message);
  }
};

/**
 * Executes transfer-related fraud rules.
 * Runs asynchronously and does not block the transaction flow.
 */
exports.evaluateTransferRules = async (senderUserId, receiverUserId, transactionId, amount) => {
  try {
    const transferAmount = Number(amount);
    
    // RULE_001: Multiple transfers within short period (e.g. > 3 in 10 mins)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentTransfersCount = await prisma.transaction.count({
      where: {
        sender: { user_id: senderUserId },
        created_at: { gte: tenMinutesAgo }
      }
    });

    if (recentTransfersCount >= 3) {
      await generateAlert(
        senderUserId, 
        transactionId, 
        'RULE_001', 
        'High Transfer Velocity', 
        `${recentTransfersCount} transfers detected in the last 10 minutes.`, 
        'MEDIUM'
      );
    }

    // RULE_003: Critical-risk user initiating transfer
    const sender = await prisma.user.findUnique({
      where: { id: senderUserId },
      select: { risk_tier: true }
    });

    if (sender && sender.risk_tier === 'CRITICAL') {
      await generateAlert(
        senderUserId, 
        transactionId, 
        'RULE_003', 
        'Critical User Transfer', 
        `Transfer of ₹${transferAmount} initiated by user marked as CRITICAL risk.`, 
        'HIGH'
      );
    }

    // Check Beneficiary for RULE_002 and RULE_005
    if (receiverUserId) {
      const beneficiary = await prisma.beneficiary.findUnique({
        where: {
          owner_user_id_beneficiary_user_id: {
            owner_user_id: senderUserId,
            beneficiary_user_id: receiverUserId
          }
        }
      });

      if (beneficiary) {
        const timeSinceCreation = Date.now() - new Date(beneficiary.created_at).getTime();
        const minutesSinceCreation = timeSinceCreation / (1000 * 60);

        // RULE_002: High-value transfer to new beneficiary (< 24h)
        if (transferAmount > 50000 && minutesSinceCreation < 1440) {
          await generateAlert(
            senderUserId, 
            transactionId, 
            'RULE_002', 
            'High Value to New Beneficiary', 
            `Transfer of ₹${transferAmount} to beneficiary created ${(minutesSinceCreation / 60).toFixed(1)} hours ago.`, 
            'HIGH'
          );
        }

        // RULE_005: Beneficiary creation followed by transfer within 5 minutes
        if (minutesSinceCreation <= 5) {
          await generateAlert(
            senderUserId, 
            transactionId, 
            'RULE_005', 
            'Immediate Transfer After Beneficiary Addition', 
            `Transfer executed only ${minutesSinceCreation.toFixed(1)} minutes after beneficiary creation.`, 
            'CRITICAL'
          );
        }
      }
    }
  } catch (err) {
    console.error('[FRAUD ENGINE] evaluateTransferRules failed:', err.message);
  }
};

/**
 * Executes beneficiary-related fraud rules.
 * Runs asynchronously and does not block beneficiary creation.
 */
exports.evaluateBeneficiaryRules = async (ownerUserId) => {
  try {
    // RULE_004: Rapid beneficiary creation (e.g. > 2 within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentBeneficiaries = await prisma.beneficiary.count({
      where: {
        owner_user_id: ownerUserId,
        created_at: { gte: oneHourAgo }
      }
    });

    if (recentBeneficiaries >= 3) {
      await generateAlert(
        ownerUserId, 
        null, 
        'RULE_004', 
        'Rapid Beneficiary Addition', 
        `${recentBeneficiaries} beneficiaries added within the last hour.`, 
        'MEDIUM'
      );
    }
  } catch (err) {
    console.error('[FRAUD ENGINE] evaluateBeneficiaryRules failed:', err.message);
  }
};
