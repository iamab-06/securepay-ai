const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, walletController.getWallet);
router.get('/balance', protect, walletController.getBalance);

module.exports = router;
