// app/controllers/admin-login.controller.js
// AdminLoginController: Handles admin authentication

angular.module('motofyApp')
  .controller('AdminLoginController', ['$scope', '$location', 'ApiService', function($scope, $location, ApiService) {
    // AdminLoginController loaded successfully
    
    $scope.admin = {
      email: '',
      password: '',
      loading: false,
      error: ''
    };
    
    $scope.login = function() {
      if (!$scope.admin.email || !$scope.admin.password) {
        $scope.admin.error = 'Please fill in all fields';
        return;
      }
      
      $scope.admin.loading = true;
      $scope.admin.error = '';
      
      var loginData = {
        email: $scope.admin.email,
        password: $scope.admin.password
      };
      
      ApiService.adminLogin(loginData)
        .then(function(response) {
          // Admin login response received
          if (response.data && response.data.success) {
            // Store admin token
            localStorage.setItem('adminToken', response.data.token);
            localStorage.setItem('adminUser', JSON.stringify(response.data.admin));
            
            // Redirect to admin dashboard
            $location.path('/admin/dashboard');
          } else {
            $scope.admin.error = response.data.message || 'Login failed';
          }
          $scope.admin.loading = false;
        })
        .catch(function(error) {
          $scope.admin.error = error.data ? error.data.message : 'Login failed. Please try again.';
          $scope.admin.loading = false;
        });
    };
  }]);