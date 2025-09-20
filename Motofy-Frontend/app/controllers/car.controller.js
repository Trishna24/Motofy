// app/controllers/car.controller.js
// CarController: Handles car listing, details, and booking

angular.module('motofyApp')
  .controller('CarController', ['ApiService', '$window', '$location', '$routeParams', '$timeout', '$scope', function(ApiService, $window, $location, $routeParams, $timeout, $scope) {
    var vm = this;
    
    // Make $location available in template
    vm.$location = $location;
    
    // Image URL helper function
    vm.imageUrl = function(filename) {
      if (!filename) return 'app/assets/images/car-placeholder.jpg';
      // Ensure we're using the correct backend URL
      if (filename.startsWith('http')) {
        return filename; // Already a full URL
      }
      return 'http://localhost:5000/uploads/' + filename;
    };
    
    // Car listing data
    vm.cars = [];
    vm.filteredCars = [];
    vm.loading = false;
    vm.error = '';
    
    // Search and filter - Initialize all variables
    vm.searchTerm = '';
    vm.selectedBrand = '';
    vm.selectedFuelType = '';
    vm.selectedTransmission = '';
    vm.selectedSeats = '';
    vm.maxPrice = null;
    vm.sortBy = 'name';
    
    // Car detail data
    vm.selectedCar = null;
    vm.carId = $routeParams.id;
    
    // Booking data
    vm.bookingData = {
      pickupDate: '',
      dropoffDate: '',
      pickupLocation: '',
      totalAmount: 0,
      creating: false
    };
    
    // Handle URL search parameters
    vm.handleSearchParams = function() {
      var search = $location.search();
      
      if (search.search) {
        vm.searchTerm = search.search;
      }
      if (search.brand) {
        vm.selectedBrand = search.brand;
      }
      if (search.fuel) {
        vm.selectedFuelType = search.fuel;
      }
      if (search.transmission) {
        vm.selectedTransmission = search.transmission;
      }
      if (search.seats) {
        vm.selectedSeats = search.seats;
      }
      if (search.maxPrice) {
        vm.maxPrice = parseInt(search.maxPrice);
      }
      
      // Force filter cars after applying parameters
      if (Object.keys(search).length > 0) {
        vm.filterCars();
      }
    };
    
    // Load all cars
    vm.loadCars = function() {
      vm.loading = true;
      vm.error = '';
      
      ApiService.getAllCars()
        .then(function(response) {
          vm.cars = response.data || [];
          vm.filteredCars = vm.cars;
          vm.loading = false;
          
          // Apply search parameters from URL after cars are loaded
          $timeout(function() {
            vm.handleSearchParams();
          }, 100);
          
          // Call filterCars after loading cars
          if (!vm.carId) {
            vm.filterCars();
          } else {
            // Load car detail after cars are loaded
            vm.loadCarDetail();
          }
        })
        .catch(function(error) {
          console.error('Error loading cars:', error);
          vm.error = 'Failed to load cars. Please try again.';
          vm.cars = [];
          vm.filteredCars = [];
          vm.loading = false;
        });
    };
    
    // Load specific car for detail view
    vm.loadCarDetail = function() {
      if (!vm.carId) return;
      
      vm.loading = true;
      vm.error = '';
      
      // If cars are already loaded, find the car
      if (vm.cars && vm.cars.length > 0) {
        vm.selectedCar = vm.cars.find(car => car._id === vm.carId);
        
        if (!vm.selectedCar) {
          vm.error = 'Car not found';
        }
        vm.loading = false;
      } else {
        // If cars are not loaded, load them first then find the specific car
        ApiService.getAllCars()
          .then(function(response) {
            vm.cars = response.data || [];
            vm.selectedCar = vm.cars.find(car => car._id === vm.carId);
            
            if (!vm.selectedCar) {
              vm.error = 'Car not found';
            }
            vm.loading = false;
          })
          .catch(function(error) {
            console.error('Error loading car details:', error);
            vm.error = 'Failed to load car details. Please try again.';
            vm.loading = false;
          });
      }
    };
    
    // Filter cars based on search and filters
    vm.filterCars = function() {
      vm.filteredCars = vm.cars.filter(function(car) {
        // Search term filter
        var matchesSearch = !vm.searchTerm || 
          car.name.toLowerCase().includes(vm.searchTerm.toLowerCase()) ||
          car.brand.toLowerCase().includes(vm.searchTerm.toLowerCase());
        
        // Brand filter - handle comma-separated values
        var matchesBrand = true;
        if (vm.selectedBrand) {
          var brands = vm.selectedBrand.split(',').map(b => b.trim());
          matchesBrand = brands.includes(car.brand);
        }
        
        // Fuel type filter
        var matchesFuel = !vm.selectedFuelType || car.fuelType === vm.selectedFuelType;
        
        // Transmission filter
        var matchesTransmission = !vm.selectedTransmission || car.transmission === vm.selectedTransmission;
        
        // Seats filter
        var matchesSeats = !vm.selectedSeats || car.seats >= parseInt(vm.selectedSeats);
        
        // Price filter
        var matchesPrice = !vm.maxPrice || car.price <= vm.maxPrice;
        
        var result = matchesSearch && matchesBrand && matchesFuel && matchesTransmission && matchesSeats && matchesPrice;
        
        return result;
      });
      
      // Sort cars
      vm.filteredCars.sort(function(a, b) {
        if (vm.sortBy === 'price') return a.price - b.price;
        if (vm.sortBy === 'brand') return a.brand.localeCompare(b.brand);
        return a.name.localeCompare(b.name);
      });
    };
    
    // Get unique brands for filter
    vm.getBrands = function() {
      return [...new Set(vm.cars.map(car => car.brand))];
    };
    
    // Get unique fuel types for filter
    vm.getFuelTypes = function() {
      return [...new Set(vm.cars.map(car => car.fuelType))];
    };
    
    // Get unique transmission types for filter
    vm.getTransmissions = function() {
      return [...new Set(vm.cars.map(car => car.transmission))];
    };
    
    // Clear all filters
    vm.clearFilters = function() {
      vm.searchTerm = '';
      vm.selectedBrand = '';
      vm.selectedFuelType = '';
      vm.selectedTransmission = '';
      vm.sortBy = 'name';
      vm.filterCars();
    };
    
    // Calculate booking total
    vm.calculateTotal = function() {
      if (!vm.selectedCar || !vm.bookingData.pickupDate || !vm.bookingData.dropoffDate) {
        vm.bookingData.totalAmount = 0;
        return;
      }
      
      var pickup = new Date(vm.bookingData.pickupDate);
      var dropoff = new Date(vm.bookingData.dropoffDate);
      var days = Math.ceil((dropoff - pickup) / (1000 * 60 * 60 * 24));
      
      if (days > 0) {
        vm.bookingData.totalAmount = days * vm.selectedCar.price;
      } else {
        vm.bookingData.totalAmount = 0;
      }
    };
    
    // Calculate days for display
    vm.calculateDays = function() {
      if (!vm.bookingData.pickupDate || !vm.bookingData.dropoffDate) {
        return 0;
      }
      
      var pickup = new Date(vm.bookingData.pickupDate);
      var dropoff = new Date(vm.bookingData.dropoffDate);
      var days = Math.ceil((dropoff - pickup) / (1000 * 60 * 60 * 24));
      
      return days > 0 ? days : 0;
    };
    
    // Book a car
    vm.bookCar = function() {
      if (!vm.selectedCar) return;
      
      // Check if user is logged in
      var token = $window.localStorage.getItem('appToken');
      if (!token) {
        alert('Please log in to book a car');
        return;
      }
      
      // Validate booking data
      if (!vm.bookingData.pickupDate || !vm.bookingData.dropoffDate || !vm.bookingData.pickupLocation) {
        alert('Please fill in all booking details');
        return;
      }
      
      var pickup = new Date(vm.bookingData.pickupDate);
      var dropoff = new Date(vm.bookingData.dropoffDate);
      
      if (pickup >= dropoff) {
        alert('Dropoff date must be after pickup date');
        return;
      }
      
      // Create booking using API
      var bookingData = {
        car: vm.selectedCar._id,
        pickupDate: vm.bookingData.pickupDate,
        dropoffDate: vm.bookingData.dropoffDate,
        pickupLocation: vm.bookingData.pickupLocation,
        totalAmount: vm.bookingData.totalAmount
      };
      
      // Create payment session first
      var paymentData = {
        bookingData: bookingData,
        successUrl: $window.location.origin + '/#/payment-success',
        cancelUrl: $window.location.origin + '/#/payment-cancel'
      };
      
      vm.bookingData.creating = true;
      
      ApiService.createPaymentSession(paymentData, token)
        .then(function(response) {
          vm.bookingData.creating = false;
          if (response.data.success && response.data.sessionUrl) {
            // Redirect to Stripe checkout
            $window.location.href = response.data.sessionUrl;
          } else {
            alert('Error creating payment session: ' + (response.data.message || 'Unknown error'));
          }
        })
        .catch(function(error) {
          vm.bookingData.creating = false;
          console.error('Payment session error:', error);
          alert('Error creating payment session. Please try again.');
        });
    };
    
    // Navigate to car detail
    vm.viewCarDetail = function(carId) {
      $location.path('/cars/' + carId);
    };
    
    // Go back to previous page
    vm.goBack = function() {
      $window.history.back();
    };
    
    // Initialize
    vm.loadCars();
    
    // Watch for URL changes to handle quick search navigation
    $scope.$on('$locationChangeSuccess', function() {
      vm.handleSearchParams();
    });
    
    // Remove the duplicate loadCarDetail call since it's now handled in loadCars
    // if (vm.carId) {
    //   // Load car detail page
    //   vm.loadCarDetail();
    // }
  }]);