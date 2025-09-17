// app/controllers/profile.controller.js
angular.module('motofyApp').controller('ProfileController', ['$scope', '$http', '$location', '$timeout', function($scope, $http, $location, $timeout) {
    
    // Initialize profile object
    $scope.profile = {
        user: null,
        editMode: false,
        loading: true,
        error: null,
        success: null,
        profilePicturePreview: null,
        showPasswordModalVisible: false,
        showDeactivateAccountModalVisible: false,
        passwordData: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        },
        passwordLoading: false,
        deactivateLoading: false
    };

    // Check if user is logged in
    function checkAuth() {
        const token = localStorage.getItem('appToken');
        if (!token) {
            $location.path('/');
            return false;
        }
        return true;
    }

    // Load user profile
    function loadProfile() {
        if (!checkAuth()) return;

        $scope.profile.loading = true;
        $scope.profile.error = null;

        const token = localStorage.getItem('appToken');
        
        $http({
            method: 'GET',
            url: 'http://localhost:5000/api/profile',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        }).then(function(response) {
            $scope.profile.loading = false;
            $scope.profile.user = response.data.user;
            
            // Initialize address if not exists
            if (!$scope.profile.user.address) {
                $scope.profile.user.address = {
                    street: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: 'India'
                };
            }
            
            // Initialize preferences if not exists
            if (!$scope.profile.user.preferences) {
                $scope.profile.user.preferences = {
                    emailNotifications: true,
                    smsNotifications: false
                };
            }
            
        }).catch(function(error) {
            console.error('Error loading profile:', error);
            $scope.profile.loading = false;
            $scope.profile.error = error.data?.message || 'Failed to load profile';
            
            if (error.status === 401) {
                localStorage.removeItem('appToken');
                $location.path('/');
            }
        });
    }

    // Toggle edit mode
    $scope.profile.toggleEditMode = function() {
        $scope.profile.editMode = !$scope.profile.editMode;
        $scope.profile.error = null;
        $scope.profile.success = null;
    };

    // Cancel edit mode
    $scope.profile.cancelEdit = function() {
        $scope.profile.editMode = false;
        $scope.profile.user = angular.copy($scope.profile.originalUser);
        $scope.profile.profilePicturePreview = null;
        $scope.profile.selectedProfilePicture = null;
        $scope.profile.selectedLicense = null;
    };

    // Save profile changes
    $scope.profile.saveProfile = function() {
        if (!validateProfile()) return;

        $scope.profile.loading = true;
        $scope.profile.error = null;
        $scope.profile.success = null;

        const token = localStorage.getItem('appToken');
        
        const formData = new FormData();

        // Add user data
        formData.append('username', $scope.profile.user.username);
        formData.append('phone', $scope.profile.user.phone || '');
        
        // Add address data
        if ($scope.profile.user.address) {
            formData.append('address[street]', $scope.profile.user.address.street || '');
            formData.append('address[city]', $scope.profile.user.address.city || '');
            formData.append('address[state]', $scope.profile.user.address.state || '');
            formData.append('address[zipCode]', $scope.profile.user.address.zipCode || '');
            formData.append('address[country]', $scope.profile.user.address.country || 'India');
        }

        // Add preferences
        if ($scope.profile.user.preferences) {
            formData.append('preferences[emailNotifications]', $scope.profile.user.preferences.emailNotifications);
            formData.append('preferences[smsNotifications]', $scope.profile.user.preferences.smsNotifications);
        }

        // Add files if selected
        if ($scope.profile.selectedProfilePicture) {
            formData.append('profilePicture', $scope.profile.selectedProfilePicture);
        }
        if ($scope.profile.selectedLicense) {
            formData.append('drivingLicense', $scope.profile.selectedLicense);
        }

        $http({
            method: 'PUT',
            url: 'http://localhost:5000/api/profile',
            data: formData,
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': undefined
            }
        }).then(function(response) {
            $scope.profile.user = response.data.user;
            $scope.profile.editMode = false;
            $scope.profile.loading = false;
            $scope.profile.success = 'Profile updated successfully!';
            $scope.profile.profilePicturePreview = null;
            $scope.profile.selectedProfilePicture = null;
            $scope.profile.selectedLicense = null;
            
            // Clear success message after 3 seconds
            $timeout(function() {
                $scope.profile.success = null;
            }, 3000);
            
        }).catch(function(error) {
            console.error('Profile update failed:', error);
            
            let errorMessage = 'Failed to update profile';
            if (error.status === 401) {
                errorMessage = 'Authentication failed. Please login again.';
            } else if (error.status === 403) {
                errorMessage = 'You do not have permission to update this profile.';
            } else if (error.data?.message) {
                errorMessage = error.data.message;
            }
            
            $scope.profile.error = errorMessage;
            $scope.profile.loading = false;
        });
    };

    // Validate profile data
    function validateProfile() {
        if (!$scope.profile.user.username || $scope.profile.user.username.trim() === '') {
            $scope.profile.error = 'Username is required';
            return false;
        }

        if ($scope.profile.user.phone && !isValidPhone($scope.profile.user.phone)) {
            $scope.profile.error = 'Please enter a valid phone number';
            return false;
        }

        return true;
    }

    // Validate phone number
    function isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    // Handle profile picture selection
    $scope.profile.onProfilePictureSelect = function(files) {
        if (files && files.length > 0) {
            const file = files[0];
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                $scope.profile.error = 'Please select a valid image file';
                return;
            }
            
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                $scope.profile.error = 'Image size should be less than 5MB';
                return;
            }
            
            $scope.profile.selectedProfilePicture = file;
            
            // Create preview
            const reader = new FileReader();
            reader.onload = function(e) {
                $scope.$apply(function() {
                    $scope.profile.profilePicturePreview = e.target.result;
                });
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove profile picture preview
    $scope.profile.removeProfilePicturePreview = function() {
        $scope.profile.profilePicturePreview = null;
        $scope.profile.selectedProfilePicture = null;
    };

    // Handle driving license selection
    $scope.profile.onLicenseSelect = function(files) {
        if (files && files.length > 0) {
            const file = files[0];
            
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!validTypes.includes(file.type)) {
                $scope.profile.error = 'Please select a valid image (JPG, PNG) or PDF file';
                return;
            }
            
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                $scope.profile.error = 'File size should be less than 5MB';
                return;
            }
            
            $scope.profile.selectedLicense = file;
            $scope.profile.success = 'License file selected: ' + file.name;
            
            // Clear success message after 3 seconds
            $timeout(function() {
                $scope.profile.success = null;
            }, 3000);
        }
    };

    // Get profile picture URL
    $scope.profile.getProfilePictureUrl = function(profilePicture) {
        if ($scope.profile.profilePicturePreview) {
            return $scope.profile.profilePicturePreview;
        }
        if (profilePicture) {
            return '/uploads/profile-pictures/' + profilePicture;
        }
        return '/assets/images/default-avatar.svg';
    };

    // Get driving license URL
    $scope.profile.getDrivingLicenseUrl = function(drivingLicense) {
        if (drivingLicense) {
            return '/uploads/driving-licenses/' + drivingLicense;
        }
        return null;
    };

    // Show password modal
    $scope.profile.showPasswordModal = function() {
        $scope.profile.showPasswordModalVisible = true;
        $scope.profile.passwordData = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        };
    };

    // Close change password modal
    // Close change password modal
    $scope.profile.closePasswordModal = function() {
        $scope.profile.showPasswordModalVisible = false;
        $scope.profile.passwordData = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        };
    };

    // Change password
    $scope.profile.changePassword = function() {
        // Validate passwords
        if (!$scope.profile.passwordData.currentPassword) {
            $scope.profile.error = 'Current password is required';
            return;
        }
        
        if (!$scope.profile.passwordData.newPassword || $scope.profile.passwordData.newPassword.length < 6) {
            $scope.profile.error = 'New password must be at least 6 characters long';
            return;
        }
        
        if ($scope.profile.passwordData.newPassword !== $scope.profile.passwordData.confirmPassword) {
            $scope.profile.error = 'New passwords do not match';
            return;
        }

        $scope.profile.passwordLoading = true;
        $scope.profile.error = null;

        const token = localStorage.getItem('appToken');
        
        $http({
            method: 'PUT',
            url: 'http://localhost:5000/api/profile/change-password',
            data: {
                currentPassword: $scope.profile.passwordData.currentPassword,
                newPassword: $scope.profile.passwordData.newPassword
            },
            headers: {
                'Authorization': 'Bearer ' + token
            }
        }).then(function(response) {
            $scope.profile.passwordLoading = false;
            $scope.profile.closePasswordModal();
            $scope.profile.success = 'Password changed successfully!';
            
            // Clear success message after 3 seconds
            $timeout(function() {
                $scope.profile.success = null;
            }, 3000);
            
        }).catch(function(error) {
            console.error('Error changing password:', error);
            $scope.profile.error = error.data?.message || 'Failed to change password';
            $scope.profile.passwordLoading = false;
        });
    };

    // Show deactivate account modal
    $scope.profile.showDeactivateAccountModal = function() {
        $scope.profile.showDeactivateAccountModalVisible = true;
    };

    // Close deactivate account modal
    $scope.profile.closeDeactivateAccountModal = function() {
        $scope.profile.showDeactivateAccountModalVisible = false;
    };

    // Deactivate account
    $scope.profile.deactivateAccount = function() {
        $scope.profile.deactivateLoading = true;
        $scope.profile.error = null;

        const token = localStorage.getItem('appToken');
        
        $http({
            method: 'PUT',
            url: 'http://localhost:5000/api/profile/deactivate',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        }).then(function(response) {
            $scope.profile.deactivateLoading = false;
            $scope.profile.closeDeactivateAccountModal();
            
            // Clear token and redirect to home
            localStorage.removeItem('appToken');
            $location.path('/');
            
            // Show success message (this might not be visible due to redirect)
            alert('Account deactivated successfully. You can reactivate by contacting support.');
            
        }).catch(function(error) {
            console.error('Error deactivating account:', error);
            $scope.profile.error = error.data?.message || 'Failed to deactivate account';
            $scope.profile.deactivateLoading = false;
        });
    };

    // Initialize controller
    function init() {
        loadProfile();
    }

    // Start initialization
    init();
}]);