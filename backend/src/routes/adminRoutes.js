const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminFraudController = require('../controllers/adminFraudController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/ledger/health', protect, authorize('ADMIN'), adminController.getLedgerHealth);
router.get('/system-status', protect, authorize('ADMIN'), adminController.getSystemStatus);
router.get('/fraud-analytics', protect, authorize('ADMIN'), adminController.getFraudAnalytics);

// User & Wallet Management
router.get('/users', protect, authorize('ADMIN'), adminController.getUsers);
router.post('/users/:id/status', protect, authorize('ADMIN'), adminController.updateUserStatus);
router.get('/wallets', protect, authorize('ADMIN'), adminController.getWallets);
router.post('/wallets/:id/status', protect, authorize('ADMIN'), adminController.updateWalletStatus);

// Fraud Monitoring Routes
router.get('/fraud/alerts', protect, authorize('ADMIN'), adminFraudController.getAlerts);
router.post('/fraud/alerts/:id/status', protect, authorize('ADMIN'), adminFraudController.updateAlertStatus);
router.get('/fraud/cases', protect, authorize('ADMIN'), adminFraudController.getCases);
router.post('/fraud/cases/:id/resolve', protect, authorize('ADMIN'), adminFraudController.resolveCase);

module.exports = router;
