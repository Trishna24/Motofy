// app/controllers/auth.controller.js
// AuthController: Handles user login and signup

angular.module('motofyApp')
  .controller('AuthController', ['ApiService', '$window', '$location', 'OverlayService', function(ApiService, $window, $location, OverlayService) {
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
          OverlayService.show('login', [
            '🔑 Verifying your credentials...',
            '🚗 Starting your Motofy engine...',
            '✅ Welcome back!'
          ], 2300, function() {
            if ($window.location && $window.location.reload) {
              $window.location.reload();
            }
            if (typeof main !== 'undefined' && main.closeModal) {
              try { main.closeModal(); } catch(e) {}
            }
          });
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
              OverlayService.show('login', [
                '🔐 Creating your account...',
                '🚗 Prepping your Motofy ride...',
                '✅ Welcome aboard!'
              ], 2300, function() {
                if ($window.location && $window.location.reload) {
                  $window.location.reload();
                }
                if (typeof main !== 'undefined' && main.closeModal) {
                  try { main.closeModal(); } catch(e) {}
                }
              });
            })
            .catch(function(loginErr) {
              vm.error = (loginErr.data && loginErr.data.message) ? loginErr.data.message : 'Signup succeeded but login failed.';
            });
        })
        .catch(function(err) {
          vm.error = (err.data && err.data.message) ? err.data.message : 'Signup failed. Please try again.';
        });
    };

    // Google Sign-In
    vm.googleSignIn = function() {
      vm.error = '';
      vm.success = '';
      
      // Check if Google Sign-In is loaded
      if (typeof google === 'undefined' || !google.accounts) {
        vm.error = 'Google Sign-In is not loaded. Please refresh the page and try again.';
        return;
      }

      // Initialize Google Sign-In if not already done
      if (!vm.googleInitialized) {
        google.accounts.id.initialize({
          client_id: '619418411211-1odoqr4cfnkmpu7i1iaq3r03jiccgm6t.apps.googleusercontent.com',
          callback: vm.handleGoogleResponse
        });
        vm.googleInitialized = true;
      }

      // Prompt for Google Sign-In
      google.accounts.id.prompt();
    };

    // Handle Google Sign-In response
    vm.handleGoogleResponse = function(response) {
      if (response.credential) {
        // Send the credential token to backend
        ApiService.googleLogin({ token: response.credential })
          .then(function(backendResponse) {
            // Store token and update UI
            $window.localStorage.setItem('appToken', backendResponse.data.appToken);
            vm.success = 'Google Sign-In successful!';
            OverlayService.show('login', [
              '🔐 Verifying your Google account...',
              '🚗 Starting your Motofy engine...',
              '✅ Welcome back!'
            ], 2300, function() {
              if ($window.location && $window.location.reload) {
                $window.location.reload();
              }
              if (typeof main !== 'undefined' && main.closeModal) {
                try { main.closeModal(); } catch(e) {}
              }
            });
          })
          .catch(function(err) {
            vm.error = (err.data && err.data.message) ? err.data.message : 'Google Sign-In failed. Please try again.';
          });
      } else {
        vm.error = 'Google Sign-In was cancelled or failed.';
      }
    };
  }]);