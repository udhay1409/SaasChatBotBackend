const { ChatGroq } = require("@langchain/groq");
const { PromptTemplate } = require("@langchain/core/prompts");
const { RunnableSequence } = require("@langchain/core/runnables");
const VectorStoreService = require("./vectorStore");
const memoryService = require("./memory");
const rateLimiter = require("./rate-limit");
const { prisma } = require("../config/database");



class ChatService {
  constructor() {
    // Initialize Groq AI for chat with current stable models
    this.llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      modelName: "llama-3.1-8b-instant", // Most reliable current model
      temperature: 0.7, 
      maxRetries: 3,
      timeout: 60000, // 60 seconds timeout
    });
    console.log("✅ Using Groq AI (llama-3.1-8b-instant) for chat");

    // Initialize fallback model
    this.fallbackLLM = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      modelName: "gemma2-9b-it", // Alternative fallback model
      temperature: 0.5,
      maxRetries: 2,
      timeout: 30000,
    });
    console.log("✅ Fallback: Groq AI (gemma2-9b-it)");
  }

  async getChatbotConfig(configId) {
    try {
      // First try to find in admin chatbots
      let config = await prisma.chatBot.findUnique({
        where: { id: configId },
      });
      
      // If not found, try user chatbots
      if (!config) {
        config = await prisma.userChatBot.findUnique({
          where: { id: configId },
          select: {
            id: true,
            companyName: true,
            companyCategory: true,
            instructions: true,
            chatEnabled: true,
            uploadedDocuments: true,
            createdAt: true,
            updatedAt: true
          }
        });
        
        if (config) {
          // Mark as user chatbot for different handling
          config.isUserChatbot = true;
        }
      }
      
      return config;
    } catch (error) {
      console.error("Error fetching chatbot config:", error);
      throw error;
    }
  }

  async getAllChatbotConfigs() {
    try {
      const configs = await prisma.chatBot.findMany({
        orderBy: { createdAt: "desc" },
      });
      return configs;
    } catch (error) {
      console.error("Error fetching all chatbot configs:", error);
      throw error;
    }
  }

 

  async generateResponse(message, sessionId, configId) {
    try {
      // Get chatbot configuration
      let config = null;
      if (configId && configId !== "default") {
        config = await this.getChatbotConfig(configId);
        console.log(`✅ Using specific config: ${config?.companyName || 'Not found'}`);
      }

      // If no specific config found, try to get the first available config
      if (!config) {
        const allConfigs = await prisma.chatBot.findMany({
          orderBy: { createdAt: "desc" },
          take: 1,
        });
        config = allConfigs[0] || null;
        console.log(`✅ Using fallback config: ${config?.companyName || 'None available'}`);
      }

      // Search for relevant documents using vector store with Gemini embeddings
      let documentContext = "";
      let relevantDocs = [];
      
      try {
        // Create vector store instance for this specific chatbot
        let vectorStore;
        if (config && config.id) {
          // For admin chatbots, use the default index with namespace
          if (!config.isUserChatbot) {
            vectorStore = VectorStoreService.defaultInstance;
          } else {
            // For user chatbots, use separate vector store instance
            vectorStore = new VectorStoreService(config.id);
          }
        } else {
          // Use default vector store for general queries
          vectorStore = VectorStoreService.defaultInstance;
        }
        
        // Search for relevant documents
        relevantDocs = await vectorStore.searchSimilarDocuments(message, 4, {
          configId: config?.id
        });
        
        // If we have a config but no results, also try the default store for admin chatbots
        if (config && relevantDocs.length === 0 && !config.isUserChatbot) {
          const defaultDocs = await VectorStoreService.defaultInstance.searchSimilarDocuments(message, 4);
          relevantDocs = defaultDocs;
        }
        
        if (relevantDocs && relevantDocs.length > 0) {
          // Check if the documents actually contain relevant information for the query
          const queryLower = message.toLowerCase();
          const relevantContent = relevantDocs.filter(doc => {
            const contentLower = doc.pageContent.toLowerCase();
            // Check if document content is actually related to the query
            const queryWords = queryLower.split(' ').filter(word => word.length > 2);
            return queryWords.some(word => contentLower.includes(word)) || 
                   contentLower.includes('company') || 
                   contentLower.includes('policy') ||
                   contentLower.includes('employee') ||
                   contentLower.includes('hr');
          });
          
          if (relevantContent.length > 0) {
            documentContext = relevantContent.map(doc => doc.pageContent).join('\n\n');
            console.log(`✅ Retrieved ${relevantContent.length} relevant documents for query: "${message}"`);
            console.log(`📄 Context preview: ${documentContext.substring(0, 300)}...`);
          } else {
            console.log(`⚠️ Documents found but not relevant to query: "${message}"`);
            documentContext = "No specific information available in knowledge base for this query.";
          }
        } else {
          console.log(`⚠️ No documents found for query: "${message}"`);
          documentContext = "No specific information available in knowledge base for this query.";
        }
      } catch (error) {
        console.warn("⚠️ Vector search failed:", error);
        documentContext = "No specific information available in knowledge base for this query.";
      }

      // Get conversation memory
      const memoryVariables = await memoryService.getMemoryVariables(sessionId);

      // Log configuration details for debugging
      if (config) {
        console.log(`🤖 Chat Config Details:
          - Company: ${config.companyName}
          - Category: ${config.companyCategory}
          - Chat Enabled: ${config.chatEnabled}
          - Documents: ${config.uploadedDocuments?.length || 0}
          - Instructions Length: ${config.instructions?.length || 0} chars`);
      }

      // Create the prompt template based on whether we have config or not
      let promptTemplate;
      let promptVariables;

      if (config) {
        // Enhanced prompt template that uses all configuration data
        promptTemplate = PromptTemplate.fromTemplate(`{instructions}

Company Information:
- Company Name: {companyName}
- Industry: {companyCategory}

Knowledge Base Information:
{documentContext}

Example Conversation Style:
{exampleConversation}

Conversation History:
{history}

RESPONSE GUIDELINES:
1. Always maintain a friendly, professional, and helpful tone
2. Use the company information and knowledge base to provide accurate answers
3. If specific information isn't available in the knowledge base, acknowledge this politely and offer to help in other ways
4. Follow the conversation style shown in the examples above
5. Be conversational and engaging while staying professional
6. If asked about the company name, respond with "{companyName}"
7. For complex queries not covered in the knowledge base, offer to connect the user with the appropriate team

Current User Question: {question}

Please provide a helpful and friendly response:`);

        promptVariables = {
          instructions: config.instructions || `You are an AI assistant for ${config.companyName}.`,
          companyName: config.companyName,
          companyCategory: config.companyCategory || "Business",
          exampleConversation: config.exampleConversation || "Be helpful and professional in your responses.",
          history: memoryVariables.history || "",
          documentContext: documentContext,
          question: message,
        };
      } else {
        // Enhanced fallback prompt for when no config is available
        promptTemplate = PromptTemplate.fromTemplate(`You are a helpful and friendly AI assistant. 

Your role is to:
- Assist users with their questions in a professional and conversational manner
- Provide accurate information when available
- Be honest when you don't have specific information
- Maintain a warm and supportive tone
- Offer to help connect users with appropriate resources when needed

Conversation History:
{history}

Current User Question: {question}

Please provide a helpful and friendly response:`);

        promptVariables = {
          history: memoryVariables.history || "",
          question: message,
        };
      }

      // Create the primary chain
      const primaryChain = RunnableSequence.from([promptTemplate, this.llm]);

      let response;
      let aiResponse;

      try {
        // Check rate limits before making API call
        const rateLimitKey = `groq-api:${sessionId}`;
        const rateLimitStatus = await rateLimiter.waitForRateLimit(
          rateLimitKey,
          30,
          60
        ); // 30 requests per minute for Groq

        if (rateLimitStatus.error) {
          console.warn("⚠️ Rate limiter error, proceeding with caution");
        }

        // Try with primary Groq model first
        response = await primaryChain.invoke(promptVariables);
        aiResponse = response.content;
        console.log("✅ Response generated using Groq AI");
      } catch (primaryError) {
        console.error("Primary Groq model error:", primaryError);

        // Handle various error types
        if (
          primaryError.status === 429 ||
          primaryError.message?.includes("rate limit")
        ) {
          console.log(
            "⚠️ Rate limit hit on primary Groq model, using fallback..."
          );
        } else if (
          primaryError.status === 503 ||
          primaryError.message?.includes("overloaded")
        ) {
          console.log("⚠️ Primary Groq model overloaded, using fallback...");
        } else if (primaryError.message?.includes("timeout")) {
          console.log("⚠️ Primary Groq model timeout, using fallback...");
        } else {
          console.log(
            "⚠️ Unexpected primary Groq model error, using fallback..."
          );
        }

        // Create fallback chain with faster model
        const fallbackChain = RunnableSequence.from([
          promptTemplate,
          this.fallbackLLM,
        ]);

        try {
          // Check rate limits before making fallback API call
          const fallbackRateLimitKey = `groq-fallback:${sessionId}`;
          const fallbackRateLimitStatus = await rateLimiter.waitForRateLimit(
            fallbackRateLimitKey,
            20,
            60
          ); // 20 requests per minute for fallback

          if (fallbackRateLimitStatus.error) {
            console.warn(
              "⚠️ Fallback rate limiter error, proceeding with caution"
            );
          }

          response = await fallbackChain.invoke(promptVariables);
          aiResponse = response.content;
          console.log("✅ Response generated using Groq AI fallback");
        } catch (fallbackError) {
          console.error("❌ Fallback Groq model error:", fallbackError);

          // Provide more specific error messages
          if (
            fallbackError.status === 429 ||
            fallbackError.message?.includes("rate limit")
          ) {
            throw new Error(
              "The service is currently experiencing high demand. Please try again in a few minutes."
            );
          } else if (
            fallbackError.status === 503 ||
            fallbackError.message?.includes("overloaded")
          ) {
            throw new Error(
              "The service is temporarily overloaded. Please try again shortly."
            );
          } else if (fallbackError.message?.includes("timeout")) {
            throw new Error(
              "The request timed out. Please try again with a shorter message or simpler query."
            );
          } else {
            throw new Error(
              "An unexpected error occurred. Please try again in a few moments."
            );
          }
        }
      }

      // Save message to memory and prepare response with sources
      const result = {
        response: aiResponse,
        sources:
          relevantDocs && relevantDocs.length > 0
            ? relevantDocs.map((doc) => ({
                source: doc.metadata.source || "Unknown source",
                content: doc.pageContent.substring(0, 200) + "...",
              }))
            : [],
      };

      try {
        await memoryService.addMessage(sessionId, message, aiResponse);
      } catch (memoryError) {
        console.error("Error saving to memory:", memoryError);
        // Continue with response even if memory save fails
      }

      return result;
    } catch (error) {
      console.error("Error generating response:", error);
      throw error;
    }
  }

  async clearConversation(sessionId) {
    try {
      await memoryService.clearSession(sessionId);
    } catch (error) {
      console.error("Error clearing conversation:", error);
      throw error;
    }
  }
}

module.exports = new ChatService();
