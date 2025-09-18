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

    // Gmail validation - Google Auth should only allow Gmail accounts
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      return res.status(400).json({ message: 'Only valid Gmail addresses are allowed.' });
    }

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
    } else {
      // Check if existing user account is deactivated
      if (user.status === 'inactive' || user.status === 'suspended') {
        return res.status(403).json({ 
          message: 'Your account has been deactivated. Please contact us to activate your account.',
          accountStatus: user.status
        });
      }
    }

    // Generate your app's JWT token
    const appToken = jwt.sign(
      { id: user._id, email: user.email },
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
