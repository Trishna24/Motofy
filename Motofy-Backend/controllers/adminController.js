// controllers/adminController.js

const Admin = require('../models/Admin');

// @desc    Admin login
const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token for admin
    const token = require('jsonwebtoken').sign(
      { adminId: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      admin: {
        id: admin._id,
        username: admin.username,
      },
      token,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Error logging in as admin. Please try again later.' });
  }
};

module.exports = {
  loginAdmin,
};
