// controllers/carController.js
const fs = require('fs');
const path = require('path');
const Car = require('../models/Car');


// @desc Get all cars
const getAllCars = async (req, res) => {
  try {
    const cars = await Car.find();
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ success: false, message: 'Error fetching cars from database. Please try again later.' });
  }
};

// @desc Get single car by ID
const getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });
    res.json(car);
  } catch (error) {
    console.error('Error fetching car by ID:', error);
    res.status(500).json({ success: false, message: 'Error fetching car details. Please try again later.' });
  }
};

// @desc Add a new car (with optional image)
const addCar = async (req, res) => {
  try {
    const { name, brand, price, fuelType, seats, transmission, description } = req.body;

    // Check if car with same name and brand already exists
    const existingCar = await Car.findOne({ name, brand });
    if (existingCar) {
      // If an image was uploaded, delete it
      if (req.file) {
        const imagePath = path.join(__dirname, '..', 'uploads', req.file.filename);
        fs.unlink(imagePath, (err) => {
          if (err) console.error('Failed to delete unused image:', err);
        });
      }
      return res.status(400).json({ message: 'Car with same name and brand already exists' });
    }

    const newCar = new Car({
      name,
      brand,
      price,
      fuelType,
      seats,
      transmission,
      description,
      image: req.file ? req.file.filename : '', // Optional image
    });

    await newCar.save();
    res.status(201).json({ message: 'Car added successfully' });
  } catch (error) {
    console.error('Error adding new car:', error);
    res.status(500).json({ success: false, message: 'Error adding new car. Please try again later.' });
  }
};


// @desc Update car by ID
const updateCar = async (req, res) => {
  try {
    const { name, brand, price, fuelType, seats, transmission, description } = req.body;
    const car = await Car.findById(req.params.id);

    if (!car) return res.status(404).json({ message: 'Car not found' });

    // Update fields
    car.name = name || car.name;
    car.brand = brand || car.brand;
    car.price = price || car.price;
    car.fuelType = fuelType || car.fuelType;
    car.seats = seats || car.seats;
    car.transmission = transmission || car.transmission;
    car.description = description || car.description;

    // Handle new image
    if (req.file) {
      // Delete old image from uploads folder
      if (car.image) {
        const oldImagePath = path.join(__dirname, '..', 'uploads', car.image);
        fs.unlink(oldImagePath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error('Failed to delete old image:', err);
          } else if (err && err.code === 'ENOENT') {
            console.warn('Old image file not found, nothing to delete.');
          }
        });
      }
      // Set new image filename
      car.image = req.file.filename;
    }

    await car.save();
    res.json({ message: 'Car updated successfully' });
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ success: false, message: 'Error updating car. Please try again later.' });
  }
};


// @desc Delete car by ID
const deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    // Delete image from uploads
    if (car.image) {
      const imagePath = path.join(__dirname, '..', 'uploads', car.image);
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Failed to delete image:', err);
      });
    }

    await Car.findByIdAndDelete(req.params.id);
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ success: false, message: 'Error deleting car. Please try again later.' });
  }
};


module.exports = {
  getAllCars,
  getCarById,
  addCar,
  updateCar,
  deleteCar,
};
