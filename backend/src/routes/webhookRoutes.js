const express = require('express');
const webhookController = require('../controllers/webhookController');

const router = express.Router();

// Webhook endpoints are publicly accessible, but rely on provider_reference/HMAC in production
router.post('/mock-gateway', webhookController.mockGatewayWebhook);

module.exports = router;
