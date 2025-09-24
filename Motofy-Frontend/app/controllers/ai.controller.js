angular.module('motofyApp')
  .controller('AIController', ['ApiService', '$timeout', '$location', '$sce', '$window', '$rootScope', function(ApiService, $timeout, $location, $sce, $window, $rootScope) {

    var vm = this;
    vm.chatOpen = false;
    vm.input = '';
    vm.messages = [];
    vm.loading = false;
    vm.welcomeMessageSent = false; // Flag to track if welcome message has been sent

    // Authentication state
    vm.userAuth = {
      isLoggedIn: false,
      isAdmin: false,
      userData: null,
      adminData: null
    };

    // Check authentication status
    vm.checkAuthStatus = function() {
      // Reset authentication state first
      vm.userAuth.isLoggedIn = false;
      vm.userAuth.isAdmin = false;
      vm.userAuth.userData = null;
      vm.userAuth.adminData = null;

      // Check regular user authentication
      var userToken = $window.localStorage.getItem('appToken');
      if (userToken) {
        vm.userAuth.isLoggedIn = true;
        vm.userAuth.isAdmin = false;
        // You can add user data retrieval here if needed
      }

      // Check admin authentication (admin overrides regular user)
      var adminToken = $window.localStorage.getItem('adminToken');
      var adminData = $window.localStorage.getItem('adminData');
      if (adminToken && adminData) {
        try {
          vm.userAuth.isLoggedIn = true;
          vm.userAuth.isAdmin = true;
          vm.userAuth.adminData = JSON.parse(adminData);
        } catch (e) {
          // Error parsing admin data
        }
      }


    };

    // Initialize authentication check
    vm.checkAuthStatus();

    // Enhanced welcome message for Motofy Assistant
    var welcomeMessage = {
      sender: 'bot',
      text: "Hello! 👋 Welcome to Motofy! I'm your personal car rental assistant. I can help you with bookings, finding the perfect car, payments, and answering any questions about our services. How can I assist you today?",
      content: $sce.trustAsHtml("Hello! 👋 Welcome to Motofy! I'm your personal car rental assistant. I can help you with bookings, finding the perfect car, payments, and answering any questions about our services. How can I assist you today?"), // Fix SCE error
      buttons: [
        { text: "🚗 Browse Cars", action: "cars" },
        { text: "📋 My Bookings", action: "bookings" },
        { text: "💳 Payment Help", action: "payment_help" }
      ]
    };

    // Admin welcome message
    var adminWelcomeMessage = {
      sender: 'bot',
      text: "👑 Welcome to Motofy Admin Portal! I can help you navigate to different admin sections. All modifications must be done through the admin dashboard interface.",
      content: $sce.trustAsHtml("👑 Welcome to Motofy Admin Portal! I can help you navigate to different admin sections. All modifications must be done through the admin dashboard interface."),
      buttons: [
        { text: "👑 Admin Dashboard", action: "admin_dashboard" },
        { text: "👥 User Management", action: "admin_users" },
        { text: "🚗 Car Management", action: "admin_cars" },
        { text: "📋 Booking Management", action: "admin_bookings" }
      ]
    };

    vm.toggleChat = function() {
      vm.chatOpen = !vm.chatOpen;
      if (vm.chatOpen) {
        // Check authentication status when chat opens
        vm.checkAuthStatus();
        
        // Only send welcome message if it hasn't been sent yet and there are no messages
        if (vm.messages.length === 0 && !vm.welcomeMessageSent) {
          vm.sendWelcomeMessage();
        }
        $timeout(scrollToBottom, 100);
      } else {
        // Reset chat state when closing
        vm.messages = [];
        vm.welcomeMessageSent = false;
        vm.input = '';
      }
    };

    // Function to send welcome message with typing effect
    vm.sendWelcomeMessage = function() {
      // Check if welcome message has already been sent
      if (vm.welcomeMessageSent) {
        return;
      }

      // Ensure authentication status is checked before sending welcome message
      vm.checkAuthStatus();

      // Add typing indicator first
      vm.messages.push({ 
        sender: 'bot', 
        text: '🤖 Motofy Assistant is typing...', 
        isTyping: true 
      });
      scrollToBottom();
      
      // Replace typing indicator with appropriate welcome message after delay
      $timeout(function() {
        // Choose welcome message based on admin status
        var messageToSend = vm.userAuth.isAdmin ? adminWelcomeMessage : welcomeMessage;
        
        // Personalize the message
        if (vm.userAuth.isAdmin && vm.userAuth.adminData) {
          var adminName = vm.userAuth.adminData.name || vm.userAuth.adminData.email?.split('@')[0] || 'Admin';
          messageToSend = {
            ...adminWelcomeMessage,
            text: `👑 Hello ${adminName}! Welcome back to Motofy Admin Portal! I can help you navigate to different admin sections. All modifications must be done through the admin dashboard interface.`,
            content: $sce.trustAsHtml(`👑 Hello ${adminName}! Welcome back to Motofy Admin Portal! I can help you navigate to different admin sections. All modifications must be done through the admin dashboard interface.`)
          };
        }
        
        vm.messages[vm.messages.length - 1] = messageToSend;
        vm.welcomeMessageSent = true; // Mark welcome message as sent
        scrollToBottom();
      }, 1500);
    };

    vm.sendMessage = function($event) {
      if ($event) $event.preventDefault();

      if (!vm.input || !vm.input.trim()) return;

      // Check auth status before sending message
      vm.checkAuthStatus();

      vm.messages.push({ sender: 'user', text: vm.input });
      scrollToBottom();

      var userInput = vm.input;
      vm.input = '';
      vm.loading = true;

      // Include authentication status in API request
      var requestData = { 
        message: userInput,
        userAuth: vm.userAuth
      };

      ApiService.askAI(requestData)
        .then(function(res) {
          
          // Create message object with buttons if provided
          var botMessage = {
            sender: 'bot',
            text: res.data.reply || 'No response.',
            content: $sce.trustAsHtml(res.data.reply || 'No response.'), // Fix SCE error
            buttons: res.data.buttons || []
          };
          
          vm.messages.push(botMessage);
          vm.loading = false;
          scrollToBottom();
        })
        .catch(function(err) {
          vm.messages.push({ 
            sender: 'bot', 
            text: 'Sorry, there was an error. Please try again.',
            content: $sce.trustAsHtml('Sorry, there was an error. Please try again.'), // Fix SCE error
            buttons: [
              { text: "🔄 Try Again", action: "restart" },
              { text: "🆘 Get Support", action: "support" }
            ]
          });
          vm.loading = false;
          scrollToBottom();
        });
    };

    // Handle navigation button clicks
    vm.handleButtonClick = function(action) {
      // Add user message showing what they clicked
      var actionText = getActionText(action);
      vm.messages.push({ 
        sender: 'user', 
        text: actionText,
        isButtonClick: true 
      });
      scrollToBottom();

      // Handle different navigation actions
      switch(action) {
        case 'cars':
          $location.path('/cars');
          break;
        case 'cars_family':
          $location.path('/cars').search({ category: 'family' });
          break;
        case 'cars_budget':
          $location.path('/cars').search({ category: 'budget' });
          break;
        case 'cars_luxury':
          $location.path('/cars').search({ category: 'luxury' });
          break;
        case 'bookings':
          $location.path('/bookings');
          break;
        case 'profile':
          $location.path('/profile');
          break;
        case 'payment_help':
          // Send payment help message
          vm.sendPredefinedMessage('payment');
          break;
        case 'documents':
          // Send documents info message
          vm.sendPredefinedMessage('documents');
          break;
        case 'support':
          // Send support message
          vm.sendPredefinedMessage('support');
          break;
        case 'restart':
          // Clear chat and restart
          vm.messages = [];
          vm.welcomeMessageSent = false; // Reset welcome message flag
          vm.sendWelcomeMessage();
          break;
        case 'login':
          // Access the main controller through $rootScope or parent scope
          var mainController = angular.element(document.body).scope().main;
          if (mainController && mainController.openLoginModal) {
            mainController.openLoginModal();
          } else {
            console.log("Main controller not found, trying alternative method");
            // Alternative: broadcast event
            $rootScope.$broadcast('openLoginModal');
          }
          break;
        case 'signup':
          // Access the main controller through $rootScope or parent scope
          var mainController = angular.element(document.body).scope().main;
          if (mainController && mainController.openSignupModal) {
            mainController.openSignupModal();
          } else {
            console.log("Main controller not found, trying alternative method");
            // Alternative: broadcast event
            $rootScope.$broadcast('openSignupModal');
          }
          break;
        default:
          // Unknown action
      }
    };

    // Send predefined messages for certain actions
    vm.sendPredefinedMessage = function(type) {
      vm.loading = true;
      
      // Check auth status before sending predefined message
      vm.checkAuthStatus();
      
      $timeout(function() {
        // Include authentication status in predefined message requests
        var requestData = { 
          message: type,
          userAuth: vm.userAuth
        };

        ApiService.askAI(requestData)
          .then(function(res) {
            var botMessage = {
              sender: 'bot',
              text: res.data.reply || 'No response.',
              content: $sce.trustAsHtml(res.data.reply || 'No response.'), // Fix SCE error
              buttons: res.data.buttons || []
            };
            vm.messages.push(botMessage);
            vm.loading = false;
            scrollToBottom();
          })
          .catch(function(err) {
            vm.messages.push({ 
              sender: 'bot', 
              text: 'Sorry, there was an error. Please try again.',
              content: $sce.trustAsHtml('Sorry, there was an error. Please try again.') // Fix SCE error
            });
            vm.loading = false;
            scrollToBottom();
          });
      }, 500);
    };

    // Get user-friendly text for button actions
    function getActionText(action) {
      var actionMap = {
        'cars': '🚗 Show me available cars',
        'cars_family': '🏠 Show me family cars',
        'cars_budget': '💰 Show me budget cars', 
        'cars_luxury': '✨ Show me luxury cars',
        'bookings': '📋 View my bookings',
        'profile': '👤 Go to my profile',
        'payment_help': '💳 I need payment help',
        'documents': '📄 What documents do I need?',
        'support': '🆘 I need support',
        'admin_dashboard': '👑 Go to Admin Dashboard',
        'admin_users': '👥 Manage Users',
        'admin_cars': '🚗 Manage Cars',
        'admin_bookings': '📋 View Bookings',
        'admin_analysis': '📈 View Analytics',
        'restart': '🔄 Start over'
      };
      return actionMap[action] || 'Button clicked';
    }

    function scrollToBottom() {
      $timeout(function() {
        var el = document.getElementById('aiChatMessages');
        if (el) el.scrollTop = el.scrollHeight;
      }, 50);
    }
  }]);
