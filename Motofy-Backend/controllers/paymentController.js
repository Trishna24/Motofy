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
  // Prevent caching to ensure fresh responses
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Type', 'application/json');

  // Create debug info object
  const debugInfo = {
    functionStarted: true,
    timestamp: new Date().toISOString(),
    environment: {
      stripeKeyExists: !!process.env.STRIPE_SECRET_KEY,
      stripeKeyLength: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0,
      nodeEnv: process.env.NODE_ENV
    },
    request: {
      params: req.params,
      url: req.url,
      method: req.method,
      headers: {
        userAgent: req.headers['user-agent'],
        contentType: req.headers['content-type']
      }
    },
    stripe: {
      instanceExists: !!stripe,
      stripeVersion: stripe ? stripe.VERSION : 'N/A'
    }
  };
  
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      const errorResponse = { 
        success: false, 
        message: 'Session ID is required',
        debug: debugInfo
      };
      return res.status(400).json(errorResponse);
    }

    debugInfo.sessionId = sessionId;
    debugInfo.sessionIdLength = sessionId.length;
    debugInfo.sessionIdFormat = sessionId.startsWith('cs_') ? 'valid_format' : 'invalid_format';

    // Retrieve session from Stripe
    debugInfo.stripeApiCallAttempted = true;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    debugInfo.stripeApiCallSuccessful = true;
    debugInfo.sessionRetrieved = !!session;
    
    // Return session details with debug info for troubleshooting
    res.json({
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        customer_email: session.customer_details?.email,
        amount_total: session.amount_total,
        currency: session.currency,
        metadata: session.metadata
      },
      debug: debugInfo
    });
  } catch (error) {
    debugInfo.stripeApiCallSuccessful = false;
    debugInfo.error = {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode
    };
    
    res.status(500).json({ 
      error: 'Failed to retrieve payment session',
      details: error.message,
      debug: debugInfo
    });
  }
};

module.exports = {
  createPaymentSession,
  handlePaymentSuccess,
  verifyPaymentSession
};
