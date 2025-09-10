// app/services/api.service.js
// Shared AngularJS service for backend API calls

angular.module('motofyApp')
  .factory('ApiService', ['$http', function($http) {
    // Change this to your backend URL if needed
    var BASE_URL = 'http://localhost:5000/api';

    return {
      // Example: User login
      login: function(data) {
        return $http.post(BASE_URL + '/auth/login', data);
      },
      // User signup
      signup: function(data) {
        return $http.post(BASE_URL + '/auth/signup', data);
      },
      // Admin login
      adminLogin: function(data) {
        return $http.post(BASE_URL + '/admin/login', data);
      },
      // Fetch current user's bookings
      getUserBookings: function(token) {
        return $http.get(BASE_URL + '/bookings/my-bookings', {
          headers: { Authorization: 'Bearer ' + token }
        });
      },
      // Cancel a booking by ID
      cancelBooking: function(bookingId, token) {
        return $http.put(BASE_URL + '/bookings/cancel/' + bookingId, {}, {
          headers: { Authorization: 'Bearer ' + token }
        });
      },
      // Send a message to the AI chat endpoint
      askAI: function(data) {
        return $http.post(BASE_URL + '/ai-chat', data);
      },
      // cars crud
      getAllCars: function() {
        return $http.get(BASE_URL + '/cars');
      },
      addCar: function(formData) {
        var adminToken = window.localStorage.getItem('adminToken');
        return $http.post(BASE_URL + '/cars', formData, {
          headers: { 
            'Content-Type': undefined, // let browser set multipart boundary
            'Authorization': 'Bearer ' + adminToken
          }
        });
      },
      updateCar: function(id, formData) {
        var adminToken = window.localStorage.getItem('adminToken');
        return $http.put(BASE_URL + '/cars/' + id, formData, {
          headers: { 
            'Content-Type': undefined,
            'Authorization': 'Bearer ' + adminToken
          }
        });
      },
      deleteCar: function(id) {
        var adminToken = window.localStorage.getItem('adminToken');
        return $http.delete(BASE_URL + '/cars/' + id, {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
      },
      

      // Admin booking management
      getBookingById: function(bookingId) {
          var adminToken = window.localStorage.getItem('adminToken');
          return $http.get(BASE_URL + '/bookings/' + bookingId, {
              headers: { 'Authorization': 'Bearer ' + adminToken }
          });
      },

      getAllBookings: function() {
        var adminToken = window.localStorage.getItem('adminToken');
        return $http.get(BASE_URL + '/bookings/admin/all', {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
      },
      
      updateBooking: function(bookingId, bookingData) {
          var adminToken = window.localStorage.getItem('adminToken');
          return $http.put(BASE_URL + '/bookings/' + bookingId, bookingData, {
              headers: { 'Authorization': 'Bearer ' + adminToken }
          });
      },

      updateBookingStatus: function(bookingId, status) {
        var adminToken = window.localStorage.getItem('adminToken');
        return $http.put(BASE_URL + '/bookings/admin/status/' + bookingId, { status }, {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
      },
      
      getBookingStats: function(timeFilter) {
        var adminToken = window.localStorage.getItem('adminToken');
        var params = timeFilter ? { timeFilter: timeFilter } : {};
        return $http.get(BASE_URL + '/bookings/admin/stats', {
          headers: { 'Authorization': 'Bearer ' + adminToken },
          params: params
        });
      },
      
      // User Management API calls
      getAllUsers: function() {
        var adminToken = window.localStorage.getItem('adminToken');
        return $http.get(BASE_URL + '/admin/users', {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
      },
      
      getUserById: function(userId) {
        var adminToken = window.localStorage.getItem('adminToken');
        return $http.get(BASE_URL + '/admin/users/' + userId, {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
      },
      
      updateUserStatus: function(userId, statusData) {
        var adminToken = window.localStorage.getItem('adminToken');
        return $http.patch(BASE_URL + '/admin/users/' + userId + '/status', statusData, {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
      },
      
      getUserBookingsByAdmin: function(userId) {
        var adminToken = window.localStorage.getItem('adminToken');
        return $http.get(BASE_URL + '/admin/users/' + userId + '/bookings', {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
      },
      
      getUserStats: function() {
        var adminToken = window.localStorage.getItem('adminToken');
        return $http.get(BASE_URL + '/admin/users/stats', {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
      },
      
      // Revenue Analytics API calls
      getRevenueAnalytics: function(timeFilter) {
        var adminToken = window.localStorage.getItem('adminToken');
        var params = {};
        if (timeFilter) {
          params.timeFilter = timeFilter;
        }
        return $http.get(BASE_URL + '/bookings/admin/revenue', {
          headers: { 'Authorization': 'Bearer ' + adminToken },
          params: params
        });
      },
      
      // User Analytics API calls
      getUserAnalytics: function(timeFilter) {
        var adminToken = window.localStorage.getItem('adminToken');
        var params = {};
        if (timeFilter) {
          params.timeFilter = timeFilter;
        }
        return $http.get(BASE_URL + '/admin/users/analytics', {
          headers: { 'Authorization': 'Bearer ' + adminToken },
          params: params
        });
      },
      
      // Car Analytics API calls
      getCarAnalytics: function(timeFilter) {
        var adminToken = window.localStorage.getItem('adminToken');
        var params = {};
        if (timeFilter) {
          params.timeFilter = timeFilter;
        }
        return $http.get(BASE_URL + '/cars/admin/analytics', {
          headers: { 'Authorization': 'Bearer ' + adminToken },
          params: params
        });
      }
    };
  }]);