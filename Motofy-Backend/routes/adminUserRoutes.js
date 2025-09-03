const express = require('express');
const router = express.Router();
const { protect, adminProtect } = require('../middleware/authMiddleware');
const {
  getAllUsers,
  getUserById,
  updateUserStatus,
  getUserBookingsByAdmin,
  getUserStats
} = require('../controllers/userController');

// All routes in this file are protected by adminProtect middleware
router.use(protect, adminProtect);

router.route('/users').get(getAllUsers);
router.route('/users/stats').get(getUserStats);
router.route('/users/:id').get(getUserById);
router.route('/users/:id/status').patch(updateUserStatus);
router.route('/users/:id/bookings').get(getUserBookingsByAdmin);

module.exports = router;