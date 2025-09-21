// app/controllers/booking.controller.js
// BookingController: Fetches and displays current user's bookings

angular.module('motofyApp')
  .controller('BookingController', ['ApiService', '$window', '$scope', function(ApiService, $window, $scope) {
    var vm = this;
    vm.bookings = [];
    vm.loading = true;
    vm.error = '';
    vm.success = '';
    vm.searchTerm = '';
    vm.selectedBooking = null;
    vm.showDetailsModal = false;

    // Image URL helper function
    vm.imageUrl = function(imagePath) {
      if (!imagePath) {
        return 'assets/images/car-placeholder.jpg';
      }
      if (imagePath.startsWith('http')) {
        return imagePath;
      }
      return 'https://motofy-l5gq.onrender.com/uploads/cars/' + imagePath;
    };

    // Calculate duration between pickup and dropoff dates with time support
    vm.calculateDuration = function(pickupDate, dropoffDate, pickupTime, dropoffTime) {
      if (!pickupDate || !dropoffDate) {
        return 0;
      }

      var pickup, dropoff;

      // If times are provided, combine date and time for accurate calculation
      if (pickupTime && dropoffTime) {
        pickup = new Date(pickupDate + 'T' + pickupTime);
        dropoff = new Date(dropoffDate + 'T' + dropoffTime);
        
        // Calculate difference in hours
        var diffInMs = dropoff - pickup;
        var diffInHours = diffInMs / (1000 * 60 * 60);
        
        // Convert to days (round up for partial days)
        return Math.ceil(diffInHours / 24);
      } else {
        // Fallback to date-only calculation for backward compatibility
        pickup = new Date(pickupDate);
        dropoff = new Date(dropoffDate);
        
        var diffInMs = dropoff - pickup;
        var diffInDays = diffInMs / (1000 * 60 * 60 * 24);
        
        return Math.ceil(diffInDays);
      }
    };

    // Fetch user bookings on load
    function loadBookings() {
      var token = $window.localStorage.getItem('appToken');
      console.log('🔑 Token found:', token ? 'Yes' : 'No');
      if (!token) {
        vm.loading = false;
        vm.error = 'You must be logged in to view your bookings.';
        return;
      }
      console.log('📞 Calling getUserBookings API...');
      ApiService.getUserBookings(token)
        .then(function(response) {
          console.log('✅ API Response:', response.data);
          vm.bookings = response.data;
          console.log('📋 Total bookings loaded:', vm.bookings.length);
          // Ensure each booking has an image URL
          vm.bookings.forEach(function(booking) {
            if (booking.car && !booking.car.imageUrl) {
              booking.car.imageUrl = vm.imageUrl(booking.car.image);
            }
          });
          vm.loading = false;
        })
        .catch(function(err) {
          console.error('❌ API Error:', err);
          vm.error = err.data && err.data.message ? err.data.message : 'Failed to load bookings.';
          vm.loading = false;
        });
    }

    loadBookings();

    // Cancel a booking
    vm.cancel = function(booking) {
      booking.cancelling = true;
      vm.success = '';
      vm.error = '';
      var token = $window.localStorage.getItem('appToken');
      ApiService.cancelBooking(booking._id, token)
        .then(function(response) {
          booking.status = 'Cancelled';
          booking.cancelling = false;
          vm.success = 'Booking cancelled successfully.';
        })
        .catch(function(err) {
          booking.cancelling = false;
          vm.error = err.data && err.data.message ? err.data.message : 'Failed to cancel booking.';
        });
    };
    
    // View booking details
    vm.viewDetails = function(booking) {
      vm.selectedBooking = booking;
      vm.showDetailsModal = true;
    };
    
    // Close booking details modal
    vm.closeDetailsModal = function() {
      vm.showDetailsModal = false;
      vm.selectedBooking = null;
    };
  }]);