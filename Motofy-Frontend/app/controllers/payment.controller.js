angular.module('motofyApp')
  .controller('PaymentSuccessController', ['$scope', '$location', '$routeParams', 'ApiService', 
    function($scope, $location, $routeParams, ApiService) {
      $scope.paymentSuccess = {
        bookingDetails: null,
        loading: true,
        error: null
      };

      // Get session_id from URL parameters
      var sessionId = $routeParams.session_id;
      
      if (sessionId) {
        // Verify payment and get booking details
        ApiService.verifyPaymentSession(sessionId)
          .then(function(response) {
            if (response.data.success) {
              $scope.paymentSuccess.bookingDetails = response.data.bookingDetails;
            } else {
              $scope.paymentSuccess.error = response.data.message || 'Unable to verify payment';
            }
            $scope.paymentSuccess.loading = false;
          })
          .catch(function(error) {
            console.error('Payment verification error:', error);
            $scope.paymentSuccess.error = 'Error verifying payment. Please contact support.';
            $scope.paymentSuccess.loading = false;
          });
      } else {
        $scope.paymentSuccess.error = 'No payment session found';
        $scope.paymentSuccess.loading = false;
      }
    }
  ])
  .controller('PaymentCancelController', ['$scope', '$location', 
    function($scope, $location) {
      // Simple controller for payment cancel page
      $scope.paymentCancel = {
        message: 'Your payment was cancelled.'
      };
    }
  ]);