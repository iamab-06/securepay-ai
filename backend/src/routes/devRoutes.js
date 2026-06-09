const express = require('express');
const router = express.Router();
const devController = require('../controllers/devController');
const { protect } = require('../middleware/authMiddleware');

// Development Funding Engine
router.post('/fund-wallet', protect, devController.fundWallet);

module.exports = router;
