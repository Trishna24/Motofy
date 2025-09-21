// app/controllers/admin-login.controller.js
// AdminLoginController: Handles admin authentication

angular.module('motofyApp')
  .controller('AdminLoginController', ['ApiService', '$window', '$location', '$timeout', function(ApiService, $window, $location, $timeout) {
    console.log('🔐 AdminLoginController loaded successfully!');
    var vm = this;
    
    // Admin credentials
    vm.credentials = {
      username: '',
      password: ''
    };
    
    // UI state
    vm.loading = false;
    vm.error = '';
    vm.success = '';
    
    // Check if already logged in
    vm.checkAuth = function() {
      var adminToken = $window.localStorage.getItem('adminToken');
      if (adminToken) {
        // Redirect to admin dashboard if already logged in
        $location.path('/admin/dashboard');
      }
    };
    
    // Admin login
    vm.login = function() {
      vm.loading = true;
      vm.error = '';
      vm.success = '';
      
      // Call real admin login API
      ApiService.adminLogin(vm.credentials)
        .then(function(response) {
          console.log('Admin login response:', response);
          
          // Check if response has the expected structure
          if (response.data && response.data.admin && response.data.token) {
            // Store admin token and data
            $window.localStorage.setItem('adminToken', response.data.token);
            $window.localStorage.setItem('adminData', JSON.stringify({
              username: response.data.admin.username,
              id: response.data.admin.id,
              role: 'admin'
            }));
            
            vm.success = 'Login successful! Redirecting...';
            
            // Redirect to admin dashboard after short delay
            $timeout(function() {
              $location.path('/admin/dashboard');
            }, 1000);
          } else {
            throw new Error('Invalid response structure from server');
          }
        })
        .catch(function(error) {
          console.error('Admin login error:', error);
          vm.error = error.data?.message || error.message || 'Login failed. Please check your credentials.';
          vm.loading = false;
        });
    };
    
    // Initialize - check if already logged in
    vm.checkAuth();
  }]); 