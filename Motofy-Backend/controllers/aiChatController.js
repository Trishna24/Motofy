const axios = require('axios');

// Motofy Assistant Response Templates
const motofyResponses = {
  greeting: {
    reply: "Welcome to Motofy! 🚗 I'm your personal car rental assistant. I can help you find the perfect car, assist with bookings, handle payments, and answer any questions about our services. How can I assist you today?",
    buttons: [
      { text: "🚗 Browse Cars", action: "cars" },
      { text: "ℹ️ General Info", action: "support" },
      { text: "📞 Contact Support", action: "support" }
    ]
  },
  
  booking: {
    reply: "🚗 Easy Car Booking!\n\nQuick Steps:\n1. Browse cars\n2. Select dates & location\n3. Secure payment\n4. Instant confirmation!\n\nNeed: Gmail login + pickup/drop dates\nOptional: Driving license upload",
    buttons: [
      { text: "🚗 Browse Cars Now", action: "cars" },
      { text: "📋 View My Bookings", action: "bookings" },
      { text: "📄 Required Documents", action: "documents" }
    ]
  },

  cars: {
    reply: "🚗 Our Car Collection!\n\n🏠 Family - Spacious & comfortable\n💰 Budget - Affordable options\n✨ Luxury - Premium experience\n⚡ Electric - Eco-friendly\n🚙 SUVs - Adventure ready\n\nIncludes: Full insurance + 24/7 support + Flexible booking",
    buttons: [
      { text: "🚗 View All Cars", action: "cars" },
      { text: "🏠 Family Cars", action: "cars_family" },
      { text: "💰 Budget Cars", action: "cars_budget" },
      { text: "✨ Luxury Cars", action: "cars_luxury" }
    ]
  },

  payment: {
    reply: "💳 Payment Made Simple!\n\n✅ Secure Stripe Payments\n✅ No Hidden Fees\n✅ Instant Confirmation\n\nProcess: Select Car → Review Price → Pay → Book!\n\nAll major cards accepted. 100% secure checkout.",
    buttons: [
      { text: "🚗 Book a Car", action: "cars" },
      { text: "📋 View Bookings", action: "bookings" },
      { text: "👤 My Profile", action: "profile" }
    ]
  },

  documents: {
    reply: "📄 Required Info\n\nEssential:\n✅ Gmail account\n✅ Pickup/drop dates\n✅ Location\n✅ Payment method\n\nOptional:\n📋 Driving license (recommended)\n\nNote: Gmail login gets you started instantly!",
    buttons: [
      { text: "🚗 Start Booking", action: "cars" },
      { text: "👤 Update Profile", action: "profile" },
      { text: "📞 Contact Support", action: "support" }
    ]
  },

  support: {
    reply: "🆘 Need Help?\n\nQuick Fixes:\n• Booking issues? Check internet connection\n• Payment problems? Verify card details\n• Can't find cars? Try different dates\n• Login issues? Use Gmail account\n\n24/7 Support Available!",
    buttons: [
      { text: "🚗 Browse Cars", action: "cars" },
      { text: "📋 My Bookings", action: "bookings" },
      { text: "👤 My Profile", action: "profile" },
      { text: "💬 Chat Again", action: "restart" }
    ]
  },

  login: {
    reply: "🔑 Login & Authentication Help\n\n✅ Quick Login Steps:\n1. Click 'Login' button\n2. Use your Gmail account\n3. Enter your password\n4. Start booking cars!\n\n📝 New to Motofy? Sign up with Gmail for instant access!\n\n🔒 Secure & Fast Authentication",
    buttons: [
      { text: "🔑 Login Now", action: "login" },
      { text: "📝 Sign Up", action: "signup" },
      { text: "🆘 Login Help", action: "support" },
      { text: "🚗 Browse Cars", action: "cars" }
    ]
  },

  off_topic: {
    reply: "🤖 I'm Motofy Assistant!\n\nI help with car rental services:\n\n🚗 Car bookings & rentals\n💳 Payment & pricing\n📋 Managing bookings\n📄 Required documents\n🆘 Customer support\n\nHow can I help with your car rental needs?",
    buttons: [
      { text: "🚗 Browse Cars", action: "cars" },
      { text: "📋 Book a Car", action: "cars" },
      { text: "💡 Get Car Suggestions", action: "suggestions" }
    ]
  },

  general: {
    reply: "🤖 I'm here to help with your car rental needs!\n\nI can assist you with:\n\n🚗 Finding and booking cars\n💳 Payment and pricing info\n📋 Managing your bookings\n📄 Required documents\n🆘 General support\n\nWhat would you like to know more about?",
    buttons: [
      { text: "🚗 Browse Cars", action: "cars" },
      { text: "📋 My Bookings", action: "bookings" },
      { text: "💳 Payment Info", action: "payment" },
      { text: "🆘 Get Help", action: "support" }
    ]
  }
};

// Intent Detection Function
const detectIntent = (message) => {
  const msg = message.toLowerCase().trim();
  
  // Greeting patterns - only match very specific greeting words
  if (msg.match(/^(hi|hello|hey|good morning|good afternoon|good evening|greetings)$/i) || 
      msg.match(/^(hi|hello|hey)\s*(there|motofy|assistant)?$/i) ||
      msg.match(/^(start|begin|welcome)$/i)) {
    return 'greeting';
  }
  
  // Booking related
  if (msg.includes('book') || msg.includes('rent') || msg.includes('reserve') || 
      msg.includes('how to book') || msg.includes('booking process') ||
      msg.includes('rent a car') || msg.includes('book a car')) {
    return 'booking';
  }
  
  // Car listings and suggestions
  if (msg.includes('car') || msg.includes('vehicle') || msg.includes('show cars') ||
      msg.includes('available cars') || msg.includes('car list') || msg.includes('browse') ||
      msg.includes('family car') || msg.includes('luxury car') || msg.includes('budget car') ||
      msg.includes('electric car') || msg.includes('suv') || msg.includes('recommend')) {
    return 'cars';
  }
  
  // Payment related
  if (msg.includes('payment') || msg.includes('pay') || msg.includes('price') ||
      msg.includes('cost') || msg.includes('fee') || msg.includes('charge') ||
      msg.includes('stripe') || msg.includes('card') || msg.includes('billing')) {
    return 'payment';
  }
  
  // Documents and requirements
  if (msg.includes('document') || msg.includes('requirement') || msg.includes('need') ||
      msg.includes('license') || msg.includes('id') || msg.includes('verification') ||
      msg.includes('what do i need') || msg.includes('required')) {
    return 'documents';
  }
  
  // Support related
  if (msg.includes('help') || msg.includes('support') || msg.includes('problem') ||
      msg.includes('issue') || msg.includes('error') || msg.includes('contact') ||
      msg.includes('customer service') || msg.includes('assistance')) {
    return 'support';
  }
  
  // Login/Authentication related
  if (msg.includes('login') || msg.includes('log in') || msg.includes('sign in') ||
      msg.includes('signin') || msg.includes('authenticate') || msg.includes('auth') ||
      msg.includes('signup') || msg.includes('sign up') || msg.includes('register') ||
      msg.includes('registration') || msg.includes('account') || msg.includes('password') ||
      msg.includes('forgot password') || msg.includes('reset password')) {
    return 'login';
  }
  
  // Check if it's clearly off-topic (non-Motofy related)
  const offTopicKeywords = ['weather', 'news', 'sports', 'cooking', 'music', 'movie', 'game', 
                           'politics', 'health', 'education', 'job', 'travel', 'hotel', 'flight'];
  if (offTopicKeywords.some(keyword => msg.includes(keyword))) {
    return 'off_topic';
  }
  
  // Default to general help for unclear messages (not greeting)
  return 'general';
};

// @desc    Motofy AI Assistant
const askAI = async (req, res) => {
  try {
    const { message, userAuth } = req.body;



    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Detect intent from user message
    const intent = detectIntent(message);

    // Get base response for the intent
    let response = motofyResponses[intent] || motofyResponses.off_topic;
    response.intent = intent;

    // Personalize response based on authentication status (for both logged in and non-logged users)
    response = personalizeResponse(response, userAuth || { isLoggedIn: false, isAdmin: false });

    // For complex queries, use Gemini AI with Motofy context
    if (intent === 'off_topic' && message.length > 10) {
      try {
        const motofyContext = `You are Motofy Assistant, a helpful car rental chatbot for Motofy platform. 
        User Authentication Status: ${userAuth ? (userAuth.isLoggedIn ? 'Regular User' : 'Not Logged In') : 'Unknown'}
        
        Motofy offers car rentals with these features:
        - Wide variety of cars (family, budget, luxury, electric, SUVs)
        - Secure Stripe payments
        - Gmail-based authentication
        - 24/7 support
        - Full insurance coverage
        - Flexible booking options
        
        Always stay focused on car rental topics and guide users to book cars, check bookings, or get support.
        If the user is logged in, you can be more personalized in your responses.
        Keep responses concise and helpful.`;

        const geminiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [{
              parts: [{
                text: `${motofyContext}\n\nUser question: ${message}`
              }]
            }]
          },
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        if (geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          response = {
            reply: geminiResponse.data.candidates[0].content.parts[0].text,
            buttons: [
              { text: "🚗 Browse Cars", action: "cars" },
              { text: "📋 My Bookings", action: "bookings" },
              { text: "🆘 Get Support", action: "support" }
            ]
          };
        }
      } catch (geminiError) {
        console.error('Gemini API Error:', geminiError.message);
        // Fall back to predefined response
      }
    }

    // Send predefined response with navigation buttons
    res.json(response);
    
  } catch (error) {
    console.error('Motofy Assistant Error:', error.message);
    res.status(500).json({
      reply: 'Sorry, I encountered an error. Please try again or contact support.',
      buttons: [
        { text: "🔄 Try Again", action: "restart" },
        { text: "🆘 Get Support", action: "support" }
      ]
    });
  }
};

// Function to personalize responses based on user authentication
const personalizeResponse = (response, userAuth) => {
  let personalizedResponse = { ...response };
  
  // Get user name from userAuth (assuming it's passed from frontend)
  const userName = userAuth.name || userAuth.displayName || userAuth.email?.split('@')[0] || '';
  const greeting = userName ? `Hello ${userName}! 👋` : 'Hello! 👋';
  
  if (userAuth.isLoggedIn) {
    // Regular user personalization
    personalizedResponse.reply = `${greeting} Welcome back! 😊\n\n${response.reply}`;
    
    // Ensure bookings and profile buttons are available for logged-in users
    if (!response.buttons.some(btn => btn.action === 'bookings')) {
      personalizedResponse.buttons = [
        ...response.buttons,
        { text: "📋 My Bookings", action: "bookings" }
      ];
    }
    if (!response.buttons.some(btn => btn.action === 'profile')) {
      personalizedResponse.buttons = [
        ...response.buttons,
        { text: "👤 My Profile", action: "profile" }
      ];
    }
  } else {
    // Not logged in - restrict booking-related actions and add funny login prompts
    const loginRestrictedActions = ['booking', 'cars', 'payment'];
    const currentIntent = response.intent || 'general';
    
    if (loginRestrictedActions.includes(currentIntent)) {
      // Provide funny login prompts for restricted actions
      const funnyPrompts = [
        "🤖 Whoa there, speed racer! You need to login first before we can get you behind the wheel! Come on, login and use me! 🏎️",
        "🚗 Hey hey hey! Hold up! You're trying to book a car without logging in? That's like trying to start a car without keys! Login and let me help you! 🔑😄",
        "🎭 Plot twist! I can see you want to book, but you're not logged in! Come on, login and use me - I promise I'm way more helpful when I know who you are! 🎪",
        "🕵️ Mystery guest alert! I'd love to help you book that perfect car, but first... LOGIN! Then come back and use me properly! 🔍✨",
        "🎪 Welcome to the Motofy show! But wait... you need a VIP pass (aka LOGIN) to enjoy the full experience! Come on, login and use me! 🎫🚗",
        "🤷‍♂️ Oops! Looks like you're trying to book without logging in! That's like ordering pizza without giving your address! Login first, then use me! 🍕😂",
        "🚀 Houston, we have a problem! You're not logged in! Login first, then come back and use me for all your car rental needs! 🛸",
        "🎯 Almost there! You just need to login first, then you can use me to book the perfect car! I'm waiting for you! 🎯✨"
      ];
      
      const randomPrompt = funnyPrompts[Math.floor(Math.random() * funnyPrompts.length)];
      
      personalizedResponse.reply = `${greeting}\n\n${randomPrompt}\n\nOnce you login and use me, I can help you with:\n🚗 Booking amazing cars\n💳 Secure payment processing\n📋 Managing all your bookings\n👤 Profile management\n\nCome on, login and let's get started! For now, I can help with general info! 😊`;
      
      // Replace booking-related buttons with login/signup options
      personalizedResponse.buttons = [
        { text: "🔑 Login Now!", action: "login" },
        { text: "📝 Sign Up & Use Me!", action: "signup" },
        { text: "ℹ️ General Info", action: "support" },
        { text: "📞 Contact Support", action: "support" }
      ];
    } else {
      // For non-restricted actions, just add a gentle login suggestion
      personalizedResponse.reply = `${greeting} Welcome to Motofy! 🚗\n\n${response.reply}\n\n💡 Hey! Login and use me for a personalized experience and to access all booking features! I'm much more helpful when I know who you are! 😊`;
      
      // Add login buttons to existing buttons
      personalizedResponse.buttons = [
        ...response.buttons.filter(btn => !['bookings', 'profile'].includes(btn.action)),
        { text: "🔑 Login & Use Me!", action: "login" },
        { text: "📝 Sign Up Now!", action: "signup" }
      ];
    }
  }
  
  return personalizedResponse;
};

module.exports = {
  askAI,
};
