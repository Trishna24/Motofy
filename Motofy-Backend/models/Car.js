// models/Car.js

const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    fuelType: {
      type: String,
      required: true,
    },
    seats: {
      type: Number,
      required: true,
    },
    transmission: {
      type: String,
      required: true,
    },
    carNumber: {
      type: String,
      required: true,
    },
    image: {
      type: String, // Stores filename of the uploaded image
      default: '',
    },
    description: {
      type: String,
    },
    carNumber: {
      type: String,
      required: true,
      unique: true,
    },
    availability: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Car = mongoose.model('Car', carSchema);

module.exports = Car;
