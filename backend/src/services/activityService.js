const prisma = require('../config/db');

/**
 * ActivityService
 * Handles immutable logging of user activities across the platform.
 * Designed to never block or throw errors to the calling transaction.
 */
class ActivityService {
  /**
   * Log a user activity event.
   * @param {Object} params
   * @param {String} params.userId - ID of the user performing the action
   * @param {String} params.type - One of ActivityType enum values
   * @param {String} [params.ipAddress] - Optional IP address
   * @param {String} [params.device] - Optional device info/User-Agent
   * @param {Object} [params.metadata] - Optional JSON metadata context
   */
  async logActivity({ userId, type, ipAddress, device, metadata }) {
    try {
      if (!userId || !type) return;

      await prisma.userActivity.create({
        data: {
          user_id: userId,
          type,
          ip_address: ipAddress || null,
          device: device || null,
          metadata: metadata || null,
        }
      });
    } catch (error) {
      // Log internally but NEVER throw to caller, protecting core ledger operations
      console.error('[ActivityService Error] Failed to log activity:', error.message);
    }
  }
}

module.exports = new ActivityService();
