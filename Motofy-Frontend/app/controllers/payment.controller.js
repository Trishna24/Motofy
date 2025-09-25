angular.module('motofyApp')
  .controller('PaymentSuccessController', ['$scope', '$routeParams', '$location', 'ApiService', 
    function($scope, $routeParams, $location, ApiService) {
      
      $scope.paymentSuccess = {
        bookingDetails: null,
        loading: true,
        error: null
      };

      // Get session_id from URL parameters
      var sessionId = $routeParams.session_id;
      
      if (sessionId) {
        ApiService.verifyPaymentSession(sessionId)
          .then(function(response) {
            if (response.data && response.data.success) {
              
              // Check if we have booking details (successful payment with booking created)
              if (response.data.bookingDetails) {
                $scope.paymentSuccess.bookingDetails = response.data.bookingDetails;
              } else {
                // Payment successful but no booking details
              }
              
              $scope.paymentSuccess.isSuccess = true;
              $scope.paymentSuccess.message = response.data.message || 'Payment completed successfully!';
              
            } else {
              // Payment verification failed
              $scope.paymentSuccess.isSuccess = false;
              $scope.paymentSuccess.message = response.data ? response.data.message : 'Payment verification failed';
            }
            $scope.paymentSuccess.loading = false;
          })
          .catch(function(error) {
            $scope.paymentSuccess.isSuccess = false;
            $scope.paymentSuccess.message = 'Error verifying payment. Please contact support.';
            $scope.paymentSuccess.loading = false;
          });
      } else {
        // No session ID found
        $scope.paymentSuccess.isSuccess = false;
        $scope.paymentSuccess.message = 'Invalid payment session. Please try again.';
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