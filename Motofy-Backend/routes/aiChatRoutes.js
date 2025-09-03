// routes/aiChatRoutes.js

const express = require('express');
const router = express.Router();
const { askAI } = require('../controllers/aiChatController');

// POST: Ask AI a question
router.post('/', askAI);

module.exports = router;
