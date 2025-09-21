const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { googleLogin } = require('../controllers/googleAuthController');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Validation middleware for signup
const signupValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

// Validation middleware for login
const loginValidation = [
  body('loginInput').notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

// Rate limiter for signup and login (5 requests per minute per IP)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { success: false, message: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false, // Disable trust proxy validation since we handle it at app level
  },
});

router.post('/google-login', googleLogin);
router.post('/signup', authLimiter, signupValidation, registerUser);
router.post('/login', authLimiter, loginValidation, loginUser);

module.exports = router;
