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
      .populate('car', 'make model year dailyRate')
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

module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  getUserBookingsByAdmin,
  getUserStats
};