const User = require('../models/User');
const Booking = require('../models/Booking');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (user) {
      res.json(user);
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user status
// @route   PATCH /api/admin/users/:id/status
// @access  Admin
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (user) {
      user.status = status;
      
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        status: updatedUser.status
      });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user bookings by admin
// @route   GET /api/admin/users/:id/bookings
// @access  Admin
const getUserBookingsByAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.params.id })
      .populate('car', 'make model year dailyRate carNumber')
      .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user statistics
// @route   GET /api/admin/users/stats
// @access  Admin
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    
    const activeUsers = await User.countDocuments({ status: 'active' });
    const inactiveUsers = await User.countDocuments({ status: 'inactive' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });
    
    res.json({
      totalUsers,
      newUsersToday,
      activeUsers,
      inactiveUsers,
      suspendedUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get user analytics for admin dashboard
const getUserAnalytics = async (req, res) => {
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
    
    // Get basic user stats
    const totalUsers = await User.countDocuments(dateFilter);
    const activeUsers = await User.countDocuments({ ...dateFilter, status: 'active' });
    const inactiveUsers = await User.countDocuments({ ...dateFilter, status: 'inactive' });
    const suspendedUsers = await User.countDocuments({ ...dateFilter, status: 'suspended' });
    
    // Get user registration trends for the last 12 months
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const userRegistrationTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Format registration trends
    const registrationsByMonth = userRegistrationTrends.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      count: item.count
    }));
    
    // Get user activity (users with bookings)
    const usersWithBookings = await Booking.distinct('user', dateFilter);
    const activeBookingUsers = usersWithBookings.length;
    const userActivityRate = totalUsers > 0 ? (activeBookingUsers / totalUsers * 100).toFixed(1) : 0;
    
    // Get top users by booking count
    const topUsersByBookings = await Booking.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$user',
          bookingCount: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $project: {
          username: '$userDetails.username',
          email: '$userDetails.email',
          bookingCount: 1,
          totalSpent: 1
        }
      },
      {
        $sort: { bookingCount: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    // Get top users by revenue
    const topUsersByRevenue = await Booking.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$totalAmount' },
          bookingCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $project: {
          username: '$userDetails.username',
          email: '$userDetails.email',
          totalSpent: 1,
          bookingCount: 1
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    // Get recent user registrations
    const recentUsers = await User.find(dateFilter)
      .select('username email createdAt status')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // User status distribution for pie chart
    const statusDistribution = [
      { status: 'Active', count: activeUsers, color: '#28a745' },
      { status: 'Inactive', count: inactiveUsers, color: '#6c757d' },
      { status: 'Suspended', count: suspendedUsers, color: '#dc3545' }
    ];
    
    const userAnalytics = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      activeBookingUsers,
      userActivityRate,
      registrationsByMonth,
      topUsersByBookings,
      topUsersByRevenue,
      recentUsers,
      statusDistribution,
      timeFilter
    };
    
    res.json(userAnalytics);
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ success: false, message: 'Error fetching user analytics. Please try again later.' });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Admin
const updateUser = async (req, res) => {
  try {
    const { username, email, phone, address, status } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user fields (excluding notification preferences)
    if (username) user.username = username;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    // Note: preferences (notification settings) are excluded from admin updates
    if (status && ['active', 'inactive', 'suspended'].includes(status)) {
      user.status = status;
    }
    
    const updatedUser = await user.save();
    
    // Return user without password
    const userResponse = updatedUser.toObject();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUser,
  getUserBookingsByAdmin,
  getUserStats,
  getUserAnalytics
};