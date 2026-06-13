const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, notificationController.getNotifications);
router.post('/read-all', protect, notificationController.markAllAsRead);
router.post('/:id/read', protect, notificationController.markAsRead);

module.exports = router;
