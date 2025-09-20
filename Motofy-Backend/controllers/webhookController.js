// controllers/webhookController.js

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');

// @desc    Handle Stripe webhook events
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      try {
        // Extract booking data from session metadata
        const bookingData = JSON.parse(session.metadata.bookingData);
        
        // Create the booking
        const booking = new Booking({
          ...bookingData,
          paymentStatus: 'paid',
          paymentSessionId: session.id,
          totalAmount: session.amount_total / 100 // Convert from paisa to rupees
        });

        await booking.save();
        await booking.populate('car user');

        console.log('Booking created successfully via webhook:', booking._id);
      } catch (error) {
        console.error('Error creating booking from webhook:', error);
      }
      break;

    case 'payment_intent.payment_failed':
      console.log('Payment failed:', event.data.object);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = {
  handleStripeWebhook
};