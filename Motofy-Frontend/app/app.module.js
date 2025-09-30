// app/app.module.js
// Main AngularJS module for Motofy
 
angular.module('motofyApp', ['ngRoute', 'ngFileUpload'])
  .filter('nl2br', function() {
    return function(text) {
      if (!text) return text;
      return text.replace(/\n/g, '<br>');
    };
  })
  .run(['$rootScope', '$location', function($rootScope, $location) {
    console.log('🚀 MotofyApp module loaded successfully!');

    // Helper to decide whether background video should be visible
    function computeVideoVisibilityFromOriginalPath(originalPath) {
      // Visible on home and car list; hidden elsewhere (including car detail)
      return originalPath === '/' || originalPath === '/cars';
    }

    function updateVideoVisibilityUsingCurrentPath() {
      var path = $location.path();
      // Convert actual path to an originalPath-like value for simple checks
      // e.g., '/cars/123' should not show the video
      var isHome = path === '/';
      var isCarList = path === '/cars';
      $rootScope.showBgVideo = (isHome || isCarList);
    }

    // Initial state on app load
    updateVideoVisibilityUsingCurrentPath();

    // Debug route changes and update video visibility
    $rootScope.$on('$routeChangeStart', function(event, next) {
      console.log('🔄 Route change starting:', next ? next.originalPath : 'unknown');
      if (next && next.originalPath) {
        $rootScope.showBgVideo = computeVideoVisibilityFromOriginalPath(next.originalPath);
      } else {
        updateVideoVisibilityUsingCurrentPath();
      }
    });

    $rootScope.$on('$routeChangeSuccess', function(event, current) {
      console.log('✅ Route change successful:', current ? current.originalPath : 'unknown');
      if (current && current.originalPath) {
        $rootScope.showBgVideo = computeVideoVisibilityFromOriginalPath(current.originalPath);
      } else {
        updateVideoVisibilityUsingCurrentPath();
      }
    });

    $rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
      console.log('❌ Route change error:', rejection);
    });
  }]);