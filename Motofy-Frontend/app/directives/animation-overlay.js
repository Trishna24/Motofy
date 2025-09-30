angular.module('motofyApp')
  .directive('animationOverlay', ['OverlayService', function(OverlayService) {
    return {
      restrict: 'E',
      template:
        '<div class="animation-overlay" ng-if="overlay.active">' +
          '<div class="overlay-content">' +
            '<div class="overlay-message">{{ overlay.messages[overlay.currentIndex] }}</div>' +
          '</div>' +
        '</div>',
      link: function(scope) {
        scope.overlay = OverlayService;
      }
    };
  }]);