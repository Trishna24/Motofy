const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car',
      required: true,
    },
    pickupDate: {
      type: Date,
      required: true,
    },
    dropoffDate: {
      type: Date,
      required: true,
    },
    pickupLocation: {
      type: String,
      required: true,
    },
    dropoffLocation: {
      type: String,
      required: false,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
      default: 'Pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentSessionId: {
      type: String,
      default: null,
    },
    stripeSessionId: {
      type: String,
      default: null,
    },
    paymentMethod: {
      type: String,
      default: 'stripe',
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
