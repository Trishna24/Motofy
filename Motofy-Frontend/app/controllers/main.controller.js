// app/controllers/main.controller.js
// MainController: Handles global app logic

angular.module('motofyApp')
  .controller('MainController', ['$window', '$location', '$timeout', '$scope', '$rootScope', 'ApiService', 'CONFIG', function($window, $location, $timeout, $scope, $rootScope, ApiService, CONFIG) {
    var vm = this;

    // Dropdown state
    vm.dropdownOpen = false;

    // Check if current route is admin route
    vm.isAdminRoute = function() {
      var currentPath = $location.path();
      return currentPath.startsWith('/admin');
    };

    // Toggle dropdown menu
    vm.toggleDropdown = function($event) {
      $event.stopPropagation();
      vm.dropdownOpen = !vm.dropdownOpen;
    };

    // Close dropdown
    vm.closeDropdown = function() {
      vm.dropdownOpen = false;
    };

    // Listen for broadcast events from AI controller
    $rootScope.$on('openLoginModal', function() {
      vm.openLoginModal();
    });

    $rootScope.$on('openSignupModal', function() {
      vm.openSignupModal();
    });

    // Role selection modal state
    vm.showRoleModal = false;


    // Modal state for login/signup
    vm.showLoginModal = false;
    vm.showSignupModal = false;
    vm.isModalOpen = function() { return vm.showLoginModal || vm.showSignupModal; };
    vm.openLoginModal = function() {
      vm.showRoleModal = true;  // show role selection first
      vm.showLoginModal = false;
      vm.showSignupModal = false;
    };

    vm.openSignupModal = function() {
      vm.showSignupModal = true;
      vm.showLoginModal = false;
      vm.initializeGoogleSignIn(); // Initialize Google Sign-In when signup modal opens
    };
    vm.closeModal = function() {
      vm.showRoleModal = false;
      vm.showLoginModal = false;
      vm.showSignupModal = false;
    };

    vm.chooseRole = function(role) {
      if (role === 'user') {
        vm.showRoleModal = false;
        vm.showLoginModal = true;  // open existing user login modal
        vm.initializeGoogleSignIn(); // Initialize Google Sign-In when login modal opens
      } else if (role === 'admin') {
        vm.showRoleModal = false;
        $location.path('/admin/login'); // redirect to admin login page
      }
    };

    // Initialize Google Sign-In
    vm.initializeGoogleSignIn = function() {
      // Wait for Google SDK to load
      $timeout(function() {
        if (typeof google !== 'undefined' && google.accounts) {
          google.accounts.id.initialize({
            client_id: '619418411211-1odoqr4cfnkmpu7i1iaq3r03jiccgm6t.apps.googleusercontent.com',
            callback: function(response) {
              // This callback will be handled by AuthController
              // Google Sign-In initialized
            }
          });
        }
      }, 500); // Small delay to ensure SDK is loaded
    };


    // Check if user is logged in (simple token check)
    vm.isLoggedIn = function() {
      return !!$window.localStorage.getItem('appToken');
    };

    // Get current user data
    vm.currentUser = null;
    vm.loadCurrentUser = function() {
      if (vm.isLoggedIn()) {
        var token = $window.localStorage.getItem('appToken');
        
        ApiService.getCurrentUser(token)
          .then(function(response) {
            // Backend returns { success: true, user: userData }
            // So we need to access response.data.user instead of response.data
            if (response.data && response.data.user) {
              vm.currentUser = response.data.user;
            } else {
              vm.currentUser = response.data; // Fallback to original structure
            }
          })
          .catch(function(error) {
            console.error('Error loading current user:', error);
          });
      }
    };

    // Profile picture handling method for header
    vm.getProfilePictureUrl = function(profilePicture) {
      if (!profilePicture) {
        return '/assets/images/default-avatar.svg';
      }
      
      // Check if it's already a full URL (Google profile picture)
      if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
        return profilePicture;
      }
      
      // Local uploaded file
      return CONFIG.UPLOADS_BASE_URL + '/profile-pictures/' + profilePicture;
    };

    // Logout function
    vm.logout = function() {
      $window.localStorage.removeItem('appToken');
      vm.currentUser = null; // Clear user data on logout
      $location.path('/');
    };

    // Admin login click handler
    vm.goToAdminLogin = function() {
      $location.path('/admin/login');

      // Force Angular to digest the changes
      if (!$scope.$$phase) {
        $scope.$apply();
      }
    };
    // Check if logged in as admin
    vm.isAdmin = function() {
      var adminToken = $window.localStorage.getItem('adminToken');
      return !!adminToken;
    };

// Redirect to Admin Dashboard
    vm.goToAdminDashboard = function() {
      $location.path('/admin/dashboard');
    };


    // Car functionality for homepage
    vm.cars = [];
    vm.filteredCars = [];
    vm.searchTerm = '';
    vm.selectedBrand = '';
    vm.selectedFuelType = '';

    // Load cars for homepage
    vm.loadCars = function() {
      ApiService.getAllCars()
        .then(function(response) {
          vm.cars = response.data || [];
          vm.filteredCars = vm.cars;
        })
        .catch(function(error) {
          // Fallback to empty array if API fails
          vm.cars = [];
          vm.filteredCars = [];
        });
    };

    // Get random cars for featured section
    vm.getRandomCars = function(cars, count) {
      var shuffled = cars.slice(0);
      for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
      }
      return shuffled.slice(0, count);
    };

    // Filter cars
    vm.filterCars = function() {
      vm.filteredCars = vm.cars.filter(function(car) {
        var matchesSearch = !vm.searchTerm ||
          car.name.toLowerCase().includes(vm.searchTerm.toLowerCase()) ||
          car.brand.toLowerCase().includes(vm.searchTerm.toLowerCase());

        var matchesBrand = !vm.selectedBrand || car.brand === vm.selectedBrand;
        var matchesFuel = !vm.selectedFuelType || car.fuelType === vm.selectedFuelType;

        return matchesSearch && matchesBrand && matchesFuel;
      });
    };

    // Get unique brands
    vm.getBrands = function() {
      const brands = [...new Set(vm.cars.map(car => car.brand))];
      return brands;
    };

    // Get unique fuel types
    vm.getFuelTypes = function() {
      const fuelTypes = [...new Set(vm.cars.map(car => car.fuelType))];
      return fuelTypes;
    };

    // Get all brands from complete database (for homepage search)
    vm.getAllBrands = function() {
      return [...new Set(vm.cars.map(car => car.brand))];
    };

    // Get all fuel types from complete database (for homepage search)
    vm.getAllFuelTypes = function() {
      return [...new Set(vm.cars.map(car => car.fuelType))];
    };

    // Search cars and redirect to car listing page
    vm.searchCars = function() {
      var params = {};
      if (vm.searchTerm) params.search = vm.searchTerm;
      if (vm.selectedBrand) params.brand = vm.selectedBrand;
      if (vm.selectedFuelType) params.fuel = vm.selectedFuelType;

      var queryString = Object.keys(params).map(key => key + '=' + encodeURIComponent(params[key])).join('&');
      var url = '/cars';
      if (queryString) url += '?' + queryString;

      $location.path(url);
    };

    // Navigate to car detail
    vm.viewCarDetail = function(carId) {
      $location.path('/cars/' + carId);
    };

    // Quick Search functionality
    vm.quickSearch = function(category) {
      var params = {};

      switch (category) {
        case 'popular':
          params.brand = 'Honda,Toyota,Maruti';
          break;
        case 'suv':
          params.brand = 'BMW,Mahindra,Tata';
          break;
        case 'electric':
          params.fuel = 'Electric';
          break;
        case 'budget':
          params.maxPrice = '1000';
          break;
        case 'luxury':
          params.brand = 'BMW,Mercedes,Audi';
          break;
        case 'family':
          params.seats = '6';
          params.transmission = 'Automatic';
          break;
      }

      var queryString = Object.keys(params).map(key => key + '=' + encodeURIComponent(params[key])).join('&');
      var url = '/cars';
      if (queryString) url += '?' + queryString;

      $location.url('/cars' + (queryString ? '?' + queryString : ''));
    };

    // Make $location available in template
    vm.$location = $location;
    
    // Image URL helper function
    vm.imageUrl = function(filename) {
      if (!filename) return 'app/assets/images/car-placeholder.jpg';
      // Ensure we're using the correct backend URL
      if (filename.startsWith('http')) {
        return filename; // Already a full URL
      }
      return CONFIG.UPLOADS_BASE_URL + '/cars/' + filename;
    };
    
    // Initialize cars
    vm.loadCars();

    // Load user bookings for homepage
    vm.loadUserBookings = function() {
      if (vm.isLoggedIn()) {
        var token = $window.localStorage.getItem('appToken');
        ApiService.getUserBookings(token)
          .then(function(response) {
            vm.userBookings = response.data || [];
          })
          .catch(function(error) {
          $scope.userBookings = [];
        });
      }
    };

    // Format date for display
    vm.formatDate = function(dateString) {
      if (!dateString) return '';
      var date = new Date(dateString);
      return date.toLocaleDateString();
    };

    // Load user bookings on initialization
    vm.loadUserBookings();

    // Load current user on initialization
    vm.loadCurrentUser();

    vm.goToCars = function() {
      $location.path('/cars');
    };

    // Navigate to booking details
    vm.viewBookingDetails = function(bookingId) {
      $location.path('/bookings');
    };

    // Show/hide navbar based on route
    vm.showNavbar = true;
    $rootScope.$on('$routeChangeSuccess', function() {
      vm.showNavbar = !$location.path().startsWith('/admin');
    });

  }]);
