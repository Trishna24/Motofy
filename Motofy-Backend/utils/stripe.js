const dotenv = require('dotenv');
dotenv.config();  // Load environment variables first

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);  // Now secret key will load properly

const createStripeSession = async ({ bookingData, successUrl, cancelUrl }) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: { 
            name: `Car Booking - ${bookingData.pickupLocation}`,
            description: `Pickup: ${new Date(bookingData.pickupDate).toLocaleDateString()} - Dropoff: ${new Date(bookingData.dropoffDate).toLocaleDateString()}`
          },
          unit_amount: Math.round(bookingData.totalAmount * 100), // ₹ to paisa
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl + '?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: cancelUrl,
    metadata: {
      bookingData: JSON.stringify(bookingData)
    }
  });

  return session;
};

module.exports = { createStripeSession };
