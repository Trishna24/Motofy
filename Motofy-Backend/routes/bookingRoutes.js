const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  cancelBooking,
  getAllBookings,
  updateBookingStatus,
  getBookingStats
} = require('../controllers/bookingController');
const { body, validationResult } = require('express-validator');

const { protect, adminProtect } = require('../middleware/authmiddleware');

// Validation middleware for booking creation
const bookingValidation = [
  body('car').notEmpty().withMessage('Car ID is required'),
  body('pickupDate').isISO8601().withMessage('Valid pickup date is required'),
  body('dropoffDate').isISO8601().withMessage('Valid dropoff date is required'),
  body('pickupLocation').notEmpty().withMessage('Pickup location is required'),
  body('totalAmount').isNumeric().withMessage('Total amount must be a number'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    // Check that dropoffDate is after pickupDate
    const { pickupDate, dropoffDate } = req.body;
    if (pickupDate && dropoffDate && new Date(dropoffDate) <= new Date(pickupDate)) {
      return res.status(400).json({ success: false, message: 'Dropoff date must be after pickup date.' });
    }
    next();
  },
];

// Create a booking
router.post('/', protect, bookingValidation, createBooking);

// Get current user's bookings
router.get('/my-bookings', protect, getUserBookings);

// Cancel a booking
router.put('/cancel/:id', protect, cancelBooking);

// Admin routes
// Get all bookings (admin only)
router.get('/admin/all', adminProtect, getAllBookings);

// Update booking status (admin only)
router.put('/admin/status/:id', adminProtect, updateBookingStatus);

// Get booking statistics for admin dashboard
router.get('/admin/stats', adminProtect, getBookingStats);

module.exports = router;
