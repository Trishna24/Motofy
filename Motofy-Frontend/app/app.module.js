// app/app.module.js
// Main AngularJS module for Motofy
 
angular.module('motofyApp', ['ngRoute'])
  .run(['$rootScope', '$location', function($rootScope, $location) {
    // MotofyApp module loaded successfully
    
    // Route change event handlers
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
      // Route change starting
    });
    
    $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
      // Route change successful
    });
    
    $rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
      // Route change error
    });
  }]);