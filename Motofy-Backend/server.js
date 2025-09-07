const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const adminRoutes = require('./routes/adminRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const aiChatRoutes = require('./routes/aiChatRoutes');
// Load environment variables
dotenv.config();

// App setup
const app = express();

// Middlewares
// Allow all origins for development only
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//admin routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminUserRoutes);
// authentication
app.use('/api/auth', authRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Register car routes
const carRoutes = require('./routes/carRoutes');
app.use('/api/cars', carRoutes);

//ai chat
app.use('/api/ai-chat', aiChatRoutes);

//Booking Car
app.use('/api/bookings', bookingRoutes);

// Optional: Serve frontend from "public" folder
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

//payment
app.use('/api/payment', paymentRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
