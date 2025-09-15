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
    vm.analyticsData = {};
    vm.selectedTimeFilter = 'all';
    vm.charts = {
      statusPieChart: null,
      trendLineChart: null
    };

    // Default active section
    vm.activeSection = 'dashboard';
    vm.activeAnalyticsModule = 'booking';
    vm.bookingAnalytics = {};
    vm.revenueAnalytics = {};
    vm.userAnalytics = {};
    vm.carAnalytics = {};
    vm.charts = {
      bookingStatusChart: null,
      bookingTrendChart: null,
      revenueTrendChart: null,
      topRevenueChart: null,
      userStatusChart: null,
      userRegistrationChart: null,
      carAvailabilityChart: null,
      popularCarsChart: null
    };

    // Function to change section
    vm.showSection = function(section) {
      console.log('🔄 Switching to section:', section);
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

    // Visit User Page
    vm.visitUserPage = function() {
      $location.path('/');
    };

    // Logout
    vm.logout = function() {
      $window.localStorage.removeItem('adminToken');
      $window.localStorage.removeItem('adminData');
      $location.path('/');
    };

    // Switch analytics module
    vm.switchAnalyticsModule = function(module) {
      vm.activeAnalyticsModule = module;
      vm.loadModuleData(module);
    };
    
    // Load all analytics data
    vm.loadAllAnalytics = function() {
      vm.loadModuleData(vm.activeAnalyticsModule);
    };
    
    // Chart fullscreen functionality
    vm.toggleFullscreen = function(chartId) {
      var chartElement = document.getElementById(chartId);
      if (!chartElement) return;
      
      var chartContainer = chartElement.closest('.chart-card');
      if (!chartContainer) return;
      
      if (!document.fullscreenElement) {
        chartContainer.requestFullscreen().then(function() {
          chartContainer.classList.add('fullscreen-chart');
          // Resize chart after entering fullscreen
          setTimeout(function() {
            var chart = vm.getChartInstance(chartId);
            if (chart) {
              chart.resize();
            }
          }, 100);
        }).catch(function(err) {
          console.error('Error entering fullscreen:', err);
        });
      } else {
        document.exitFullscreen().then(function() {
          chartContainer.classList.remove('fullscreen-chart');
          // Resize chart after exiting fullscreen
          setTimeout(function() {
            var chart = vm.getChartInstance(chartId);
            if (chart) {
              chart.resize();
            }
          }, 100);
        });
      }
    };
    
    // Chart download functionality
    vm.downloadChart = function(chartId) {
      var chart = vm.getChartInstance(chartId);
      if (!chart) {
        console.error('Chart not found:', chartId);
        return;
      }
      
      try {
        var canvas = chart.canvas;
        var url = canvas.toDataURL('image/png');
        var link = document.createElement('a');
        link.download = chartId + '_' + new Date().toISOString().split('T')[0] + '.png';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error downloading chart:', error);
      }
    };
    
    // Refresh chart functionality
    vm.refreshChart = function(chartId) {
      var chart = vm.getChartInstance(chartId);
      if (chart) {
        chart.update('active');
      }
      // Reload data for the current module
      vm.loadModuleData(vm.activeAnalyticsModule);
    };
    
    // Get chart instance by ID
    vm.getChartInstance = function(chartId) {
      switch(chartId) {
        case 'bookingStatusChart':
          return vm.charts.bookingStatusChart;
        case 'bookingTrendChart':
          return vm.charts.bookingTrendChart;
        case 'revenueTrendChart':
          return vm.charts.revenueTrendChart;
        case 'topRevenueChart':
          return vm.charts.topRevenueChart;
        case 'userStatusChart':
          return vm.charts.userStatusChart;
        case 'userRegistrationChart':
          return vm.charts.userRegistrationChart;
        case 'carAvailabilityChart':
          return vm.charts.carAvailabilityChart;
        case 'popularCarsChart':
          return vm.charts.popularCarsChart;
        default:
          return null;
      }
    };
    
    // Load specific module data
    vm.loadModuleData = function(module) {
      switch(module) {
        case 'booking':
          vm.loadBookingAnalytics();
          break;
        case 'revenue':
          vm.loadRevenueAnalytics();
          break;
        case 'user':
          vm.loadUserAnalytics();
          break;
        case 'car':
          vm.loadCarAnalytics();
          break;
      }
    };
    
    // Load booking analytics
    vm.loadBookingAnalytics = function() {
      ApiService.getBookingStats(vm.selectedTimeFilter)
        .then(function(response) {
          vm.bookingAnalytics = response.data;
          setTimeout(function() {
            vm.initBookingCharts();
          }, 100);
        })
        .catch(function(error) {
          console.error('Error loading booking analytics:', error);
        });
    };
    
    // Load revenue analytics
    vm.loadRevenueAnalytics = function() {
      ApiService.getRevenueAnalytics(vm.selectedTimeFilter)
        .then(function(response) {
          vm.revenueAnalytics = response.data;
          setTimeout(function() {
            vm.initRevenueCharts();
          }, 100);
        })
        .catch(function(error) {
          console.error('Error loading revenue analytics:', error);
        });
    };
    
    // Load user analytics
    vm.loadUserAnalytics = function() {
      ApiService.getUserAnalytics(vm.selectedTimeFilter)
        .then(function(response) {
          vm.userAnalytics = response.data;
          setTimeout(function() {
            vm.initUserCharts();
          }, 100);
        })
        .catch(function(error) {
          console.error('Error loading user analytics:', error);
        });
    };
    
    // Load car analytics
    vm.loadCarAnalytics = function() {
      ApiService.getCarAnalytics(vm.selectedTimeFilter)
        .then(function(response) {
          vm.carAnalytics = response.data;
          setTimeout(function() {
            vm.initCarCharts();
          }, 100);
        })
        .catch(function(error) {
          console.error('Error loading car analytics:', error);
        });
    };
    
    // Initialize booking charts
    vm.initBookingCharts = function() {
      vm.initBookingStatusChart();
      vm.initBookingTrendChart();
    };
    
    // Initialize revenue charts
    vm.initRevenueCharts = function() {
      vm.initRevenueTrendChart();
      vm.initTopRevenueChart();
    };
    
    // Initialize user charts
    vm.initUserCharts = function() {
      vm.initUserStatusChart();
      vm.initUserRegistrationChart();
    };
    
    // Initialize car charts
    vm.initCarCharts = function() {
      vm.initCarAvailabilityChart();
      vm.initPopularCarsChart();
    };
    
    // Booking status chart
    vm.initBookingStatusChart = function() {
      var ctx = document.getElementById('bookingStatusChart');
      if (!ctx) return;
      
      if (vm.charts.bookingStatusChart) {
        vm.charts.bookingStatusChart.destroy();
      }
      
      var data = vm.bookingAnalytics;
      vm.charts.bookingStatusChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Confirmed', 'Pending', 'Cancelled'],
          datasets: [{
            data: [data.confirmedBookings || 0, data.pendingBookings || 0, data.cancelledBookings || 0],
            backgroundColor: ['#28a745', '#ffc107', '#dc3545']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    };
    
    // Booking trend chart
    vm.initBookingTrendChart = function() {
      var ctx = document.getElementById('bookingTrendChart');
      if (!ctx) return;
      
      if (vm.charts.bookingTrendChart) {
        vm.charts.bookingTrendChart.destroy();
      }
      
      var data = vm.bookingAnalytics;
      var labels = [];
      var bookingData = [];
      
      if (data.bookingTrends) {
        data.bookingTrends.forEach(function(trend) {
          labels.push(trend.date);
          bookingData.push(trend.count);
        });
      }
      
      vm.charts.bookingTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Bookings',
            data: bookingData,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    };
    
    // Revenue trend chart
    vm.initRevenueTrendChart = function() {
      var ctx = document.getElementById('revenueTrendChart');
      if (!ctx) return;
      
      if (vm.charts.revenueTrendChart) {
        vm.charts.revenueTrendChart.destroy();
      }
      
      var data = vm.revenueAnalytics;
      var labels = [];
      var revenueData = [];
      
      if (data.monthlyRevenue) {
        data.monthlyRevenue.forEach(function(item) {
          labels.push(item.month);
          revenueData.push(item.revenue);
        });
      }
      
      vm.charts.revenueTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Revenue (₹)',
            data: revenueData,
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    };
    
    // Top revenue cars chart
    vm.initTopRevenueChart = function() {
      var ctx = document.getElementById('topRevenueChart');
      if (!ctx) return;
      
      if (vm.charts.topRevenueChart) {
        vm.charts.topRevenueChart.destroy();
      }
      
      var data = vm.revenueAnalytics;
      var labels = [];
      var revenueData = [];
      
      if (data.topRevenueCars) {
        data.topRevenueCars.forEach(function(car) {
          labels.push(car.name);
          revenueData.push(car.totalRevenue);
        });
      }
      
      vm.charts.topRevenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Revenue (₹)',
            data: revenueData,
            backgroundColor: '#007bff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    };
    
    // User status chart
    vm.initUserStatusChart = function() {
      var ctx = document.getElementById('userStatusChart');
      if (!ctx) return;
      
      if (vm.charts.userStatusChart) {
        vm.charts.userStatusChart.destroy();
      }
      
      var data = vm.userAnalytics;
      vm.charts.userStatusChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Active', 'Inactive', 'Suspended'],
          datasets: [{
            data: [data.activeUsers || 0, data.inactiveUsers || 0, data.suspendedUsers || 0],
            backgroundColor: ['#28a745', '#6c757d', '#dc3545']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    };
    
    // User registration chart
    vm.initUserRegistrationChart = function() {
      var ctx = document.getElementById('userRegistrationChart');
      if (!ctx) return;
      
      if (vm.charts.userRegistrationChart) {
        vm.charts.userRegistrationChart.destroy();
      }
      
      var data = vm.userAnalytics;
      var labels = [];
      var registrationData = [];
      
      if (data.registrationsByMonth) {
        data.registrationsByMonth.forEach(function(item) {
          labels.push(item.month);
          registrationData.push(item.count);
        });
      }
      
      vm.charts.userRegistrationChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'New Users',
            data: registrationData,
            borderColor: '#17a2b8',
            backgroundColor: 'rgba(23, 162, 184, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    };
    
    // Car availability chart
    vm.initCarAvailabilityChart = function() {
      var ctx = document.getElementById('carAvailabilityChart');
      if (!ctx) return;
      
      if (vm.charts.carAvailabilityChart) {
        vm.charts.carAvailabilityChart.destroy();
      }
      
      var data = vm.carAnalytics;
      vm.charts.carAvailabilityChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Available', 'Unavailable'],
          datasets: [{
            data: [data.availableCars || 0, data.unavailableCars || 0],
            backgroundColor: ['#28a745', '#dc3545']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    };
    
    // Popular cars chart
    vm.initPopularCarsChart = function() {
      var ctx = document.getElementById('popularCarsChart');
      if (!ctx) return;
      
      if (vm.charts.popularCarsChart) {
        vm.charts.popularCarsChart.destroy();
      }
      
      var data = vm.carAnalytics;
      var labels = [];
      var bookingData = [];
      
      if (data.popularCars) {
        data.popularCars.forEach(function(car) {
          labels.push(car.name);
          bookingData.push(car.bookingCount);
        });
      }
      
      vm.charts.popularCarsChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Bookings',
            data: bookingData,
            backgroundColor: '#ffc107'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
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
      // Load analytics data when switching to analytics section
      setTimeout(function() {
        vm.loadAllAnalytics();
      }, 100);
    };

    // Initialize
    if (vm.checkAuth()) {
      vm.loadDashboardData();
    }
  }]);
