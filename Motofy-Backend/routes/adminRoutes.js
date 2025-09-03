// routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const { loginAdmin } = require('../controllers/adminController');
const { adminProtect } = require('../middleware/authMiddleware');

// POST: Admin login
router.post('/login', loginAdmin);

module.exports = router;
