// middleware/upload.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Define storage settings
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    
    // Create specific folders based on field name
    if (file.fieldname === 'profilePicture') {
      uploadPath = 'uploads/profile-pictures/';
    } else if (file.fieldname === 'drivingLicense') {
      uploadPath = 'uploads/driving-licenses/';
    } else if (file.fieldname === 'image') {
      uploadPath = 'uploads/cars/';
    }
    
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// File filter to accept images and PDFs for driving license
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const allowedDocumentTypes = ['application/pdf'];
  
  if (file.fieldname === 'drivingLicense') {
    // Allow images and PDFs for driving license
    if (allowedImageTypes.includes(file.mimetype) || allowedDocumentTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpeg, .jpg, .png, or .pdf files are allowed for driving license'), false);
    }
  } else {
    // Only images for other fields (profile picture, car images)
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpeg, .jpg, or .png files are allowed'), false);
    }
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});

module.exports = upload;
