const chatService = require("../../services/chatService");
const { v4: uuidv4 } = require("uuid");

// POST /api/chat - Send a message to the chatbot
const sendMessage = async (req, res) => {
  try {
    const { message, sessionId, configId } = req.body;

    // Validate required fields
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // Use default config if none provided
    const finalConfigId = configId || "default";

    // Generate session ID if not provided
    const chatSessionId = sessionId || uuidv4();

    // Generate response
    const result = await chatService.generateResponse(
      message,
      chatSessionId,
      finalConfigId
    );

    res.status(200).json({
      success: true,
      data: {
        response: result.response,
        sources: result.sources,
        sessionId: chatSessionId,
      },
      message: "Response generated successfully",
    });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate response",
      error: error.message,
    });
  }
};

// DELETE /api/chat/session/:sessionId - Clear conversation history
const clearConversation = async (req, res) => {
  try {
    const { sessionId } = req.params;

    await chatService.clearConversation(sessionId);

    res.status(200).json({
      success: true,
      message: "Conversation history cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing conversation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear conversation",
      error: error.message,
    });
  }
};

// GET /api/chat/history/:sessionId - Get conversation history
const getConversationHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const memoryService = require("../../services/memory");

    const history = await memoryService.getConversationHistory(sessionId);

    res.status(200).json({
      success: true,
      data: {
        history: history.map((msg) => ({
          type: msg._getType(),
          content: msg.content,
          timestamp: new Date().toISOString(),
        })),
      },
      message: "Conversation history retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting conversation history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get conversation history",
      error: error.message,
    });
  }
};

// GET /api/chat/test-search/:query - Test vector search (debug endpoint)
const testVectorSearch = async (req, res) => {
  try {
    const { query } = req.params;
    const vectorStore = require("../../services/vectorStore");

    const results = await vectorStore.searchSimilarDocuments(query, 5);

    res.status(200).json({
      success: true,
      data: {
        query: query,
        results: results.map((doc) => ({
          content: doc.pageContent,
          metadata: doc.metadata,
        })),
      },
      message: `Found ${results.length} results for query: ${query}`,
    });
  } catch (error) {
    console.error("Error testing vector search:", error);
    res.status(500).json({
      success: false,
      message: "Failed to test vector search",
      error: error.message,
    });
  }
};

// GET /api/chat/config/:configId - Get specific chatbot configuration (debug endpoint)
const getChatbotConfig = async (req, res) => {
  try {
    const { configId } = req.params;
    
    let config;
    if (configId === "all") {
      config = await chatService.getAllChatbotConfigs();
    } else {
      config = await chatService.getChatbotConfig(configId);
    }

    res.status(200).json({
      success: true,
      data: config,
      message: configId === "all" ? "All configurations retrieved" : "Configuration retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting chatbot config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get chatbot configuration",
      error: error.message,
    });
  }
};

module.exports = {
  sendMessage,
  clearConversation,
  getConversationHistory,
  testVectorSearch,
  getChatbotConfig,
};