// routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const { loginAdmin } = require('../controllers/adminController');
const { getAllCarsForAdmin } = require('../controllers/carController');
const { adminProtect } = require('../middleware/authMiddleware');

// POST: Admin login
router.post('/login', loginAdmin);

// GET: Get all cars for admin (all statuses)
router.get('/cars', adminProtect, getAllCarsForAdmin);

module.exports = router;
