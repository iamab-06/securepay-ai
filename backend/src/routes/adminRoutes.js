const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/ledger/health', protect, authorize('ADMIN'), adminController.getLedgerHealth);
router.get('/system-status', protect, authorize('ADMIN'), adminController.getSystemStatus);
router.get('/fraud-analytics', protect, authorize('ADMIN'), adminController.getFraudAnalytics);

module.exports = router;
