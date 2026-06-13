const prisma = require('../config/db');

/**
 * NotificationService
 * Handles user notifications and future omni-channel delivery (Email, SMS, Push).
 */
class NotificationService {
  /**
   * Generate a notification for a user.
   * @param {Object} params
   * @param {String} params.userId - Recipient user ID
   * @param {String} params.type - NotificationType enum value
   * @param {String} params.title - Short notification title
   * @param {String} params.message - Full notification message
   * @param {String} [params.actionUrl] - Deep link URL
   * @param {Object} [params.metadata] - Optional JSON payload for advanced templating
   */
  async createNotification({ userId, type, title, message, actionUrl, metadata }) {
    try {
      if (!userId || !type || !title || !message) return;

      // 1. Persist to database (In-App Notification)
      await prisma.notification.create({
        data: {
          user_id: userId,
          type,
          title,
          message,
          action_url: actionUrl || null,
          metadata: metadata || null,
        }
      });

      // 2. [Future] Push Notification hooks
      // 3. [Future] Email Gateway integration
      // 4. [Future] SMS Gateway integration

    } catch (error) {
      // Catch failure to ensure core flows (e.g. money sent) do not fail if messaging fails
      console.error('[NotificationService Error] Failed to create notification:', error.message);
    }
  }
}

module.exports = new NotificationService();
