const express = require("express");
const {
  sendMessage,
  clearConversation,
  getConversationHistory,
  testVectorSearch,
  getChatbotConfig,
} = require("../../controllers/chat/chatControllers");

const router = express.Router();

// POST /api/chat - Send a message to the chatbot
router.post("/", sendMessage);

// DELETE /api/chat/session/:sessionId - Clear conversation history
router.delete("/session/:sessionId", clearConversation);

// GET /api/chat/history/:sessionId - Get conversation history
router.get("/history/:sessionId", getConversationHistory);

// GET /api/chat/test-search/:query - Test vector search (debug endpoint)
router.get("/test-search/:query", testVectorSearch);

// GET /api/chat/config/:configId - Get specific chatbot configuration (debug endpoint)
router.get("/config/:configId", getChatbotConfig);

module.exports = router;