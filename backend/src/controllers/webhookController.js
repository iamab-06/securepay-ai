const depositService = require('../services/depositService');

exports.mockGatewayWebhook = async (req, res, next) => {
  try {
    const { securepay_reference, provider_reference } = req.body;

    if (!securepay_reference) {
      return res.status(400).json({ error: 'Missing securepay_reference' });
    }

    const result = await depositService.processDepositSettlement(securepay_reference, provider_reference);
    
    if (result.status === 'ALREADY_SETTLED') {
      // Idempotent success
      return res.status(200).json({ status: 'success', message: 'Already settled' });
    }

    return res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    // Return 500 or 400 for errors to inform the gateway that settlement failed locally
    console.error('Webhook processing error:', err.message);
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error during settlement' });
  }
};
