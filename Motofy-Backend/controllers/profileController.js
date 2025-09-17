// controllers/profileController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
// Get user profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            user: user
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    // console.log('🚀 Profile update request received');
    // console.log('👤 User ID:', req.user?.id);
    // console.log('📝 Request body:', req.body);
    // console.log('📁 Files:', req.files);
    
    const userId = req.user.id;
    const {
      username,
      phone,
      address,
      preferences
    } = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      // console.log('❌ User not found for ID:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // console.log('✅ User found:', user.email);

    // Prepare update data
    const updateData = {};

    // Update basic fields
    if (username) updateData.username = username;
    if (phone) updateData.phone = phone;

    // Parse address from FormData format (address[field])
    const addressFields = {};
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('address[') && key.endsWith(']')) {
        const field = key.slice(8, -1); // Extract field name from address[field]
        addressFields[field] = req.body[key];
      }
    });

    // Update address if any address fields are provided
    if (Object.keys(addressFields).length > 0) {
      updateData.address = {
        street: addressFields.street || user.address?.street || '',
        city: addressFields.city || user.address?.city || '',
        state: addressFields.state || user.address?.state || '',
        zipCode: addressFields.zipCode || user.address?.zipCode || '',
        country: addressFields.country || user.address?.country || 'India'
      };
    }

    // Parse preferences from FormData format (preferences[field])
    const preferencesFields = {};
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('preferences[') && key.endsWith(']')) {
        const field = key.slice(12, -1); // Extract field name from preferences[field]
        preferencesFields[field] = req.body[key] === 'true'; // Convert string to boolean
      }
    });

    // Update preferences if any preference fields are provided
    if (Object.keys(preferencesFields).length > 0) {
      updateData.preferences = {
        emailNotifications: preferencesFields.emailNotifications !== undefined ? 
          preferencesFields.emailNotifications : user.preferences?.emailNotifications || true,
        smsNotifications: preferencesFields.smsNotifications !== undefined ? 
          preferencesFields.smsNotifications : user.preferences?.smsNotifications || false
      };
    }

    // Handle file uploads
    if (req.files) {
      // Handle profile picture upload
      if (req.files.profilePicture && req.files.profilePicture[0]) {
        const profilePictureFile = req.files.profilePicture[0];
        
        // Delete old profile picture if exists
        if (user.profilePicture) {
          const oldProfilePicturePath = path.join(__dirname, '../uploads/profile-pictures', user.profilePicture);
          if (fs.existsSync(oldProfilePicturePath)) {
            fs.unlinkSync(oldProfilePicturePath);
          }
        }
        
        updateData.profilePicture = profilePictureFile.filename;
      }

      // Handle driving license upload
      if (req.files.drivingLicense && req.files.drivingLicense[0]) {
        const drivingLicenseFile = req.files.drivingLicense[0];
        
        // Delete old driving license if exists
        if (user.drivingLicense) {
          const oldDrivingLicensePath = path.join(__dirname, '../uploads/driving-licenses', user.drivingLicense);
          if (fs.existsSync(oldDrivingLicensePath)) {
            fs.unlinkSync(oldDrivingLicensePath);
          }
        }
        
        updateData.drivingLicense = drivingLicenseFile.filename;
      }
    }

    // console.log('📊 Update data prepared:', updateData);

    // Update user in database
    // console.log('🔄 Attempting to update user with ID:', userId);
    // console.log('📊 Final update data:', JSON.stringify(updateData, null, 2));
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      // console.log('❌ User update failed - no user returned');
      return res.status(404).json({
        success: false,
        message: 'User not found after update'
      });
    }

    // console.log('✅ User updated successfully:', updatedUser.email);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('❌ Error updating profile:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.error('❌ Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      console.error('❌ Duplicate key error for field:', field);
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    console.error('❌ Unexpected error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

// @desc    Change user password
// @route   PUT /api/profile/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(userId, {
      password: hashedNewPassword
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
};

// @desc    Deactivate user account
// @route   PUT /api/profile/deactivate
// @access  Private
const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user status to inactive
    await User.findByIdAndUpdate(userId, {
      status: 'inactive'
    });

    // Note: In a real application, you might also want to:
    // 1. Cancel any active bookings
    // 2. Send notification emails
    // 3. Log the deactivation for audit purposes

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Error deactivating account:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deactivating account'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount
};