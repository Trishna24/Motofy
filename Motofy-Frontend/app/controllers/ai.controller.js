angular.module('motofyApp')
  .controller('AIController', ['ApiService', '$timeout', function(ApiService, $timeout) {
    console.log("✅ AIController loaded");

    var vm = this;
    vm.chatOpen = false;
    vm.input = '';
    vm.messages = [];
    vm.loading = false;

    // Array of dynamic welcome messages
    var welcomeMessages = [
      'Hey there! 👋 Welcome to Motofy AI! Ready to find your perfect ride? 🚗✨',
      'Hello! 🌟 I\'m your Motofy AI Assistant! Let\'s get you rolling with the best car deals! 🚙💨',
      'Welcome aboard! 🎉 Your personal car rental expert is here! What adventure are we planning today? 🗺️🚗',
      'Hi! 🤖 Motofy AI at your service! From budget cars to luxury rides - I\'ve got you covered! 💎🚘',
      'Greetings! 🌈 Ready to explore amazing cars? Let\'s make your journey unforgettable! 🛣️✨'
    ];

    vm.toggleChat = function() {
      vm.chatOpen = !vm.chatOpen;
      if (vm.chatOpen) {
        // Send dynamic welcome message if this is the first time opening chat
        if (vm.messages.length === 0) {
          vm.sendDynamicWelcome();
        }
        $timeout(scrollToBottom, 100);
      }
    };

    // Function to send dynamic welcome messages with typing effect
    vm.sendDynamicWelcome = function() {
      var randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      
      // Add typing indicator first
      vm.messages.push({ 
        sender: 'bot', 
        text: '🤖 AI is typing...', 
        isTyping: true 
      });
      scrollToBottom();
      
      // Replace typing indicator with actual message after delay
      $timeout(function() {
        vm.messages[vm.messages.length - 1] = {
          sender: 'bot',
          text: randomMessage,
          isTyping: false
        };
        scrollToBottom();
        
        // Add a follow-up message after another delay
        $timeout(function() {
          vm.messages.push({
            sender: 'bot',
            text: 'Type your question below and I\'ll help you instantly! 💬⚡'
          });
          scrollToBottom();
        }, 1500);
      }, 2000);
    };

    vm.sendMessage = function($event) {
      if ($event) $event.preventDefault();
      console.log("📩 sendMessage() triggered");

      if (!vm.input || !vm.input.trim()) return;

      vm.messages.push({ sender: 'user', text: vm.input });
      scrollToBottom();

      var userInput = vm.input;
      vm.input = '';
      vm.loading = true;

      ApiService.askAI({ message: userInput })
        .then(function(res) {
          console.log("API Response:", res.data);
          vm.messages.push({ sender: 'bot', text: res.data.reply || 'No response.' });
          vm.loading = false;
          scrollToBottom();
        })
        .catch(function(err) {
          console.error("AI Error:", err);
          vm.messages.push({ sender: 'bot', text: 'Sorry, there was an error. Please try again.' });
          vm.loading = false;
          scrollToBottom();
        });
    };

    function scrollToBottom() {
      $timeout(function() {
        var el = document.getElementById('aiChatMessages');
        if (el) el.scrollTop = el.scrollHeight;
      }, 50);
    }
  }]);
