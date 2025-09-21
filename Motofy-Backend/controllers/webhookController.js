// controllers/webhookController.js

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');

// @desc    Handle Stripe webhook events
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('🔔 Webhook received from Stripe');
  console.log('📋 Headers:', {
    'stripe-signature': sig ? 'Present' : 'Missing',
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length']
  });

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('✅ Webhook signature verified successfully');
    console.log('📨 Event type:', event.type);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('💳 Processing checkout.session.completed for session:', session.id);
      
      try {
        // Check if booking already exists for this session
        const existingBooking = await Booking.findOne({ stripeSessionId: session.id });
        
        if (existingBooking) {
          console.log('⚠️ Booking already exists for session:', session.id);
          break;
        }

        console.log('📝 Creating new booking from webhook...');
        console.log('📊 Session metadata:', session.metadata);

        // Extract booking data from session metadata
        const bookingData = JSON.parse(session.metadata.bookingData);
        console.log('📋 Parsed booking data:', bookingData);
        
        // Create the booking
        const booking = new Booking({
          ...bookingData,
          paymentStatus: 'paid',
          stripeSessionId: session.id,
          totalAmount: session.amount_total / 100 // Convert from paisa to rupees
        });

        console.log('💾 Saving booking via webhook...');
        await booking.save();
        await booking.populate('car user');

        console.log('✅ Booking created successfully via webhook:', booking._id);
      } catch (error) {
        console.error('❌ Error creating booking from webhook:', error);
        console.error('📊 Error details:', {
          message: error.message,
          stack: error.stack,
          sessionId: session.id,
          metadata: session.metadata
        });
      }
      break;

    case 'payment_intent.payment_failed':
      console.log('❌ Payment failed:', event.data.object);
      break;

    default:
      console.log(`ℹ️ Unhandled event type ${event.type}`);
  }

  console.log('✅ Webhook processed successfully');
  res.json({ received: true });
};

module.exports = {
  handleStripeWebhook
};