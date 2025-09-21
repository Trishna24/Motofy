// app/controllers/admin-booking.controller.js
angular.module('motofyApp')
  .controller('AdminBookingController', ['$scope', 'ApiService', function($scope, ApiService) {
    // AdminBookingController loaded successfully
    
    var vm = this;
    vm.bookings = [];
    vm.loading = true;
    vm.error = '';
    vm.selectedBooking = null;
    vm.showDetailModal = false;
    
    // Load all bookings
    vm.loadBookings = function() {
      vm.loading = true;
      ApiService.getAllBookings()
        .then(function(response) {
          if (response.data && response.data.success) {
            vm.bookings = response.data.bookings;
          } else {
            vm.error = 'Failed to load bookings';
          }
          vm.loading = false;
        })
        .catch(function(error) {
          vm.error = 'Error loading bookings: ' + (error.data ? error.data.message : error.message);
          vm.loading = false;
        });
    };
    
    // Show booking details
    vm.showDetails = function(booking) {
      // ShowDetailView called with booking
      vm.selectedBooking = booking;
      vm.showDetailModal = true;
    };
    
    // Close detail modal
    vm.closeDetails = function() {
      vm.showDetailModal = false;
      vm.selectedBooking = null;
    };
    
    // Get booking details
    vm.getBookingDetails = function(booking) {
      // Fetching booking details for ID
      ApiService.getBookingDetails(booking._id)
        .then(function(response) {
          // Booking details received
          if (response.data && response.data.success) {
            vm.selectedBooking = response.data.booking;
          }
        })
        .catch(function(error) {
          vm.error = 'Error loading booking details: ' + (error.data ? error.data.message : error.message);
        });
    };
    
    // Update booking status
    vm.updateBookingStatus = function(bookingId, newStatus) {
      ApiService.updateBookingStatus(bookingId, newStatus)
        .then(function(response) {
          if (response.data && response.data.success) {
            // Reload bookings to reflect changes
            vm.loadBookings();
            vm.closeDetails();
          } else {
            vm.error = 'Failed to update booking status';
          }
        })
        .catch(function(error) {
          vm.error = 'Error updating booking status: ' + (error.data ? error.data.message : error.message);
        });
    };
    
    // Initialize
    vm.loadBookings();
  }]);