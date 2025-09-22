// controllers/carController.js
const fs = require('fs');
const path = require('path');
const Car = require('../models/Car');


// @desc Get all cars for users (only available cars)
const getAllCars = async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    
    // For regular users and guests, only return cars with status "available"
    // Also handle cars that don't have status field (legacy data)
    let cars = await Car.find({ 
      $or: [
        { status: "available" },
        { status: { $exists: false } },
        { status: null }
      ]
    });
    
    // If user is authenticated, check for confirmed bookings to conditionally include carNumber
    if (req.user) {
      const userConfirmedBookings = await Booking.find({
        user: req.user._id,
        status: 'Confirmed'
      }).select('car');
      
      const confirmedCarIds = userConfirmedBookings.map(booking => booking.car.toString());
      
      // Transform cars to conditionally include carNumber
      cars = cars.map(car => {
        const carObj = car.toObject();
        if (!confirmedCarIds.includes(car._id.toString())) {
          delete carObj.carNumber;
        }
        return carObj;
      });
    } else {
      // For non-authenticated users, remove carNumber from all cars
      cars = cars.map(car => {
        const carObj = car.toObject();
        delete carObj.carNumber;
        return carObj;
      });
    }
    
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ success: false, message: 'Error fetching cars from database. Please try again later.' });
  }
};

// @desc Get all cars for admin (all cars regardless of status)
const getAllCarsForAdmin = async (req, res) => {
  try {
    // Return all cars with their current status for admin
    const cars = await Car.find();
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars for admin:', error);
    res.status(500).json({ success: false, message: 'Error fetching cars from database. Please try again later.' });
  }
};

// @desc Get single car by ID
const getCarById = async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });
    
    let carObj = car.toObject();
    
    // If user is authenticated, check for confirmed bookings to conditionally include carNumber
    if (req.user) {
      const userConfirmedBooking = await Booking.findOne({
        user: req.user._id,
        car: req.params.id,
        status: 'Confirmed'
      });
      
      // If user doesn't have a confirmed booking for this car, remove carNumber
      if (!userConfirmedBooking) {
        delete carObj.carNumber;
      }
    } else {
      // For non-authenticated users, remove carNumber
      delete carObj.carNumber;
    }
    
    res.json(carObj);
  } catch (error) {
    console.error('Error fetching car by ID:', error);
    res.status(500).json({ success: false, message: 'Error fetching car details. Please try again later.' });
  }
};

// @desc Add a new car (with optional image)
const addCar = async (req, res) => {
  try {
    const { name, brand, price, fuelType, seats, transmission, description, carNumber } = req.body;

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
      carNumber,
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
    const { name, brand, price, fuelType, seats, transmission, description, carNumber } = req.body;
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
    car.carNumber = carNumber || car.carNumber;

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


// @desc   Get car analytics for admin dashboard
const getCarAnalytics = async (req, res) => {
  try {
    const { timeFilter = 'all' } = req.query;
    const Booking = require('../models/Booking');
    
    // Define date ranges based on filter
    const now = new Date();
    let dateFilter = {};
    
    switch (timeFilter) {
      case 'today':
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        dateFilter = { createdAt: { $gte: startOfDay, $lt: endOfDay } };
        break;
      case 'week':
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { createdAt: { $gte: startOfWeek } };
        break;
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { createdAt: { $gte: startOfMonth } };
        break;
      case 'all':
      default:
        dateFilter = {};
        break;
    }
    
    // Get basic car stats
    const totalCars = await Car.countDocuments();
    const availableCars = await Car.countDocuments({ availability: true });
    const unavailableCars = totalCars - availableCars;
    
    // Get car bookings data
    const totalBookings = await Booking.countDocuments(dateFilter);
    const carsWithBookings = await Booking.distinct('car', dateFilter);
    const bookedCarsCount = carsWithBookings.length;
    const utilizationRate = totalCars > 0 ? (bookedCarsCount / totalCars * 100).toFixed(1) : 0;
    
    // Get most popular cars by booking count
    const popularCars = await Booking.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$car',
          bookingCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'cars',
          localField: '_id',
          foreignField: '_id',
          as: 'carDetails'
        }
      },
      {
        $unwind: '$carDetails'
      },
      {
        $project: {
          name: '$carDetails.name',
          brand: '$carDetails.brand',
          image: '$carDetails.image',
          bookingCount: 1,
          totalRevenue: 1
        }
      },
      {
        $sort: { bookingCount: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    // Get highest revenue generating cars
    const topRevenueCars = await Booking.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: '$car',
          totalRevenue: { $sum: '$totalAmount' },
          bookingCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'cars',
          localField: '_id',
          foreignField: '_id',
          as: 'carDetails'
        }
      },
      {
        $unwind: '$carDetails'
      },
      {
        $project: {
          name: '$carDetails.name',
          brand: '$carDetails.brand',
          price: '$carDetails.price',
          totalRevenue: 1,
          bookingCount: 1,
          avgRevenuePerBooking: { $divide: ['$totalRevenue', '$bookingCount'] }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    // Get car distribution by brand
    const carsByBrand = await Car.aggregate([
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 },
          availableCount: {
            $sum: {
              $cond: [{ $eq: ['$availability', true] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Get car distribution by fuel type
    const carsByFuelType = await Car.aggregate([
      {
        $group: {
          _id: '$fuelType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Get car distribution by transmission
    const carsByTransmission = await Car.aggregate([
      {
        $group: {
          _id: '$transmission',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Get booking trends by car for the last 12 months
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          bookingCount: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Format booking trends
    const bookingsByMonth = bookingTrends.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      bookings: item.bookingCount,
      revenue: item.revenue
    }));
    
    // Get underperforming cars (cars with no bookings in the time period)
    const carsWithNoBookings = await Car.find({
      _id: { $nin: carsWithBookings }
    }).select('name brand price availability').limit(10);
    
    // Car availability distribution for pie chart
    const availabilityDistribution = [
      { status: 'Available', count: availableCars, color: '#28a745' },
      { status: 'Unavailable', count: unavailableCars, color: '#dc3545' }
    ];
    
    const carAnalytics = {
      totalCars,
      availableCars,
      unavailableCars,
      bookedCarsCount,
      utilizationRate,
      popularCars,
      topRevenueCars,
      carsByBrand,
      carsByFuelType,
      carsByTransmission,
      bookingsByMonth,
      carsWithNoBookings,
      availabilityDistribution,
      timeFilter
    };
    
    res.json(carAnalytics);
  } catch (error) {
    console.error('Error fetching car analytics:', error);
    res.status(500).json({ success: false, message: 'Error fetching car analytics. Please try again later.' });
  }
};

// @desc Toggle car availability
const toggleCarAvailability = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Toggle the availability status
    car.availability = !car.availability;
    await car.save();

    res.json({ 
      message: `Car ${car.availability ? 'made available' : 'made unavailable'} successfully`,
      availability: car.availability 
    });
  } catch (error) {
    console.error('Error toggling car availability:', error);
    res.status(500).json({ success: false, message: 'Error updating car availability. Please try again later.' });
  }
};

// @desc Update car status (Admin only)
const updateCarStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const carId = req.params.id;

    // Validate status
    const validStatuses = ['available', 'booked', 'maintenance'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Valid statuses are: available, booked, maintenance' 
      });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Update car status
    car.status = status;
    await car.save();

    res.json({ 
      message: `Car status updated to ${status} successfully`,
      car: car
    });
  } catch (error) {
    console.error('Error updating car status:', error);
    res.status(500).json({ success: false, message: 'Error updating car status. Please try again later.' });
  }
};

module.exports = {
  getAllCars,
  getAllCarsForAdmin,
  getCarById,
  addCar,
  updateCar,
  deleteCar,
  getCarAnalytics,
  toggleCarAvailability,
  updateCarStatus
};
