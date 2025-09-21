// app/controllers/auth.controller.js
// AuthController: Handles user login and signup

angular.module('motofyApp')
  .controller('AuthController', ['ApiService', '$window', '$location', function(ApiService, $window, $location) {
    var vm = this;
    vm.loginData = {};
    vm.signupData = {};
    vm.error = '';
    vm.success = '';

    // User Login
    vm.login = function() {
      vm.error = '';
      vm.success = '';
      
      ApiService.login(vm.loginData)
        .then(function(response) {
          // Store token and update UI
          $window.localStorage.setItem('appToken', response.data.appToken);
          vm.success = 'Login successful!';
          if ($window.location && $window.location.reload) {
            $window.location.reload();
          }
          if (typeof main !== 'undefined' && main.closeModal) {
            main.closeModal();
          }
        })
        .catch(function(err) {
          vm.error = (err.data && err.data.message) ? err.data.message : 'Login failed. Please try again.';
        });
    };

    // User Signup
    vm.signup = function() {
      vm.error = '';
      vm.success = '';
      
      // Gmail validation
      const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!gmailRegex.test(vm.signupData.email)) {
        vm.error = 'Only valid Gmail addresses are allowed.';
        return;
      }
      
      ApiService.signup(vm.signupData)
        .then(function(response) {
          // After signup, automatically log in the user
          ApiService.login({ loginInput: vm.signupData.email, password: vm.signupData.password })
            .then(function(loginResponse) {
              $window.localStorage.setItem('appToken', loginResponse.data.appToken);
              vm.success = 'Signup and login successful!';
              if ($window.location && $window.location.reload) {
                $window.location.reload();
              }
              if (typeof main !== 'undefined' && main.closeModal) {
                main.closeModal();
              }
            })
            .catch(function(loginErr) {
              vm.error = (loginErr.data && loginErr.data.message) ? loginErr.data.message : 'Signup succeeded but login failed.';
            });
        })
        .catch(function(err) {
          vm.error = (err.data && err.data.message) ? err.data.message : 'Signup failed. Please try again.';
        });
    };
  }])
  .controller('LoginController', ['ApiService', '$window', '$location', function(ApiService, $window, $location) {
    var vm = this;
    vm.credentials = {};
    vm.error = '';
    
    vm.login = function() {
      vm.error = '';
      
      ApiService.login(vm.credentials)
        .then(function(response) {
          $window.localStorage.setItem('appToken', response.data.appToken);
          $location.path('/');
        })
        .catch(function(err) {
          vm.error = (err.data && err.data.message) ? err.data.message : 'Login failed. Please try again.';
        });
    };
  }])
  .controller('RegisterController', ['ApiService', '$window', '$location', function(ApiService, $window, $location) {
    var vm = this;
    vm.userData = {};
    vm.error = '';
    vm.success = '';
    
    vm.register = function() {
      vm.error = '';
      vm.success = '';
      
      ApiService.signup(vm.userData)
        .then(function(response) {
          vm.success = 'Registration successful! Please login.';
          setTimeout(function() {
            $location.path('/login');
          }, 2000);
        })
        .catch(function(err) {
          vm.error = (err.data && err.data.message) ? err.data.message : 'Registration failed. Please try again.';
        });
    };
  }]);