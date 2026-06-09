const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, transactionController.transfer);
router.get('/', protect, transactionController.getTransactions);

module.exports = router;
