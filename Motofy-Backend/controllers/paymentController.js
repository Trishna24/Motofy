// controllers/paymentController.js

const { createStripeSession } = require('../utils/stripe');
const Booking = require('../models/Booking');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create Stripe checkout session
const createPaymentSession = async (req, res) => {
  try {
    const { bookingData, successUrl, cancelUrl } = req.body;
    const userId = req.user.id;

    if (!bookingData || !successUrl || !cancelUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'bookingData, successUrl, and cancelUrl are required' 
      });
    }

    // Add user ID to booking data
    const completeBookingData = {
      ...bookingData,
      user: userId
    };

    // Create the Stripe session with booking data
    const session = await createStripeSession({
      bookingData: completeBookingData,
      successUrl,
      cancelUrl
    });

    res.status(200).json({ 
      success: true, 
      sessionUrl: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Stripe session error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating payment session. Please try again later.' 
    });
  }
};

// @desc    Handle successful payment webhook
const handlePaymentSuccess = async (req, res) => {
  try {
    const { sessionId, bookingData } = req.body;

    if (!sessionId || !bookingData) {
      return res.status(400).json({ 
        success: false, 
        message: 'sessionId and bookingData are required' 
      });
    }

    // Create the booking after successful payment
    const booking = new Booking({
      ...bookingData,
      paymentStatus: 'completed',
      stripeSessionId: sessionId,
      bookingDate: new Date()
    });

    await booking.save();
    await booking.populate('car user');

    res.status(200).json({ 
      success: true, 
      message: 'Booking created successfully',
      booking: booking
    });
  } catch (error) {
    console.error('Payment success handling error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing successful payment' 
    });
  }
};

// @desc    Verify payment session and get booking details
const verifyPaymentSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Session ID is required' 
      });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      // Find the booking created for this session
      const booking = await Booking.findOne({ stripeSessionId: sessionId })
        .populate('car user');

      if (booking) {
        res.status(200).json({ 
          success: true, 
          bookingDetails: {
            bookingId: booking._id,
            carName: booking.car.name + ' ' + booking.car.brand,
            totalAmount: booking.totalAmount,
            pickupDate: booking.pickupDate,
            dropoffDate: booking.dropoffDate,
            location: booking.location,
            paymentStatus: booking.paymentStatus
          }
        });
      } else {
        res.status(404).json({ 
          success: false, 
          message: 'Booking not found for this session' 
        });
      }
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Payment not completed' 
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying payment session' 
    });
  }
};

module.exports = {
  createPaymentSession,
  handlePaymentSuccess,
  verifyPaymentSession
};
