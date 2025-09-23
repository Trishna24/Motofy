// app/config/config.js
// Environment-based configuration for API endpoints

(function() {
  'use strict';
  
  // Create configuration object
  var CONFIG = {
    // Automatically detect environment and set appropriate API URL
    API_BASE_URL: (function() {
      var hostname = window.location.hostname;
      var protocol = window.location.protocol;
      
      // Local development
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
      }
      
      // Production (Vercel deployment)
      return 'https://motofy-l5gq.onrender.com/api';
    })(),
    
    // File upload URLs
    UPLOADS_BASE_URL: (function() {
      var hostname = window.location.hostname;
      
      // Local development
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000/uploads';
      }
      
      // Production
      return 'https://motofy-l5gq.onrender.com/uploads';
    })()
  };

  // Register the constant with the AngularJS module immediately
  angular.module('motofyApp').constant('CONFIG', CONFIG);
  
  console.log('🌐 Environment detected - API Base URL:', CONFIG.API_BASE_URL);
  console.log('📁 Uploads Base URL:', CONFIG.UPLOADS_BASE_URL);
})();