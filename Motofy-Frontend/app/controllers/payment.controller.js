angular.module('motofyApp')
  .controller('PaymentSuccessController', ['$scope', '$routeParams', '$location', 'ApiService', function($scope, $routeParams, $location, ApiService) {
    // Payment success controller initialization
    
    $scope.paymentStatus = 'verifying';
    $scope.bookingDetails = null;
    $scope.errorMessage = '';
    
    // Get session ID from URL parameters
    var sessionId = $routeParams.session_id;
    
    if (sessionId) {
      // Session ID found, calling verification API
      
      // Call the API to verify payment
      ApiService.verifyPaymentSession(sessionId)
        .then(function(response) {
          // API Response received
          
          if (response.data && response.data.success) {
            // Payment verification successful
            $scope.paymentStatus = 'success';
            
            if (response.data.bookingDetails) {
              // Booking details found
              $scope.bookingDetails = response.data.bookingDetails;
            } else {
              // Payment successful but no booking details found
              $scope.errorMessage = 'Payment successful but booking details not found.';
            }
          } else {
            // Payment verification failed
            $scope.paymentStatus = 'failed';
            $scope.errorMessage = response.data ? response.data.message : 'Payment verification failed';
          }
        })
        .catch(function(error) {
          // Error occurred during API call
          $scope.paymentStatus = 'failed';
          $scope.errorMessage = 'Error verifying payment: ' + (error.data ? error.data.message : error.message);
        });
    } else {
      // No session ID found in URL parameters
      $scope.paymentStatus = 'failed';
      $scope.errorMessage = 'No payment session ID found';
    }
  }])
  .controller('PaymentCancelController', ['$scope', '$location', 
    function($scope, $location) {
      // Simple controller for payment cancel page
      $scope.paymentCancel = {
        message: 'Your payment was cancelled.'
      };
    }
  ]);