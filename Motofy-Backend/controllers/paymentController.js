// controllers/paymentController.js

const { createStripeSession } = require('../utils/stripe');

// @desc    Create Stripe checkout session
const createPaymentSession = async (req, res) => {
  try {
    const { carName, amount } = req.body;

    if (!carName || !amount) {
      return res.status(400).json({ message: 'carName and amount are required' });
    }

    const session = await createStripeSession({ carName, amount });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe session error:', error);
    res.status(500).json({ success: false, message: 'Error creating payment session. Please try again later.' });
  }
};

module.exports = {
  createPaymentSession,
};
