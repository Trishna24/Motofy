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
      
      // Gmail validation - only validate if loginInput is an email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(vm.loginData.loginInput)) {
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailRegex.test(vm.loginData.loginInput)) {
          vm.error = 'Invalid Email. Please use a Gmail ID.';
          return;
        }
      }
      
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
  }]);