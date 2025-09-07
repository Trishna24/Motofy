// routes/aiChatRoutes.js

const express = require('express');
const router = express.Router();
const { askAI } = require('../controllers/aiChatController');

// POST: Ask AI a question
router.post('/', askAI);
router.post('https://motofy-l5gq.onrender.com/api/ai-chat', askAI);
module.exports = router;
