// app/controllers/admin-dashboard.controller.js
angular.module('motofyApp')
  .controller('AdminDashboardController', ['ApiService', '$window', '$location', function(ApiService, $window, $location) {
    console.log('📊 AdminDashboardController loaded successfully!');
    var vm = this;

    // Admin data
    vm.adminData = {};
    vm.stats = {
      totalCars: 0,
      totalUsers: 0,
      totalBookings: 0,
      totalRevenue: 0
    };
    vm.recentActivity = [];
    vm.loading = true;
    vm.error = '';

    // Default active section
    vm.activeSection = 'dashboard';

    // Function to change section
    vm.showSection = function(section) {
      vm.activeSection = section;
    };

    // Check admin authentication
    vm.checkAuth = function() {
      var adminToken = $window.localStorage.getItem('adminToken');
      var adminData = $window.localStorage.getItem('adminData');

      if (!adminToken || !adminData) {
        $location.path('/admin/login');
        return false;
      }

      try {
        vm.adminData = JSON.parse(adminData);
        return true;
      } catch (e) {
        $window.localStorage.removeItem('adminToken');
        $window.localStorage.removeItem('adminData');
        $location.path('/admin/login');
        return false;
      }
    };

    // Load dashboard data from API
    vm.loadDashboardData = function() {
      vm.loading = true;
      vm.error = '';

      // Get booking statistics
      ApiService.getBookingStats()
        .then(function(response) {
          var data = response.data;
          
          vm.stats = {
            totalCars: 0, // Will be updated separately
            totalUsers: 0, // Will be updated separately
            totalBookings: data.totalBookings || 0,
            totalRevenue: data.totalRevenue || 0,
            pendingBookings: data.pendingBookings || 0,
            confirmedBookings: data.confirmedBookings || 0,
            cancelledBookings: data.cancelledBookings || 0
          };
          
          // Format recent bookings for activity feed
          vm.recentActivity = [];
          
          if (data.recentBookings && data.recentBookings.length > 0) {
            data.recentBookings.forEach(function(booking) {
              var timeAgo = getTimeAgo(new Date(booking.createdAt));
              vm.recentActivity.push({
                icon: '📋',
                text: 'Booking #' + booking._id.substr(-5) + ' (' + booking.status + ') by ' + 
                      (booking.user ? booking.user.username : 'Unknown') + ' for ' + 
                      (booking.car ? booking.car.name + ' ' + booking.car.brand : 'Unknown car'),
                time: timeAgo
              });
            });
          }
          
          // Get user statistics
          return ApiService.getUserStats();
        })
        .then(function(response) {
          if (response && response.data) {
            vm.stats.totalUsers = response.data.totalUsers || 0;
            vm.stats.activeUsers = response.data.activeUsers || 0;
            vm.stats.inactiveUsers = response.data.inactiveUsers || 0;
          }
          vm.loading = false;
        })
        .catch(function(error) {
          console.error('Error loading dashboard data:', error);
          vm.error = 'Failed to load dashboard data';
          vm.loading = false;
        });
    };
    
    // Helper function to format time ago
    function getTimeAgo(date) {
      var seconds = Math.floor((new Date() - date) / 1000);
      var interval = Math.floor(seconds / 31536000);
      
      if (interval >= 1) {
        return interval + ' year' + (interval === 1 ? '' : 's') + ' ago';
      }
      interval = Math.floor(seconds / 2592000);
      if (interval >= 1) {
        return interval + ' month' + (interval === 1 ? '' : 's') + ' ago';
      }
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) {
        return interval + ' day' + (interval === 1 ? '' : 's') + ' ago';
      }
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) {
        return interval + ' hour' + (interval === 1 ? '' : 's') + ' ago';
      }
      interval = Math.floor(seconds / 60);
      if (interval >= 1) {
        return interval + ' minute' + (interval === 1 ? '' : 's') + ' ago';
      }
      return Math.floor(seconds) + ' second' + (seconds === 1 ? '' : 's') + ' ago';
    }

    // Logout
    vm.logout = function() {
      $window.localStorage.removeItem('adminToken');
      $window.localStorage.removeItem('adminData');
      $location.path('/');
    };

    // Quick action handlers (now using sections instead of routes)
    vm.addCar = function() {
      vm.showSection('cars');
    };
    vm.viewBookings = function() {
      vm.showSection('bookings');
    };
    vm.manageUsers = function() {
      vm.showSection('users');
    };
    vm.viewAnalytics = function() {
      vm.showSection('analytics');
    };

    // Initialize
    if (vm.checkAuth()) {
      vm.loadDashboardData();
    }
  }]);
