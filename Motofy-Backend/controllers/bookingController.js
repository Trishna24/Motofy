const Booking = require('../models/Booking');
const User = require('../models/User');
const Car = require('../models/Car');

// @desc   Create a new booking
const createBooking = async (req, res) => {
  try {
    const { car, pickupDate, dropoffDate, pickupTime, dropoffTime, pickupLocation, totalAmount } = req.body;

    if (!car || !pickupDate || !dropoffDate || !pickupLocation || !totalAmount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create full datetime objects for accurate overlap checking
    const newPickupDateTime = new Date(`${pickupDate}T${pickupTime || '00:00:00'}`);
    const newDropoffDateTime = new Date(`${dropoffDate}T${dropoffTime || '23:59:59'}`);

    // Check for overlapping bookings for the same car
    const existingBookings = await Booking.find({
      car,
      status: { $ne: 'Cancelled' }
    });

    // Check each existing booking for time overlap
    for (const existingBooking of existingBookings) {
      const existingPickupDateTime = new Date(`${existingBooking.pickupDate.toISOString().split('T')[0]}T${existingBooking.pickupTime || '00:00:00'}`);
      const existingDropoffDateTime = new Date(`${existingBooking.dropoffDate.toISOString().split('T')[0]}T${existingBooking.dropoffTime || '23:59:59'}`);
      
      // Check for overlap: new booking starts before existing ends AND new booking ends after existing starts
      const hasOverlap = (newPickupDateTime < existingDropoffDateTime) && (newDropoffDateTime > existingPickupDateTime);
      
      if (hasOverlap) {
        return res.status(400).json({ 
          success: false, 
          message: `Car is already booked from ${existingPickupDateTime.toLocaleString()} to ${existingDropoffDateTime.toLocaleString()}. Please choose different dates/times.` 
        });
      }
    }

    const booking = new Booking({
      user: req.user._id, // Fetched from JWT token after login
      car,
      pickupDate,
      dropoffDate,
      pickupTime,
      dropoffTime,
      pickupLocation,
      totalAmount,
      status: 'Pending' // Set initial status as Pending
    });

    await booking.save();

    // Don't update car availability here - only when payment is confirmed
    // Car availability will be updated in payment success handler

    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Error creating booking. Please try again later.' });
  }
};

// @desc   Get current user's bookings
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('car', 'name brand make model year dailyRate image carNumber')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ success: false, message: 'Error fetching your bookings. Please try again later.' });
  }
};
// Add this in your booking controller file
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('car').populate('user');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Error fetching booking. Please try again later.' });
  }
};

// @desc   Cancel a booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const oldStatus = booking.status;
    booking.status = 'Cancelled';
    await booking.save();

    // Update car availability when booking is cancelled
    if (oldStatus === 'Confirmed') {
      const car = await Car.findById(booking.car);
      if (car) {
        // Check if there are other confirmed bookings for this car
        const otherConfirmedBookings = await Booking.countDocuments({
          car: booking.car,
          status: 'Confirmed',
          _id: { $ne: booking._id }
        });
        
        // If no other confirmed bookings, make car available
        if (otherConfirmedBookings === 0) {
          car.availability = true;
          await car.save();
        }
      }
    }

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
      .populate('car', 'name brand carNumber');
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
    
    const oldStatus = booking.status;
    
    // Prevent confirming cancelled bookings after the booking date has passed
    if (status === 'Confirmed' && oldStatus === 'Cancelled') {
      const currentDate = new Date();
      const bookingDate = new Date(booking.pickupDate);
      
      // If the booking date has passed, don't allow confirmation
      if (currentDate > bookingDate) {
        return res.status(400).json({ 
          message: 'Cannot confirm a cancelled booking after the pickup date has passed' 
        });
      }
    }
    booking.status = status;
    await booking.save();
    
    // Update car availability based on booking status
    const car = await Car.findById(booking.car);
    if (car) {
      if (status === 'Confirmed' && oldStatus !== 'Confirmed') {
        // When booking is confirmed, make car unavailable
        car.availability = false;
        await car.save();
      } else if ((status === 'Cancelled' || status === 'Pending') && oldStatus === 'Confirmed') {
        // When confirmed booking is cancelled or changed to pending, make car available
        // But first check if there are other confirmed bookings for this car
        const otherConfirmedBookings = await Booking.countDocuments({
          car: booking.car,
          status: 'Confirmed',
          _id: { $ne: booking._id }
        });
        
        if (otherConfirmedBookings === 0) {
          car.availability = true;
          await car.save();
        }
      }
    }
    
    res.json({ message: 'Booking status updated', booking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: 'Error updating booking status. Please try again later.' });
  }
};
// @desc   Update a booking
const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update allowed fields
    const { pickupDate, dropoffDate, pickupLocation, dropoffLocation, totalAmount, status } = req.body;

    if (pickupDate) booking.pickupDate = pickupDate;
    if (dropoffDate) booking.dropoffDate = dropoffDate;
    if (pickupLocation) booking.pickupLocation = pickupLocation;
    if (dropoffLocation) booking.dropoffLocation = dropoffLocation;
    if (totalAmount) booking.totalAmount = totalAmount;
    if (status && ['Pending', 'Confirmed', 'Cancelled'].includes(status)) booking.status = status;

    await booking.save();
    res.json({ message: 'Booking updated successfully', booking });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Error updating booking. Please try again later.' });
  }
};



// @desc   Get booking statistics for admin dashboard
const getBookingStats = async (req, res) => {
  try {
    const { timeFilter = 'all' } = req.query;
    
    // Define date ranges based on filter
    const now = new Date();
    let dateFilter = {};
    
    switch (timeFilter) {
      case 'today':
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        dateFilter = { createdAt: { $gte: startOfDay, $lt: endOfDay } };
        break;
      case 'week':
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { createdAt: { $gte: startOfWeek } };
        break;
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { createdAt: { $gte: startOfMonth } };
        break;
      case 'all':
      default:
        dateFilter = {};
        break;
    }
    
    // Get basic stats with time filtering
    const totalBookings = await Booking.countDocuments(dateFilter);
    const pendingBookings = await Booking.countDocuments({ ...dateFilter, status: 'Pending' });
    const confirmedBookings = await Booking.countDocuments({ ...dateFilter, status: 'Confirmed' });
    const cancelledBookings = await Booking.countDocuments({ ...dateFilter, status: 'Cancelled' });
    
    // Calculate total revenue from non-cancelled bookings
    const revenueBookings = await Booking.find({ ...dateFilter, status: { $ne: 'Cancelled' } });
    const totalRevenue = revenueBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    
    // Get booking trends for the last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const trendData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
    
    // Format trend data for charts
    const bookingTrends = trendData.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      count: item.count
    }));
    
    // Get recent bookings for activity feed
    const recentBookings = await Booking.find(dateFilter)
      .populate('user', 'username')
      .populate('car', 'name brand')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Status distribution for pie chart
    const statusDistribution = [
      { status: 'Confirmed', count: confirmedBookings, color: '#28a745' },
      { status: 'Pending', count: pendingBookings, color: '#ffc107' },
      { status: 'Cancelled', count: cancelledBookings, color: '#dc3545' }
    ];
      
    const stats = {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      totalRevenue,
      recentBookings,
      bookingTrends,
      statusDistribution,
      timeFilter
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching booking statistics. Please try again later.' });
  }
};

// @desc   Get revenue analytics for admin dashboard
const getRevenueAnalytics = async (req, res) => {
  try {
    const { timeFilter = 'all' } = req.query;
    
    // Define date ranges based on filter
    const now = new Date();
    let dateFilter = {};
    
    switch (timeFilter) {
      case 'today':
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        dateFilter = { createdAt: { $gte: startOfDay, $lt: endOfDay } };
        break;
      case 'week':
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { createdAt: { $gte: startOfWeek } };
        break;
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { createdAt: { $gte: startOfMonth } };
        break;
      case 'all':
      default:
        dateFilter = {};
        break;
    }
    
    // Get revenue data from confirmed bookings only
    const revenueBookings = await Booking.find({ ...dateFilter, status: { $ne: 'Cancelled' } });
    
    // Calculate total revenue
    const totalRevenue = revenueBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const confirmedRevenue = revenueBookings.filter(b => b.status === 'Confirmed').reduce((sum, booking) => sum + booking.totalAmount, 0);
    const pendingRevenue = revenueBookings.filter(b => b.status === 'Pending').reduce((sum, booking) => sum + booking.totalAmount, 0);
    
    // Calculate average booking value
    const avgBookingValue = revenueBookings.length > 0 ? totalRevenue / revenueBookings.length : 0;
    
    // Get monthly revenue trends for the last 12 months
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
          status: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Format monthly revenue data
    const revenueByMonth = monthlyRevenue.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      revenue: item.revenue,
      bookings: item.bookings
    }));
    
    // Get daily revenue for the last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailyRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
    
    // Format daily revenue data
    const revenueByDay = dailyRevenue.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      revenue: item.revenue,
      bookings: item.bookings
    }));
    
    // Get top revenue generating cars
    const topCars = await Booking.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $ne: 'Cancelled' }
        }
      },
      {
        $lookup: {
          from: 'cars',
          localField: 'car',
          foreignField: '_id',
          as: 'carDetails'
        }
      },
      {
        $unwind: '$carDetails'
      },
      {
        $group: {
          _id: '$car',
          carName: { $first: { $concat: ['$carDetails.brand', ' ', '$carDetails.name'] } },
          totalRevenue: { $sum: '$totalAmount' },
          bookingCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    const revenueAnalytics = {
      totalRevenue,
      confirmedRevenue,
      pendingRevenue,
      avgBookingValue,
      revenueByMonth,
      revenueByDay,
      topCars,
      timeFilter
    };
    
    res.json(revenueAnalytics);
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ success: false, message: 'Error fetching revenue analytics. Please try again later.' });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  updateBookingStatus,
  updateBooking,
  getBookingStats,
  getRevenueAnalytics
};
