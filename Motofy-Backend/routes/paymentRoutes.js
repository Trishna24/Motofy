// routes/paymentRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createPaymentSession, handlePaymentSuccess, verifyPaymentSession } = require('../controllers/paymentController');

// POST: Create Stripe checkout session
router.post('/create-checkout-session', protect, createPaymentSession);

// POST: Handle payment success (webhook or manual call)
router.post('/payment-success', handlePaymentSuccess);

// GET: Verify payment session and get booking details
router.get('/verify-session/:sessionId', verifyPaymentSession);

module.exports = router;
