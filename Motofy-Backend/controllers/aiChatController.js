const axios = require('axios');

// @desc    Ask Gemini AI using REST API
const askAI = async (req, res) => {
  const { message } = req.body;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: message }],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const reply =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No response from AI';

    // ✅ Send the AI's real reply to the frontend
    res.json({ reply });
  } catch (error) {
    console.error(
      'Gemini REST API Error:',
      error.response?.data || error.message
    );
    res
      .status(500)
      .json({
        reply: 'Sorry, there was an error processing your request.'
      });
  }
};

module.exports = {
  askAI,
};
