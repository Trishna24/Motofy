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
      bookingDate: new Date(),
      status: 'Confirmed' // Set status to Confirmed when payment is successful
    });

    await booking.save();
    await booking.populate('car user');

    // Update car availability when booking is confirmed through payment
    const Car = require('../models/Car');
    const car = await Car.findById(bookingData.car);
    if (car) {
      car.availability = false;
      await car.save();
    }

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
    
    debugInfo.paymentStatus = session.payment_status;
    debugInfo.sessionMetadata = session.metadata;

    // Check if payment was successful
    if (session.payment_status === 'paid') {
      debugInfo.paymentSuccessful = true;
      
      // Check if booking already exists for this session
      const existingBooking = await Booking.findOne({ stripeSessionId: sessionId });
      debugInfo.existingBookingFound = !!existingBooking;
      
      if (existingBooking) {
        // Return existing booking details
        await existingBooking.populate('car user');
        debugInfo.bookingReturned = 'existing';
        
        return res.json({
          success: true,
          bookingDetails: {
            bookingId: existingBooking._id,
            carName: existingBooking.car.name,
            totalAmount: existingBooking.totalAmount,
            pickupDate: existingBooking.pickupDate,
            dropoffDate: existingBooking.dropoffDate,
            location: existingBooking.pickupLocation,
            paymentStatus: existingBooking.paymentStatus
          },
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
      }

      // Create new booking if payment is successful and no existing booking
      if (session.metadata && session.metadata.bookingData) {
        debugInfo.bookingDataFound = true;
        
        try {
          const bookingData = JSON.parse(session.metadata.bookingData);
          debugInfo.bookingDataParsed = true;
          debugInfo.parsedBookingData = bookingData;
          
          // Create the booking
          const booking = new Booking({
            car: bookingData.car,
            user: bookingData.user,
            pickupDate: new Date(bookingData.pickupDate),
            dropoffDate: new Date(bookingData.dropoffDate),
            pickupLocation: bookingData.pickupLocation,
            totalAmount: bookingData.totalAmount,
            paymentStatus: 'paid',
            stripeSessionId: sessionId,
            bookingDate: new Date(),
            status: 'Confirmed' // Set status to Confirmed when payment is successful
          });

          await booking.save();
          await booking.populate('car user');
          debugInfo.bookingCreated = true;
          debugInfo.bookingId = booking._id;

          // Update car availability to false when booked
          await Car.findByIdAndUpdate(bookingData.car, { availability: false });
          debugInfo.carAvailabilityUpdated = true;

          return res.json({
            success: true,
            bookingDetails: {
              bookingId: booking._id,
              carName: booking.car.name,
              totalAmount: booking.totalAmount,
              pickupDate: booking.pickupDate,
              dropoffDate: booking.dropoffDate,
              location: booking.pickupLocation,
              paymentStatus: booking.paymentStatus
            },
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
        } catch (parseError) {
          debugInfo.bookingDataParseError = parseError.message;
          debugInfo.bookingCreated = false;
        }
      } else {
        debugInfo.bookingDataFound = false;
      }
    } else {
      debugInfo.paymentSuccessful = false;
    }
    
    // Return session details without booking creation if payment not successful or booking data missing
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
