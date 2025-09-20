// routes/webhookRoutes.js

const express = require('express');
const router = express.Router();
const { handleStripeWebhook } = require('../controllers/webhookController');

// POST: Handle Stripe webhook events
// Note: This route should use raw body parser, not JSON parser
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

module.exports = router;