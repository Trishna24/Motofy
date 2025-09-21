// app/app.routes.js
// AngularJS route configuration for Motofy

angular.module('motofyApp')
  .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    // Setting up AngularJS routes
    
    $routeProvider
      .when('/', {
        templateUrl: 'app/views/main.html',
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
        templateUrl: 'app/views/cars.html',
        controller: 'CarController'
      })
      .when('/car/:id', {
        templateUrl: 'app/views/car-detail.html',
        controller: 'CarDetailController'
      })
      .when('/profile', {
        templateUrl: 'app/views/profile.html',
        controller: 'ProfileController'
      })
      .when('/bookings', {
        templateUrl: 'app/views/bookings.html',
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
        templateUrl: 'app/views/admin/login.html',
        controller: 'AdminLoginController'
      })
      .when('/admin/dashboard', {
        templateUrl: 'app/views/admin/dashboard.html',
        controller: 'AdminDashboardController'
      })
      .when('/admin/cars', {
        templateUrl: 'app/views/admin/cars.html',
        controller: 'AdminCarController'
      })
      .when('/admin/bookings', {
        templateUrl: 'app/views/admin/bookings.html',
        controller: 'AdminBookingController'
      })
      .when('/admin/users', {
        templateUrl: 'app/views/admin/users.html',
        controller: 'AdminUserController'
      })
      .otherwise({
        redirectTo: '/'
      });
    
    // Routes configured successfully
    $locationProvider.hashPrefix('');
  }]);