const express = require('express');
const router = express.Router();
const {
  getAllCars,
  getCarById,
  addCar,
  updateCar,
  deleteCar,
} = require('../controllers/carController');
const upload = require('../middleware/upload');
const { body, validationResult } = require('express-validator');
const { adminProtect } = require('../middleware/authmiddleware');

// Validation middleware for car creation/update
const carValidation = [
  body('name').notEmpty().withMessage('Car name is required'),
  body('brand').notEmpty().withMessage('Brand is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('fuelType').notEmpty().withMessage('Fuel type is required'),
  body('seats').isNumeric().withMessage('Seats must be a number'),
  body('transmission').notEmpty().withMessage('Transmission is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

// Public routes
router.get('/', getAllCars);         // GET all cars
router.get('/:id', getCarById);      // GET car by ID

// Admin routes (assume only admin will use POST/PUT/DELETE)
router.post('/',adminProtect, upload.single('image'), carValidation, addCar);         // POST new car with image
router.put('/:id',adminProtect, upload.single('image'), carValidation, updateCar);    // PUT update car with optional new image
router.delete('/:id',adminProtect, deleteCar);                         // DELETE car by ID

module.exports = router;
