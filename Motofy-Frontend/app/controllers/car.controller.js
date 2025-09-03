// app/controllers/car.controller.js
// CarController: Handles car listing, details, and booking

angular.module('motofyApp')
  .controller('CarController', ['ApiService', '$window', '$location', '$routeParams', '$timeout', '$scope', function(ApiService, $window, $location, $routeParams, $timeout, $scope) {
    var vm = this;
    
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
      totalAmount: 0
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
      
      // Simulate API call (replace with actual API when backend is ready)
      // ApiService.getCars().then(...)
      
      // For now, use sample data
      vm.cars = [
        {
          _id: '1',
          name: 'Honda Civic',
          brand: 'Honda',
          price: 50,
          fuelType: 'Petrol',
          seats: 5,
          transmission: 'Automatic',
          image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400',
          description: 'Comfortable and fuel-efficient sedan perfect for city driving.'
        },
        {
          _id: '2',
          name: 'Toyota Camry',
          brand: 'Toyota',
          price: 60,
          fuelType: 'Petrol',
          seats: 5,
          transmission: 'Automatic',
          image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
          description: 'Reliable and spacious sedan with excellent safety features.'
        },
        {
          _id: '3',
          name: 'BMW X5',
          brand: 'BMW',
          price: 120,
          fuelType: 'Petrol',
          seats: 7,
          transmission: 'Automatic',
          image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400',
          description: 'Luxury SUV with premium features and powerful performance.'
        },
        {
          _id: '4',
          name: 'Mercedes C-Class',
          brand: 'Mercedes',
          price: 80,
          fuelType: 'Petrol',
          seats: 5,
          transmission: 'Automatic',
          image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400',
          description: 'Elegant luxury sedan with sophisticated design and comfort.'
        },
        {
          _id: '5',
          name: 'Audi A4',
          brand: 'Audi',
          price: 70,
          fuelType: 'Petrol',
          seats: 5,
          transmission: 'Automatic',
          image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400',
          description: 'Sporty sedan with advanced technology and premium interior.'
        },
        {
          _id: '6',
          name: 'Tesla Model 3',
          brand: 'Tesla',
          price: 100,
          fuelType: 'Electric',
          seats: 5,
          transmission: 'Automatic',
          image: 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=400',
          description: 'Electric vehicle with cutting-edge technology and instant acceleration.'
        },
        {
          _id: '7',
          name: 'Maruti Swift',
          brand: 'Maruti',
          price: 35,
          fuelType: 'CNG',
          seats: 5,
          transmission: 'Manual',
          image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
          description: 'Fuel-efficient hatchback perfect for city commuting with CNG option.'
        },
        {
          _id: '8',
          name: 'Hyundai i20',
          brand: 'Hyundai',
          price: 40,
          fuelType: 'CNG',
          seats: 5,
          transmission: 'Manual',
          image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400',
          description: 'Compact hatchback with dual fuel option and great mileage.'
        },
        {
          _id: '9',
          name: 'Mahindra Scorpio',
          brand: 'Mahindra',
          price: 75,
          fuelType: 'Diesel',
          seats: 7,
          transmission: 'Manual',
          image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400',
          description: 'Rugged SUV with powerful diesel engine and off-road capability.'
        },
        {
          _id: '10',
          name: 'Tata Nexon',
          brand: 'Tata',
          price: 55,
          fuelType: 'Diesel',
          seats: 5,
          transmission: 'Manual',
          image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400',
          description: 'Compact SUV with diesel engine and excellent safety ratings.'
        }
      ];
      
      vm.filteredCars = vm.cars;
      vm.loading = false;
      
      // Apply search parameters from URL after cars are loaded
      $timeout(function() {
        vm.handleSearchParams();
      }, 100);
      
      // Call filterCars after loading cars
      if (!vm.carId) {
        vm.filterCars();
      }
    };
    
    // Load specific car for detail view
    vm.loadCarDetail = function() {
      if (!vm.carId) return;
      
      vm.loading = true;
      vm.error = '';
      
      // Find car by ID (replace with API call when ready)
      vm.selectedCar = vm.cars.find(car => car._id === vm.carId);
      
      if (!vm.selectedCar) {
        vm.error = 'Car not found';
      }
      
      vm.loading = false;
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
      if (!$window.localStorage.getItem('appToken')) {
        // Open login modal (you'll need to implement this)
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
      
      // Create booking (replace with API call when ready)
      var booking = {
        car: vm.selectedCar._id,
        pickupDate: vm.bookingData.pickupDate,
        dropoffDate: vm.bookingData.dropoffDate,
        pickupLocation: vm.bookingData.pickupLocation,
        totalAmount: vm.bookingData.totalAmount
      };
      
      // Simulate booking creation
      alert('Booking created successfully! Redirecting to bookings page...');
      $location.path('/bookings');
    };
    
    // Navigate to car detail
    vm.viewCarDetail = function(carId) {
      $location.path('/cars/' + carId);
    };
    
    // Initialize
    vm.loadCars();
    
    // Watch for URL changes to handle quick search navigation
    $scope.$on('$locationChangeSuccess', function() {
      vm.handleSearchParams();
    });
    
    if (vm.carId) {
      // Load car detail page
      vm.loadCarDetail();
    }
  }]); 