// createAdmin.js
// Script to create an admin account in the database

const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin account already exists');
      process.exit(0);
    }

    // Create new admin account
    const admin = new Admin({
      username: 'admin',
      password: 'admin123' // This will be hashed automatically by the pre-save hook
    });

    await admin.save();
    console.log('Admin account created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin(); 