// app/controllers/admin-booking.controller.js
angular.module('motofyApp')
  .controller('AdminBookingController', ['ApiService', '$window', '$scope', function(ApiService, $window, $scope) {
    var vm = this;
    
    // Booking data
    vm.bookings = [];
    vm.filteredBookings = [];
    vm.loading = true;
    vm.error = '';
    vm.success = '';
    
    // Filters
    vm.searchTerm = '';
    vm.statusFilter = '';
    vm.paymentStatusFilter = '';
    vm.startDate = null;
    vm.endDate = null;
    vm.sortBy = 'createdAt';
    vm.sortReverse = true;
    
    // Load all bookings
    vm.loadBookings = function() {
      vm.loading = true;
      vm.error = '';
      
      ApiService.getAllBookings()
        .then(function(response) {
          vm.bookings = response.data;
          
          // Ensure each booking has payment status
          vm.bookings.forEach(function(booking) {
            if (!booking.paymentStatus) {
              booking.paymentStatus = booking.isPaid ? 'Paid' : 'Pending';
            }
          });
          
          vm.applyFilters();
          vm.loading = false;
        })
        .catch(function(error) {
          console.error('Error loading bookings:', error);
          vm.error = 'Failed to load bookings';
          vm.loading = false;
        });
    };
    
    // View booking details
    vm.selectedBooking = null;
    vm.showDetailsModal = false;
    
    vm.viewBooking = function(booking) {
      vm.selectedBooking = booking;
      vm.showDetailsModal = true;
    };
    
    vm.closeDetailsModal = function() {
      vm.showDetailsModal = false;
    };
    
    // Confirm booking
    vm.confirmBooking = function(booking) {
      vm.loading = true;
      vm.error = '';
      
      ApiService.updateBookingStatus(booking._id, 'Confirmed')
        .then(function(response) {
          booking.status = 'Confirmed';
          vm.success = 'Booking confirmed successfully';
          vm.loading = false;
          
          // Clear success message after 3 seconds
          setTimeout(function() {
            $scope.$apply(function() {
              vm.success = '';
            });
          }, 3000);
        })
        .catch(function(error) {
          console.error('Error confirming booking:', error);
          vm.error = 'Failed to confirm booking';
          vm.loading = false;
        });
    };
    
    // Cancel booking
    vm.cancelBooking = function(booking) {
      if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
      }
      
      vm.loading = true;
      vm.error = '';
      
      ApiService.updateBookingStatus(booking._id, 'Cancelled')
        .then(function(response) {
          booking.status = 'Cancelled';
          vm.success = 'Booking cancelled successfully';
          vm.loading = false;
          
          // Clear success message after 3 seconds
          setTimeout(function() {
            $scope.$apply(function() {
              vm.success = '';
            });
          }, 3000);
        })
        .catch(function(error) {
          console.error('Error cancelling booking:', error);
          vm.error = 'Failed to cancel booking';
          vm.loading = false;
        });
    };
    
    // Apply filters and sorting
    vm.applyFilters = function() {
      vm.filteredBookings = vm.bookings.filter(function(booking) {
        // Apply status filter
        if (vm.statusFilter && booking.status !== vm.statusFilter) {
          return false;
        }
        
        // Apply payment status filter
        if (vm.paymentStatusFilter && booking.paymentStatus !== vm.paymentStatusFilter) {
          return false;
        }
        
        // Apply date range filter
        if (vm.startDate) {
          var pickupDate = new Date(booking.pickupDate);
          if (pickupDate < vm.startDate) {
            return false;
          }
        }
        
        if (vm.endDate) {
          var dropoffDate = new Date(booking.dropoffDate);
          if (dropoffDate > vm.endDate) {
            return false;
          }
        }
        
        // Apply search term filter
        if (vm.searchTerm) {
          var searchLower = vm.searchTerm.toLowerCase();
          var userMatch = booking.user && booking.user.username && 
                         booking.user.username.toLowerCase().includes(searchLower);
          var emailMatch = booking.user && booking.user.email && 
                         booking.user.email.toLowerCase().includes(searchLower);
          var carMatch = booking.car && booking.car.name && 
                       booking.car.name.toLowerCase().includes(searchLower);
          var locationMatch = booking.pickupLocation && 
                           booking.pickupLocation.toLowerCase().includes(searchLower);
          var idMatch = booking._id && booking._id.toLowerCase().includes(searchLower);
          
          return userMatch || emailMatch || carMatch || locationMatch || idMatch;
        }
        
        return true;
      });
      
      // Apply sorting
      vm.filteredBookings.sort(function(a, b) {
        var aValue, bValue;
        
        switch(vm.sortBy) {
          case 'createdAt':
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
            break;
          case 'pickupDate':
            aValue = new Date(a.pickupDate);
            bValue = new Date(b.pickupDate);
            break;
          case 'totalAmount':
            aValue = a.totalAmount;
            bValue = b.totalAmount;
            break;
          default:
            aValue = a[vm.sortBy];
            bValue = b[vm.sortBy];
        }
        
        if (aValue === bValue) return 0;
        
        var comparison = aValue > bValue ? 1 : -1;
        return vm.sortReverse ? -comparison : comparison;
      });
    };
    
    // Update booking status
    vm.updateStatus = function(booking, newStatus) {
      booking.updating = true;
      vm.error = '';
      vm.success = '';
      
      ApiService.updateBookingStatus(booking._id, newStatus)
        .then(function(response) {
          booking.status = newStatus;
          booking.updating = false;
          vm.success = 'Booking status updated successfully';
        })
        .catch(function(error) {
          console.error('Error updating booking status:', error);
          vm.error = 'Failed to update booking status';
          booking.updating = false;
        });
    };
    
    // Format date for display
    vm.formatDate = function(dateString) {
      return new Date(dateString).toLocaleDateString();
    };
    
    // Calculate booking duration in days
    vm.calculateDuration = function(pickupDate, dropoffDate) {
      var pickup = new Date(pickupDate);
      var dropoff = new Date(dropoffDate);
      var days = Math.ceil((dropoff - pickup) / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    };
    
    // Set sort field
    vm.setSortBy = function(field) {
      if (vm.sortBy === field) {
        vm.sortReverse = !vm.sortReverse;
      } else {
        vm.sortBy = field;
        vm.sortReverse = true;
      }
      vm.applyFilters();
    };
    
    // Reset filters
    vm.resetFilters = function() {
      vm.searchTerm = '';
      vm.statusFilter = '';
      vm.applyFilters();
    };
    
    // Watch for filter changes
    $scope.$watch('adminBooking.searchTerm', function() {
      vm.applyFilters();
    });
    
    $scope.$watch('adminBooking.statusFilter', function() {
      vm.applyFilters();
    });
    
    // Initialize
    vm.loadBookings();
  }]);