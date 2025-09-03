const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload; // sub is Google user ID

    // Find or create user
    let user = await User.findOne({ googleId: sub });

    if (!user) {
      user = new User({
        googleId: sub,
        email,
        username: name.replace(/\s+/g, '').toLowerCase(),
        profilePic: picture,
      });

      await user.save();
    }

    // Generate your app's JWT token
    const appToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google login successful',
      token: appToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        profilePic: user.profilePic,
      },
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ success: false, message: 'Error logging in with Google. Please try again later.' });
  }
};

module.exports = {
  googleLogin,
};
