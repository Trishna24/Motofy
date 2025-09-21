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
            console.log('🔍 Response status:', response.status);
            console.log('🔍 Response headers:', response.headers);
            console.log('🔍 Full response object keys:', Object.keys(response));
            
            // Log each key-value pair to understand the response structure
            Object.keys(response).forEach(function(key) {
              console.log('🔍 Response.' + key + ':', response[key]);
            });
            
            // Check if response.data exists and has the expected structure
            if (response.data && response.data.success) {
              console.log('✅ Payment verification successful');
              
              // Check if we have booking details (successful payment with booking created)
              if (response.data.bookingDetails) {
                console.log('🎉 Booking details found:', response.data.bookingDetails);
                $scope.paymentSuccess.bookingDetails = response.data.bookingDetails;
              } else {
                console.log('⚠️ Payment successful but no booking details found');
                console.log('🔍 Session payment status:', response.data.session ? response.data.session.payment_status : 'N/A');
                
                // If payment is successful but no booking details, show appropriate message
                if (response.data.session && response.data.session.payment_status === 'paid') {
                  $scope.paymentSuccess.error = 'Payment was successful, but there was an issue creating your booking. Please contact support with your session ID: ' + sessionId;
                } else {
                  $scope.paymentSuccess.error = 'Payment verification completed, but payment status is: ' + (response.data.session ? response.data.session.payment_status : 'unknown');
                }
              }
            } else {
              console.log('❌ Payment verification failed');
              console.log('🔍 Response.data exists:', !!response.data);
              console.log('🔍 Response.data.success:', response.data ? response.data.success : 'N/A');
              console.log('🔍 Response.data.message:', response.data ? response.data.message : 'N/A');
              
              $scope.paymentSuccess.error = (response.data && response.data.message) || 'Unable to verify payment - Invalid response format';
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