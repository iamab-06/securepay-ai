const express = require('express');
const depositController = require('../controllers/depositController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', depositController.createDeposit);
router.get('/', depositController.getDepositHistory);
router.get('/:reference', depositController.getDepositByReference);

module.exports = router;
