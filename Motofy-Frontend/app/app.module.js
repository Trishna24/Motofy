// app/app.module.js
// Main AngularJS module for Motofy
 
angular.module('motofyApp', ['ngRoute', 'ngFileUpload'])
  .run(['$rootScope', function($rootScope) {
    console.log('🚀 MotofyApp module loaded successfully!');
    
    // Debug route changes
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
      console.log('🔄 Route change starting:', next ? next.originalPath : 'unknown');
    });
    
    $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
      console.log('✅ Route change successful:', current ? current.originalPath : 'unknown');
    });
    
    $rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
      console.log('❌ Route change error:', rejection);
    });
  }]);