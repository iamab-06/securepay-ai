const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Note: Ensure /api/admin/kyc logic is attached to admin routes
// or handled safely here under the right path namespace in index.js

// --- USER ROUTES ---
router.post('/submit', protect, kycController.submitKyc);
router.get('/status', protect, kycController.getKycStatus);

// --- ADMIN ROUTES ---
// Admin routes will be attached to /api/admin/kyc
router.get('/queue', protect, authorize('ADMIN'), kycController.getKycQueue);
router.post('/:id/review', protect, authorize('ADMIN'), kycController.reviewKyc);

module.exports = router;