angular.module('motofyApp')
  .controller('AIController', ['ApiService', '$timeout', function(ApiService, $timeout) {
    console.log("✅ AIController loaded");

    var vm = this;
    vm.chatOpen = false;
    vm.input = '';
    vm.messages = [];
    vm.loading = false;

    vm.toggleChat = function() {
      vm.chatOpen = !vm.chatOpen;
      if (vm.chatOpen) {
        $timeout(scrollToBottom, 100);
      }
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
