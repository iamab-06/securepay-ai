const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const securityController = require('../controllers/securityController');

const router = express.Router();

router.use(protect);

router.get('/risk-profile', securityController.getUserRiskProfile);

module.exports = router;
