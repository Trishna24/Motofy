// app/controllers/main.controller.js
// MainController: Handles global app logic

angular.module('motofyApp')
  .controller('MainController', ['$window', '$location', '$timeout', '$scope', '$rootScope', function($window, $location, $timeout, $scope, $rootScope) {
    var vm = this;

    // Dropdown state
    vm.dropdownOpen = false;

    // Toggle dropdown menu
    vm.toggleDropdown = function($event) {
      $event.stopPropagation();
      vm.dropdownOpen = !vm.dropdownOpen;
    };

    // Close dropdown
    vm.closeDropdown = function() {
      vm.dropdownOpen = false;
    };

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
      } else if (role === 'admin') {
        vm.showRoleModal = false;
        $location.path('/admin/login'); // redirect to admin login page
      }
    };


    // Check if user is logged in (simple token check)
    vm.isLoggedIn = function() {
      return !!$window.localStorage.getItem('appToken');
    };

    // Logout function
    vm.logout = function() {
      $window.localStorage.removeItem('appToken');
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

      // Randomly select 3-4 cars for featured section
      vm.featuredCars = vm.getRandomCars(vm.cars, 3);
      vm.filteredCars = vm.featuredCars;
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
          params.maxPrice = '50';
          break;
        case 'luxury':
          params.brand = 'BMW,Mercedes,Audi';
          break;
        case 'family':
          params.seats = '5';
          params.transmission = 'Automatic';
          break;
      }

      var queryString = Object.keys(params).map(key => key + '=' + encodeURIComponent(params[key])).join('&');
      var url = '/cars';
      if (queryString) url += '?' + queryString;

      $location.url('/cars' + (queryString ? '?' + queryString : ''));
    };

    // Initialize cars
    vm.loadCars();

    vm.goToCars = function() {
      $location.path('/cars');
    };

    // Show/hide navbar based on route
    vm.showNavbar = true;
    $rootScope.$on('$routeChangeSuccess', function() {
      vm.showNavbar = !$location.path().startsWith('/admin');
    });

  }]);
