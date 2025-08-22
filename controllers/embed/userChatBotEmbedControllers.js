const userChatService = require('../../services/UserChatBotService/UserChatService');
const { v4: uuidv4 } = require('uuid');

// POST /api/embed/user-chatbot - Send message to user's chatbot (public endpoint)
const sendUserChatBotMessage = async (req, res) => {
  try {
    const { message, sessionId, configId } = req.body;

    // Validate required fields
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (!configId) {
      return res.status(400).json({
        success: false,
        message: "Chatbot configuration ID is required",
      });
    }

    // Generate session ID if not provided
    const chatSessionId = sessionId || uuidv4();

    // Generate response using user chat service
    const result = await userChatService.generateResponse(
      message,
      chatSessionId,
      configId
    );

    // Enhance the response with user-friendly formatting
    let enhancedResponse = result.response;
    
    // Add greeting for first message if session is new
    if (!sessionId && !message.toLowerCase().includes('hello') && !message.toLowerCase().includes('hi')) {
      enhancedResponse = `Hello! 👋 ${enhancedResponse}`;
    }

    res.status(200).json({
      success: true,
      data: {
        response: enhancedResponse,
        sources: result.sources || [],
        sessionId: chatSessionId,
        timestamp: new Date().toISOString(),
      },
      message: "Response generated successfully",
    });
  } catch (error) {
    console.error("Error in user chatbot embed endpoint:", error);
    
    // Handle access control and service unavailable cases
    if (error.message.includes("Service temporarily unavailable")) {
      return res.status(503).json({
        success: false,
        message: error.message,
        serviceUnavailable: true
      });
    }
    
    // Handle specific error cases
    if (error.message.includes("not found") || error.message.includes("disabled")) {
      return res.status(404).json({
        success: false,
        message: "Chatbot not found or is currently disabled",
        error: error.message,
      });
    }

    // Handle rate limiting and other service errors
    if (error.message.includes("high demand") || error.message.includes("overloaded") || error.message.includes("timeout")) {
      return res.status(503).json({
        success: false,
        message: error.message,
        serviceUnavailable: true
      });
    }

    res.status(500).json({
      success: false,
      message: "Service temporarily unavailable. Please try again later.",
      error: error.message,
    });
  }
};

// GET /api/embed/user-chatbot/:configId/config - Get user chatbot config for embed (public endpoint)
const getUserChatBotEmbedConfig = async (req, res) => {
  try {
    const { configId } = req.params;

    if (!configId) {
      return res.status(400).json({
        success: false,
        message: "Configuration ID is required",
      });
    }

    // Check access permissions first - COMPLETE ACCESS CONTROL
    const accessCheck = await userChatService.checkChatbotAccess(configId);
    
    if (!accessCheck.hasAccess) {
      console.log(`🚫 Config access denied for chatbot ${configId}: ${accessCheck.reason}`);
      
      // Return appropriate status codes based on the reason
      if (accessCheck.reason === 'CHATBOT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: "Chatbot configuration not found",
        });
      } else {
        // For all other cases (USER_INACTIVE, ORGANIZATION_INACTIVE, CHATBOT_DISABLED)
        return res.status(503).json({
          success: false,
          message: accessCheck.message,
          serviceUnavailable: true,
          reason: accessCheck.reason
        });
      }
    }

    // Get chatbot configuration (we know it exists from access check)
    const config = await userChatService.getUserChatbotConfig(configId);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Chatbot configuration not found",
      });
    }

    // Return only public information needed for embed
    const publicConfig = {
      id: config.id,
      companyName: config.companyName,
      companyCategory: config.companyCategory,
      chatEnabled: config.chatEnabled,
      appearance: config.appearance, // Include appearance settings for widget customization
      // Don't expose sensitive information like instructions or documents
    };

    res.status(200).json({
      success: true,
      data: publicConfig,
      message: "Chatbot configuration retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching user chatbot embed config:", error);
    res.status(500).json({
      success: false,
      message: "Service temporarily unavailable. Please try again later.",
      error: error.message,
    });
  }
};

module.exports = {
  sendUserChatBotMessage,
  getUserChatBotEmbedConfig,
};