const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/insights', protect, analyticsController.getUserInsights);

module.exports = router;
