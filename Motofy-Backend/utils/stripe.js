const dotenv = require('dotenv');
dotenv.config();  // Load environment variables first

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);  // Now secret key will load properly

const createStripeSession = async ({ carName, amount }) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: { name: carName },
          unit_amount: amount * 100, // ₹ to paisa
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL}/payment-success`,
    cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
  });

  return session;
};

module.exports = { createStripeSession };
