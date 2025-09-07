// routes/paymentRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createPaymentSession } = require('../controllers/paymentController');

// POST: Create Stripe checkout session
router.post('/create-checkout-session', protect , createPaymentSession);

module.exports = router;
