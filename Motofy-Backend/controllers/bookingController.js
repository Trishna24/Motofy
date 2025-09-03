const Booking = require('../models/Booking');
const User = require('../models/User');
const Car = require('../models/Car');

// @desc   Create a new booking
const createBooking = async (req, res) => {
  try {
    const { car, pickupDate, dropoffDate, pickupLocation, totalAmount } = req.body;

    if (!car || !pickupDate || !dropoffDate || !pickupLocation || !totalAmount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check for overlapping bookings for the same car
    const overlappingBooking = await Booking.findOne({
      car,
      status: { $ne: 'Cancelled' },
      $or: [
        {
          pickupDate: { $lte: new Date(dropoffDate) },
          dropoffDate: { $gte: new Date(pickupDate) }
        }
      ]
    });
    if (overlappingBooking) {
      return res.status(400).json({ success: false, message: 'Car is already booked for the selected dates.' });
    }

    const booking = new Booking({
      user: req.user.userId, // Fetched from JWT token after login
      car,
      pickupDate,
      dropoffDate,
      pickupLocation,
      totalAmount,
    });

    await booking.save();

    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Error creating booking. Please try again later.' });
  }
};

// @desc   Get current user's bookings
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.userId }).populate('car');
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ success: false, message: 'Error fetching your bookings. Please try again later.' });
  }
};

// @desc   Cancel a booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    res.json({ message: 'Booking cancelled' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ success: false, message: 'Error cancelling booking. Please try again later.' });
  }
};

// @desc   Get all bookings for admin
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'username email')
      .populate('car', 'name brand');
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ success: false, message: 'Error fetching bookings. Please try again later.' });
  }
};

// @desc   Update booking status by admin
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Pending', 'Confirmed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    booking.status = status;
    await booking.save();
    
    res.json({ message: 'Booking status updated', booking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: 'Error updating booking status. Please try again later.' });
  }
};

// @desc   Get booking statistics for admin dashboard
const getBookingStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'Pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'Confirmed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'Cancelled' });
    
    // Calculate total revenue from confirmed bookings
    const bookings = await Booking.find({ status: { $ne: 'Cancelled' } });
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    
    // Get recent bookings for activity feed
    const recentBookings = await Booking.find()
      .populate('user', 'username')
      .populate('car', 'name brand')
      .sort({ createdAt: -1 })
      .limit(5);
      
    const stats = {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      totalRevenue,
      recentBookings
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching booking statistics. Please try again later.' });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  cancelBooking,
  getAllBookings,
  updateBookingStatus,
  getBookingStats
};
