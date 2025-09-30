angular.module('motofyApp')
  .service('OverlayService', ['$timeout', '$interval', '$rootScope', function($timeout, $interval, $rootScope) {
    var svc = {
      active: false,
      type: null,
      messages: [],
      currentIndex: 0,
      onComplete: null,
      show: function(typeOrOptions, msgs, duration, cb) {
        var opts = {};
        if (typeof typeOrOptions === 'object') {
          opts = typeOrOptions;
        } else {
          opts = { type: typeOrOptions, messages: msgs, duration: duration, onComplete: cb };
        }

        if (svc.active) { return; }

        svc.type = opts.type || 'info';
        svc.messages = Array.isArray(opts.messages) ? opts.messages : [];
        svc.currentIndex = 0;
        svc.onComplete = typeof opts.onComplete === 'function' ? opts.onComplete : null;
        svc.active = true;
        $rootScope.$applyAsync();

        var cycleInterval = null;
        if (svc.messages.length > 1) {
          cycleInterval = $interval(function() {
            svc.currentIndex = (svc.currentIndex + 1) % svc.messages.length;
          }, 900);
        }

        $timeout(function() {
          if (cycleInterval) { $interval.cancel(cycleInterval); }
          svc.active = false;
          $rootScope.$applyAsync();
          try {
            if (svc.onComplete) { svc.onComplete(); }
          } catch (e) {}
          svc.type = null; svc.messages = []; svc.currentIndex = 0; svc.onComplete = null;
        }, opts.duration || 2000);
      },
      hide: function() {
        svc.active = false;
        svc.type = null;
        svc.messages = [];
        svc.currentIndex = 0;
        svc.onComplete = null;
        $rootScope.$applyAsync();
      }
    };

    return svc;
  }]);