angular.module('motofyApp')
  .constant('AppConfig', {
    // Backend API Configuration
    API: {
      BASE_URL: 'https://motofy-l5gq.onrender.com',
      ENDPOINTS: {
        AUTH: '/auth',
        ADMIN: '/admin',
        CARS: '/cars',
        BOOKINGS: '/bookings',
        PROFILE: '/profile',
        PAYMENT: '/payment',
        AI_CHAT: '/ai-chat',
        WEBHOOKS: '/webhooks'
      }
    },
    
    // Environment Configuration
    ENVIRONMENT: 'production', // 'development', 'staging', 'production'
    
    // Feature Flags
    FEATURES: {
      AI_CHAT_ENABLED: true,
      GOOGLE_AUTH_ENABLED: true,
      STRIPE_PAYMENTS_ENABLED: true,
      DEBUG_MODE: false
    },
    
    // UI Configuration
    UI: {
      ITEMS_PER_PAGE: 10,
      MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
      ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
      TOAST_DURATION: 3000
    },
    
    // Validation Rules
    VALIDATION: {
      PASSWORD_MIN_LENGTH: 6,
      PHONE_PATTERN: /^[0-9]{10}$/,
      EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  });