angular.module('motofyApp')
  .controller('PaymentSuccessController', ['$scope', '$location', '$routeParams', 'ApiService', 
    function($scope, $location, $routeParams, ApiService) {
      console.log('🎯 PaymentSuccessController initialized');
      console.log('📋 Route params:', $routeParams);
      console.log('🔗 Current URL:', $location.url());
      
      $scope.paymentSuccess = {
        bookingDetails: null,
        loading: true,
        error: null
      };

      // Get session_id from URL parameters
      var sessionId = $routeParams.session_id;
      console.log('🔑 Session ID from URL:', sessionId);
      
      if (sessionId) {
        console.log('✅ Session ID found, calling verification API...');
        
        // Verify payment and get booking details
        ApiService.verifyPaymentSession(sessionId)
          .then(function(response) {
            console.log('📨 API Response received:', response);
            console.log('📊 Response data:', response.data);
            
            if (response.data.success) {
              console.log('✅ Payment verification successful');
              $scope.paymentSuccess.bookingDetails = response.data.bookingDetails;
            } else {
              console.log('❌ Payment verification failed:', response.data.message);
              $scope.paymentSuccess.error = response.data.message || 'Unable to verify payment';
            }
            $scope.paymentSuccess.loading = false;
          })
          .catch(function(error) {
            console.error('❌ Payment verification API error:', error);
            console.error('📊 Error details:', {
              status: error.status,
              statusText: error.statusText,
              data: error.data,
              config: error.config
            });
            
            $scope.paymentSuccess.error = 'Error verifying payment. Please contact support.';
            $scope.paymentSuccess.loading = false;
          });
      } else {
        console.log('❌ No session ID found in URL parameters');
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