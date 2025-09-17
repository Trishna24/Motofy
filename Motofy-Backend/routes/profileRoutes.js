// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const {
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount
} = require('../controllers/profileController');

// All routes require authentication
router.use(protect);

// GET /api/profile - Get user profile
router.get('/', getProfile);

// PUT /api/profile - Update user profile (with file uploads)
router.put('/', upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'drivingLicense', maxCount: 1 }
]), updateProfile);

// PUT /api/profile/change-password - Change user password
router.put('/change-password', changePassword);

// PUT /api/profile/deactivate - Deactivate user account
router.put('/deactivate', deactivateAccount);

module.exports = router;