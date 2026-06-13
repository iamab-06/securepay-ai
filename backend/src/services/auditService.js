const prisma = require('../config/db');

/**
 * AuditService
 * Handles immutable logging of administrative actions and compliance tracking.
 */
class AuditService {
  /**
   * Log an admin action to the audit trail.
   * @param {Object} params
   * @param {String} params.adminId - ID of the admin performing the action
   * @param {String} params.action - String representing the action (e.g., SUSPEND_USER)
   * @param {String} params.targetId - ID of the entity being acted upon (user, wallet, kyc)
   * @param {Object} [params.details] - Optional JSON details (e.g., old/new states, reasons)
   */
  async logAdminAction({ adminId, action, targetId, details }) {
    try {
      if (!adminId || !action || !targetId) return;

      await prisma.adminAuditLog.create({
        data: {
          admin_id: adminId,
          action,
          target_id: targetId,
          details: details || null,
        }
      });
    } catch (error) {
      // Internal swallow to prevent failing admin flows
      console.error('[AuditService Error] Failed to log admin action:', error.message);
    }
  }
}

module.exports = new AuditService();
