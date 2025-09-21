angular.module('motofyApp')
  .controller('AIController', ['$scope', 'ApiService', function($scope, ApiService) {
    // AIController loaded
    
    $scope.ai = {
      messages: [],
      newMessage: '',
      isLoading: false,
      isVisible: false
    };
    
    // Initialize with a welcome message
    $scope.ai.messages.push({
      text: "Hello! I'm your Motofy AI assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date()
    });
    
    $scope.toggleAI = function() {
      $scope.ai.isVisible = !$scope.ai.isVisible;
    };
    
    $scope.closeAI = function() {
      $scope.ai.isVisible = false;
    };
    
    $scope.sendMessage = function() {
      if (!$scope.ai.newMessage.trim()) return;
      
      // Add user message
      $scope.ai.messages.push({
        text: $scope.ai.newMessage,
        isUser: true,
        timestamp: new Date()
      });
      
      var userMessage = $scope.ai.newMessage;
      $scope.ai.newMessage = '';
      $scope.ai.isLoading = true;
      
      // Add typing indicator
      var typingMessage = {
        text: 'AI is typing...',
        isUser: false,
        isTyping: true,
        timestamp: new Date()
      };
      $scope.ai.messages.push(typingMessage);
      
      // Scroll to bottom
      setTimeout(function() {
        var chatContainer = document.querySelector('.ai-chat-messages');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
      
      // Send message to API
      // sendMessage() triggered
      ApiService.sendAIMessage(userMessage)
        .then(function(res) {
          // Remove typing indicator
          var typingIndex = $scope.ai.messages.indexOf(typingMessage);
          if (typingIndex > -1) {
            $scope.ai.messages.splice(typingIndex, 1);
          }
          
          // API Response received
          if (res.data && res.data.response) {
            $scope.ai.messages.push({
              text: res.data.response,
              isUser: false,
              timestamp: new Date()
            });
          } else {
            $scope.ai.messages.push({
              text: "I'm sorry, I couldn't process your request right now. Please try again.",
              isUser: false,
              timestamp: new Date()
            });
          }
          
          $scope.ai.isLoading = false;
          
          // Scroll to bottom after response
          setTimeout(function() {
            var chatContainer = document.querySelector('.ai-chat-messages');
            if (chatContainer) {
              chatContainer.scrollTop = chatContainer.scrollHeight;
            }
          }, 100);
        })
        .catch(function(error) {
          // Remove typing indicator
          var typingIndex = $scope.ai.messages.indexOf(typingMessage);
          if (typingIndex > -1) {
            $scope.ai.messages.splice(typingIndex, 1);
          }
          
          $scope.ai.messages.push({
            text: "Sorry, I'm having trouble connecting right now. Please try again later.",
            isUser: false,
            timestamp: new Date()
          });
          
          $scope.ai.isLoading = false;
        });
    };
    
    // Handle Enter key press
    $scope.handleKeyPress = function(event) {
      if (event.keyCode === 13 && !event.shiftKey) {
        event.preventDefault();
        $scope.sendMessage();
      }
    };
  }]);
