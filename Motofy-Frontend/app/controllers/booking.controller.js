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
      return 'http://localhost:5000/uploads/' + imagePath;
    };

    // Fetch user bookings on load
    function loadBookings() {
      var token = $window.localStorage.getItem('appToken');
      if (!token) {
        vm.loading = false;
        vm.error = 'You must be logged in to view your bookings.';
        return;
      }
      ApiService.getUserBookings(token)
        .then(function(response) {
          vm.bookings = response.data;
          // Ensure each booking has an image URL
          vm.bookings.forEach(function(booking) {
            if (booking.car && !booking.car.imageUrl) {
              booking.car.imageUrl = vm.imageUrl(booking.car.image);
            }
          });
          vm.loading = false;
        })
        .catch(function(err) {
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