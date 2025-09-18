angular.module('motofyApp')
  .controller('AdminUserController', ['$scope', 'ApiService', '$timeout', function($scope, ApiService, $timeout) {
    var vm = this;
    
    // Initialize properties
    vm.users = [];
    vm.filteredUsers = [];
    vm.searchQuery = '';
    vm.sortKey = 'username';
    vm.sortReverse = false;
    vm.statusFilter = 'all';
    vm.loading = false;
    vm.error = null;
    vm.success = null;
    vm.selectedUser = null;
    vm.userBookings = [];
    vm.loadingBookings = false;
    vm.viewMode = 'list'; // 'list' | 'detail'
    vm.editMode = false;
    vm.originalUser = null;
    
    // Initialize controller
    vm.init = function() {
      vm.loadUsers();
    };
    
    // Load all users
    vm.loadUsers = function() {
      vm.loading = true;
      vm.error = null;
      
      ApiService.getAllUsers()
        .then(function(response) {
          vm.users = response.data;
          vm.applyFilters();
          vm.loading = false;
        })
        .catch(function(error) {
          vm.error = 'Failed to load users: ' + (error.data?.message || error.message || 'Unknown error');
          vm.loading = false;
        });
    };
    
    // Apply filters and sorting
    vm.applyFilters = function() {
      // First apply status filter
      var filtered = vm.users;
      if (vm.statusFilter !== 'all') {
        filtered = filtered.filter(function(user) {
          return user.status === vm.statusFilter;
        });
      }
      
      // Then apply search filter
      if (vm.searchQuery) {
        var query = vm.searchQuery.toLowerCase();
        filtered = filtered.filter(function(user) {
          return user.username.toLowerCase().includes(query) || 
                 user.email.toLowerCase().includes(query);
        });
      }
      
      // Apply sorting
      filtered.sort(function(a, b) {
        var aValue = a[vm.sortKey];
        var bValue = b[vm.sortKey];
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (aValue < bValue) return vm.sortReverse ? 1 : -1;
        if (aValue > bValue) return vm.sortReverse ? -1 : 1;
        return 0;
      });
      
      vm.filteredUsers = filtered;
    };
    
    // Sort by column
    vm.sortBy = function(key) {
      if (vm.sortKey === key) {
        vm.sortReverse = !vm.sortReverse;
      } else {
        vm.sortKey = key;
        vm.sortReverse = false;
      }
      vm.applyFilters();
    };
    
    // View user details
    vm.viewUserDetails = function(user) {
      vm.selectedUser = user;
      vm.viewMode = 'detail';
      vm.loadUserBookings(user._id);
    };

    // Back to user list
    vm.backToList = function() {
      vm.viewMode = 'list';
      vm.selectedUser = null;
      vm.userBookings = [];
      vm.editMode = false;
      vm.originalUser = null;
    };

    // Enable edit mode
    vm.enableEdit = function() {
      vm.editMode = true;
      vm.originalUser = angular.copy(vm.selectedUser);
      
      // Initialize address and preferences objects if they don't exist
      if (!vm.selectedUser.address) {
        vm.selectedUser.address = {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'India'
        };
      }
      
      if (!vm.selectedUser.preferences) {
        vm.selectedUser.preferences = {
          emailNotifications: true,
          smsNotifications: true
        };
      }
    };

    // Cancel edit mode
    vm.cancelEdit = function() {
      vm.editMode = false;
      vm.selectedUser = angular.copy(vm.originalUser);
      vm.originalUser = null;
    };

    // Save user changes
    vm.saveUser = function() {
      if (!vm.selectedUser || !vm.selectedUser._id) {
        vm.showAlert('Error: No user selected', 'error');
        return;
      }

      // Prepare user data for update
      var userData = {
        username: vm.selectedUser.username,
        email: vm.selectedUser.email,
        phone: vm.selectedUser.phone,
        address: vm.selectedUser.address,
        preferences: vm.selectedUser.preferences,
        status: vm.selectedUser.status
      };

      ApiService.updateUser(vm.selectedUser._id, userData)
        .then(function(response) {
          vm.showAlert('User updated successfully', 'success');
          vm.editMode = false;
          // Update the user in the users list
          var userIndex = vm.users.findIndex(function(user) {
            return user._id === vm.selectedUser._id;
          });
          if (userIndex !== -1) {
            vm.users[userIndex] = angular.copy(vm.selectedUser);
          }
        })
        .catch(function(error) {
          console.error('Error updating user:', error);
          vm.showAlert('Error updating user: ' + (error.data?.message || 'Unknown error'), 'error');
        });
    };
    
    // Load user bookings
    vm.loadUserBookings = function(userId) {
      vm.loadingBookings = true;
      
      ApiService.getUserBookingsByAdmin(userId)
        .then(function(response) {
          vm.userBookings = response.data;
          vm.loadingBookings = false;
        })
        .catch(function(error) {
          console.error('Failed to load user bookings:', error);
          vm.userBookings = [];
          vm.loadingBookings = false;
        });
    };
    
    // Update user status
    vm.updateUserStatus = function(user, status) {
      ApiService.updateUserStatus(user._id, { status: status })
        .then(function(response) {
          // Update user in the list
          var index = vm.users.findIndex(function(u) { return u._id === user._id; });
          if (index !== -1) {
            vm.users[index].status = status;
            if (vm.selectedUser && vm.selectedUser._id === user._id) {
              vm.selectedUser.status = status;
            }
          }
          
          vm.success = 'User status updated successfully';
          $timeout(function() { vm.success = null; }, 3000);
          vm.applyFilters();
        })
        .catch(function(error) {
          vm.error = 'Failed to update user status: ' + (error.data?.message || error.message || 'Unknown error');
          $timeout(function() { vm.error = null; }, 3000);
        });
    };
    
    // Format date
    vm.formatDate = function(dateString) {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString();
    };
    
    // Get time ago
    vm.getTimeAgo = function(dateString) {
      if (!dateString) return 'N/A';
      
      var date = new Date(dateString);
      var now = new Date();
      var seconds = Math.floor((now - date) / 1000);
      
      if (seconds < 60) return seconds + ' seconds ago';
      
      var minutes = Math.floor(seconds / 60);
      if (minutes < 60) return minutes + ' minutes ago';
      
      var hours = Math.floor(minutes / 60);
      if (hours < 24) return hours + ' hours ago';
      
      var days = Math.floor(hours / 24);
      if (days < 30) return days + ' days ago';
      
      var months = Math.floor(days / 30);
      if (months < 12) return months + ' months ago';
      
      var years = Math.floor(months / 12);
      return years + ' years ago';
    };
    
    // Watch for filter changes
    $scope.$watch('adminUser.searchQuery', function() {
      vm.applyFilters();
    });
    
    $scope.$watch('adminUser.statusFilter', function() {
      vm.applyFilters();
    });
    
    // License handling methods for admin
    vm.getLicenseUrl = function(licenseFileName) {
      if (!licenseFileName) return '';
      return 'http://localhost:5000/uploads/driving-licenses/' + licenseFileName;
    };
    
    vm.getLicenseFileName = function(licenseFileName) {
      if (!licenseFileName) return 'N/A';
      return licenseFileName.split('-').slice(2).join('-') || licenseFileName;
    };
    
    vm.isImageFile = function(fileName) {
      if (!fileName) return false;
      var imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      var extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
      return imageExtensions.includes(extension);
    };
    
    // Profile picture handling method for admin
    vm.getProfilePictureUrl = function(profilePicture) {
      if (!profilePicture) return 'assets/images/default-avatar.svg';
      return 'http://localhost:5000/uploads/profile-pictures/' + profilePicture;
    };
    
    vm.downloadLicense = function(user) {
      if (!user.drivingLicense) {
        vm.error = 'No license document available for download';
        $timeout(function() { vm.error = null; }, 3000);
        return;
      }
      
      var licenseUrl = vm.getLicenseUrl(user.drivingLicense);
      var link = document.createElement('a');
      link.href = licenseUrl;
      link.download = vm.getLicenseFileName(user.drivingLicense);
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  }]);