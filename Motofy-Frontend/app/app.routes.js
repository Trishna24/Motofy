// app/app.routes.js
// AngularJS route configuration for Motofy

angular.module('motofyApp')
  .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    console.log('🔧 Setting up AngularJS routes...');
    
    // Use hash mode for better compatibility
    $locationProvider.hashPrefix('');
    
    $routeProvider
      .when('/', {
        templateUrl: 'app/views/home.html',
        controller: 'MainController',
        controllerAs: 'main'
      })
      .when('/cars', {
        templateUrl: 'app/views/car-list.html',
        controller: 'CarController',
        controllerAs: 'car'
      })
      .when('/cars/:id', {
        templateUrl: 'app/views/car-detail.html',
        controller: 'CarController',
        controllerAs: 'car'
      })
      .when('/bookings', {
        templateUrl: 'app/views/booking.html',
        controller: 'BookingController',
        controllerAs: 'booking'
      })
      .when('/admin/login', {
        templateUrl: 'app/views/admin-login.html',
        controller: 'AdminLoginController',
        controllerAs: 'adminLogin'
      })
      .when('/admin/dashboard', {
        templateUrl: 'app/views/admin-dashboard.html',
        controller: 'AdminDashboardController',
        controllerAs: 'adminDashboard'
      })
      .when('/ai-chat', {
        templateUrl: 'app/views/ai-chat.html',
        controller: 'AIController',
        controllerAs: 'ai'
      })
      .otherwise({
        redirectTo: '/'
      });
      
      
    console.log('✅ Routes configured successfully');
  }]); 