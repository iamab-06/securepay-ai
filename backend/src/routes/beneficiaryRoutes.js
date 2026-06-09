const express = require('express');
const router = express.Router();
const beneficiaryController = require('../controllers/beneficiaryController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, beneficiaryController.addBeneficiary);
router.get('/', protect, beneficiaryController.getBeneficiaries);
router.delete('/:id', protect, beneficiaryController.removeBeneficiary);

module.exports = router;
