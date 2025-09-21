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
  console.log('🚀 PAYMENT VERIFICATION FUNCTION STARTED');
  console.log('📊 Environment check - STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
  console.log('📊 Environment check - STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0);
  
  try {
    const { sessionId } = req.params;
    console.log('🔍 Payment verification started for session:', sessionId);
    console.log('📊 Request params:', req.params);
    console.log('📊 Request URL:', req.url);

    // Prevent caching to ensure fresh responses
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/json');

    if (!sessionId) {
      console.log('❌ No session ID provided');
      const errorResponse = { 
        success: false, 
        message: 'Session ID is required' 
      };
      console.log('📤 Sending session ID error response:', JSON.stringify(errorResponse, null, 2));
      return res.status(400).json(errorResponse);
    }

    // Check Stripe configuration
    console.log('🔧 Stripe instance check:', !!stripe);
    console.log('🔧 About to call Stripe API...');

    // Retrieve session from Stripe
    console.log('📞 Retrieving session from Stripe...');
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('✅ Stripe session retrieved successfully!');
    console.log('✅ Stripe session details:', {
      id: session.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      metadata: session.metadata
    });
    
    if (session.payment_status === 'paid') {
      console.log('💳 Payment confirmed as paid, looking for existing booking...');
      
      // Find the booking created for this session
      let booking = await Booking.findOne({ stripeSessionId: sessionId })
        .populate('car user');

      if (booking) {
        console.log('✅ Existing booking found:', booking._id);
      } else {
        console.log('⚠️ No existing booking found, creating fallback booking...');
      }

      // If booking doesn't exist, create it (fallback for webhook failures)
      if (!booking) {
        try {
          console.log('📝 Parsing booking data from session metadata...');
          const bookingData = JSON.parse(session.metadata.bookingData);
          console.log('📋 Booking data parsed:', bookingData);
          
          booking = new Booking({
            ...bookingData,
            paymentStatus: 'paid',
            stripeSessionId: sessionId,
            totalAmount: session.amount_total / 100 // Convert from paisa to rupees
          });

          console.log('💾 Saving new booking...');
          await booking.save();
          await booking.populate('car user');
          
          console.log('✅ Booking created via payment verification fallback:', booking._id);
        } catch (createError) {
          console.error('❌ Error creating booking in verification fallback:', createError);
          console.error('📊 Session metadata:', session.metadata);
          const errorResponse = { 
            success: false, 
            message: 'Payment successful but booking creation failed. Please contact support.',
            debug: {
              error: createError.message,
              sessionId: sessionId,
              metadata: session.metadata
            }
          };
          console.log('📤 Sending booking creation error response:', JSON.stringify(errorResponse, null, 2));
          return res.status(500).json(errorResponse);
        }
      }

      if (booking) {
        console.log('🎉 Returning successful booking details');
        const responseData = { 
          success: true, 
          bookingDetails: {
            bookingId: booking._id,
            carName: booking.car.name + ' ' + booking.car.brand,
            totalAmount: booking.totalAmount,
            pickupDate: booking.pickupDate,
            dropoffDate: booking.dropoffDate,
            location: booking.pickupLocation,
            paymentStatus: booking.paymentStatus
          }
        };
        console.log('📤 Sending response data:', JSON.stringify(responseData, null, 2));
        res.status(200).json(responseData);
      } else {
        console.log('❌ Booking still not found after creation attempt');
        const errorResponse = { 
          success: false, 
          message: 'Booking not found for this session' 
        };
        console.log('📤 Sending error response:', JSON.stringify(errorResponse, null, 2));
        res.status(404).json(errorResponse);
      }
    } else {
      console.log('❌ Payment not completed. Status:', session.payment_status);
      const errorResponse = { 
        success: false, 
        message: `Payment not completed. Status: ${session.payment_status}` 
      };
      console.log('📤 Sending payment error response:', JSON.stringify(errorResponse, null, 2));
      res.status(400).json(errorResponse);
    }
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    console.error('📊 Error details:', {
      message: error.message,
      stack: error.stack,
      sessionId: req.params.sessionId
    });
    const errorResponse = { 
      success: false, 
      message: 'Error verifying payment session',
      debug: {
        error: error.message,
        sessionId: req.params.sessionId
      }
    };
    console.log('📤 Sending catch error response:', JSON.stringify(errorResponse, null, 2));
    res.status(500).json(errorResponse);
  }
};

module.exports = {
  createPaymentSession,
  handlePaymentSuccess,
  verifyPaymentSession
};
