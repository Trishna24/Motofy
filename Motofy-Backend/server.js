const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const adminRoutes = require('./routes/adminRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const aiChatRoutes = require('./routes/aiChatRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
// Load environment variables
dotenv.config();

// App setup
const app = express();

// Middlewares
// Allow specific Vercel origins
app.use(cors({
  origin: [
    "https://motofy-tau.vercel.app",
    "https://motofy-q4sttdxby-trishnas-projects-5abdc8ba.vercel.app"
  ],
  credentials: true,
}));

// Webhook routes MUST come before JSON body parser
app.use('/api/webhook', webhookRoutes);

// Increase payload size limits for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//admin routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminUserRoutes);
// authentication
app.use('/api/auth', authRoutes);
// profile management
app.use('/api/profile', profileRoutes);

console.log('🚀 Profile routes registered at /api/profile');

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
