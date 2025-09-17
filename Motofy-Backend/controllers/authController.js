const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// REGISTER user
const registerUser = async (req, res) => {
  const { username, email, password, phone } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required' });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phone: phone || undefined, // Only set if provided
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ success: false, message: 'Error registering user. Please try again later.' });
  }
};

// LOGIN user (email OR username)
const loginUser = async (req, res) => {
  const { loginInput, password } = req.body;

  if (!loginInput || !password) {
    return res.status(400).json({ message: 'Login input and password are required' });
  }

  try {
    const user = await User.findOne({
      $or: [{ email: loginInput }, { username: loginInput }],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.password) {
      return res.status(401).json({ message: 'Password login not available for this account' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      appToken: token,   // Include token here
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Error logging in. Please try again later.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
