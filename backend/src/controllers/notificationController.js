const prisma = require('../config/db');

/**
 * GET /api/notifications
 * Fetch user's notifications, ordered by newest first.
 */
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user.userId || req.user.id },
      orderBy: { created_at: 'desc' },
      take: 50 // limit to recent 50
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error('[Notification API Error]', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

/**
 * POST /api/notifications/:id/read
 * Mark a specific notification as read.
 */
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;

    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification || notification.user_id !== (req.user.userId || req.user.id)) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { is_read: true }
    });

    res.status(200).json({ message: 'Marked as read' });
  } catch (error) {
    console.error('[Notification API Error]', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
};

/**
 * POST /api/notifications/read-all
 * Mark all of a user's notifications as read.
 */
exports.markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { 
        user_id: req.user.userId || req.user.id,
        is_read: false
      },
      data: { is_read: true }
    });

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('[Notification API Error]', error);
    res.status(500).json({ message: 'Failed to update notifications' });
  }
};
