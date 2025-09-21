// app/app.routes.js
// AngularJS route configuration for Motofy

angular.module('motofyApp')
  .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    // Setting up AngularJS routes
    
    $routeProvider
      .when('/', {
        templateUrl: 'app/views/home.html',
        controller: 'MainController'
      })
      .when('/login', {
        templateUrl: 'app/views/login.html',
        controller: 'LoginController'
      })
      .when('/register', {
        templateUrl: 'app/views/register.html',
        controller: 'RegisterController'
      })
      .when('/cars', {
        templateUrl: 'app/views/car-list.html',
        controller: 'CarController'
      })
      .when('/car/:id', {
        templateUrl: 'app/views/car-detail.html',
        controller: 'CarController'
      })
      .when('/profile', {
        templateUrl: 'app/views/profile.html',
        controller: 'ProfileController'
      })
      .when('/bookings', {
        templateUrl: 'app/views/booking.html',
        controller: 'BookingController'
      })
      .when('/payment/success', {
        templateUrl: 'app/views/payment-success.html',
        controller: 'PaymentSuccessController'
      })
      .when('/payment/cancel', {
        templateUrl: 'app/views/payment-cancel.html',
        controller: 'PaymentCancelController'
      })
      .when('/admin/login', {
        templateUrl: 'app/views/admin-login.html',
        controller: 'AdminLoginController'
      })
      .when('/admin/dashboard', {
        templateUrl: 'app/views/admin-dashboard.html',
        controller: 'AdminDashboardController'
      })
      .when('/admin/cars', {
        templateUrl: 'app/views/admin-dashboard.html',
        controller: 'AdminCarController'
      })
      .when('/admin/bookings', {
        templateUrl: 'app/views/admin-dashboard.html',
        controller: 'AdminBookingController'
      })
      .when('/admin/users', {
        templateUrl: 'app/views/admin-dashboard.html',
        controller: 'AdminUserController'
      })
      .otherwise({
        redirectTo: '/'
      });
    
    // Routes configured successfully
    $locationProvider.hashPrefix('');
  }]);