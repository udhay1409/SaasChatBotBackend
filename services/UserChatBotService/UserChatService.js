const { ChatGroq } = require("@langchain/groq");
const { PromptTemplate } = require("@langchain/core/prompts");
const { RunnableSequence } = require("@langchain/core/runnables");
const VectorStoreService = require("../vectorStore");
const memoryService = require("../memory");
const rateLimiter = require("../rate-limit");
const { prisma } = require("../../config/database");

class UserChatService {
  constructor() {
    // Initialize Groq AI for chat with current stable models
    this.llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      modelName: "llama-3.1-8b-instant", // Most reliable current model
      temperature: 0.7,
      maxRetries: 3,
      timeout: 60000, // 60 seconds timeout
    });
    console.log(
      "✅ UserChatService using Groq AI (llama-3.1-8b-instant) for chat"
    );

    // Initialize fallback model
    this.fallbackLLM = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      modelName: "gemma2-9b-it", // Alternative fallback model
      temperature: 0.5,
      maxRetries: 2,
      timeout: 30000,
    });
    console.log("✅ UserChatService Fallback: Groq AI (gemma2-9b-it)");
  }

  async getUserChatbotConfig(configId) {
    try {
      const config = await prisma.userChatBot.findUnique({
        where: { id: configId },
        include: {
          user: {
            select: {
              id: true,
              isActive: true,
              organizationId: true,
              name: true,
            },
          },
        },
      });
      return config;
    } catch (error) {
      console.error("Error fetching user chatbot config:", error);
      throw error;
    }
  }

  // Check complete access permissions for chatbot
  async checkChatbotAccess(configId) {
    try {
      console.log(`🔍 Checking access for chatbot: ${configId}`);

      const config = await prisma.userChatBot.findUnique({
        where: { id: configId },
        include: {
          user: {
            select: {
              id: true,
              isActive: true,
              organizationId: true,
              name: true,
            },
          },
        },
      });

      if (!config) {
        console.log(`❌ Chatbot not found: ${configId}`);
        return {
          hasAccess: false,
          reason: "CHATBOT_NOT_FOUND",
          message: "Chatbot configuration not found",
        };
      }

      console.log(
        `📋 Chatbot found: ${config.companyName} (Owner: ${config.user.name})`
      );

      // Check if chatbot is enabled
      if (!config.chatEnabled) {
        console.log(`🚫 Chatbot disabled: ${config.companyName}`);
        return {
          hasAccess: false,
          reason: "CHATBOT_DISABLED",
          message: "Service temporarily unavailable. Please try again later.",
        };
      }

      // Check if user is active
      if (!config.user.isActive) {
        console.log(
          `🚫 User inactive: ${config.user.name} (ID: ${config.user.id})`
        );
        return {
          hasAccess: false,
          reason: "USER_INACTIVE",
          message: "Service temporarily unavailable. Please try again later.",
        };
      }

      // Check organization status if user belongs to one
      if (config.user.organizationId) {
        console.log(`🏢 Checking organization: ${config.user.organizationId}`);

        const organization = await prisma.organization.findUnique({
          where: { id: config.user.organizationId },
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        });

        if (!organization) {
          console.log(
            `❌ Organization not found: ${config.user.organizationId}`
          );
          return {
            hasAccess: false,
            reason: "ORGANIZATION_NOT_FOUND",
            message: "Service temporarily unavailable. Please try again later.",
          };
        }

        if (!organization.isActive) {
          console.log(
            `🚫 Organization inactive: ${organization.name} (ID: ${organization.id})`
          );
          return {
            hasAccess: false,
            reason: "ORGANIZATION_INACTIVE",
            message: "Service temporarily unavailable. Please try again later.",
          };
        }

        console.log(`✅ Organization active: ${organization.name}`);
      } else {
        console.log(`👤 Individual user (no organization)`);
      }

      console.log(`✅ Access granted for chatbot: ${config.companyName}`);
      return {
        hasAccess: true,
        reason: "ACCESS_GRANTED",
        message: "Access granted",
        config: config,
      };
    } catch (error) {
      console.error("❌ Error checking chatbot access:", error);
      return {
        hasAccess: false,
        reason: "SYSTEM_ERROR",
        message: "Service temporarily unavailable. Please try again later.",
      };
    }
  }

  async getAllUserChatbotConfigs(userId) {
    try {
      const configs = await prisma.userChatBot.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          companyName: true,
          companyCategory: true,
          instructions: true,
          chatEnabled: true,
          uploadedDocuments: true,
          appearance: true, // Include appearance settings
          createdAt: true,
          updatedAt: true,
        },
      });
      return configs;
    } catch (error) {
      console.error("Error fetching all user chatbot configs:", error);
      throw error;
    }
  }

  async generateResponse(message, sessionId, configId) {
    try {
      // Check access permissions first - COMPLETE ACCESS CONTROL
      const accessCheck = await this.checkChatbotAccess(configId);

      if (!accessCheck.hasAccess) {
        console.log(
          `🚫 Access denied for chatbot ${configId}: ${accessCheck.reason}`
        );
        throw new Error(accessCheck.message);
      }

      // Get user chatbot configuration (we know it exists from access check)
      let config = null;
      if (configId && configId !== "default") {
        config = await this.getUserChatbotConfig(configId);
        console.log(
          `✅ Using user-specific config: ${config?.companyName || "Not found"}`
        );
      }

      // If no specific config found, return error for user chatbots
      if (!config) {
        throw new Error(
          "Service temporarily unavailable. Please try again later."
        );
      }

      // Search for relevant documents using vector store with Gemini embeddings
      let documentContext = "";
      let relevantDocs = [];

      try {
        // Create vector store instance for this specific user chatbot
        const vectorStore = new VectorStoreService(config.id);

        // Search for config-specific documents
        relevantDocs = await vectorStore.searchSimilarDocuments(message, 4, {
          configId: config.id,
        });

        if (relevantDocs && relevantDocs.length > 0) {
          // Check if the documents actually contain relevant information for the query
          const queryLower = message.toLowerCase();
          const relevantContent = relevantDocs.filter((doc) => {
            const contentLower = doc.pageContent.toLowerCase();
            // Check if document content is actually related to the query
            const queryWords = queryLower
              .split(" ")
              .filter((word) => word.length > 2);
            return (
              queryWords.some((word) => contentLower.includes(word)) ||
              contentLower.includes("company") ||
              contentLower.includes("policy") ||
              contentLower.includes("employee") ||
              contentLower.includes("hr")
            );
          });

          if (relevantContent.length > 0) {
            documentContext = relevantContent
              .map((doc) => doc.pageContent)
              .join("\n\n");
            console.log(
              `✅ Retrieved ${relevantContent.length} relevant documents for user chatbot query: "${message}"`
            );
            console.log(
              `📄 Context preview: ${documentContext.substring(0, 300)}...`
            );
          } else {
            console.log(
              `⚠️ Documents found but not relevant to query: "${message}"`
            );
            documentContext =
              "No specific information available in knowledge base for this query.";
          }
        } else {
          console.log(
            `⚠️ No documents found for user chatbot query: "${message}"`
          );
          documentContext =
            "No specific information available in knowledge base for this query.";
        }
      } catch (error) {
        console.warn("⚠️ Vector search failed for user chatbot:", error);
        documentContext =
          "No specific information available in knowledge base for this query.";
      }

      // Get conversation memory
      const memoryVariables = await memoryService.getMemoryVariables(sessionId);

      // Log configuration details for debugging
      console.log(`🤖 User Chat Config Details:
        - Company: ${config.companyName}
        - Category: ${config.companyCategory}
        - Chat Enabled: ${config.chatEnabled}
        - Documents: ${config.uploadedDocuments?.length || 0}
        - Instructions Length: ${config.instructions?.length || 0} chars`);

      // Enhanced prompt template for user chatbots with concise, natural responses
      const promptTemplate =
        PromptTemplate.fromTemplate(`You are an AI assistant for {companyName}, a {companyCategory} company.

COMPANY INFO:
- Name: {companyName}
- Email: {companyEmail}
- Phone: {companyPhone}
- Address: {companyAddress}

INSTRUCTIONS: {instructions}

KNOWLEDGE BASE: {documentContext}

AVAILABLE DOCUMENTS: {documentLinks}

CONVERSATION HISTORY: {history}

RESPONSE RULES:
1. Be concise and direct - avoid lengthy explanations
2. Don't repeat greetings if already in conversation
3. Use simple, clear language
4. Only greet new conversations with "Hello! How can I help you?"
5. For follow-up questions, jump straight to the answer
6. Use minimal emojis (1-2 max per response)
7. Never mention "documents", "sources", or "knowledge base"
8. Keep responses under 100 words when possible
9. Be professional but friendly
10. CRITICAL: Answer ONLY what user asks for. Do NOT add extra contact information unless specifically requested.

11. LINK RULES - Follow these EXACTLY:

IF user asks for "email" or "contact email" → Use: <a href="mailto:{companyEmail}" style="color: #3b82f6; text-decoration: underline;">{companyEmail}</a>

IF user asks for "phone" or "phone number" → Use: <a href="tel:{companyPhone}" style="color: #3b82f6; text-decoration: underline;">{companyPhone}</a>

IF user asks for "map", "map location", "directions" → Use: <a href="{mapLink}" style="color: #ef4444; text-decoration: underline; font-weight: 500;" target="_blank">📍 View on Map</a>

IF user asks for "documents" or "download" → Use: {documentLinks}

12. EXAMPLES:
- "give me location" → Address + Map link
- "map location give me" → Address + Map link  
- "company address" → Address only (no links)
- "address only" → Address only (no links)
- "contact email" → Email link only
- "phone number" → Phone link only

13. NEVER add contact info (email/phone) unless user specifically asks for it

USER QUESTION: {question}

Provide a concise, helpful response with clickable contact links when needed:`);

      // Generate document download links
      const baseUrl =
        process.env.BACKEND_URL ||
        process.env.INNGEST_SERVE_HOST ||
        "https://harmless-flea-inviting.ngrok-free.app";
      let documentLinks = "";

      if (config.uploadedDocuments && config.uploadedDocuments.length > 0) {
        const docLinksArray = config.uploadedDocuments.map((doc) => {
          const downloadUrl = `${baseUrl}/api/documents/user-chatbot/${config.id}/${doc.filename}`;
          return `<a href="${downloadUrl}" style="color: #10b981; text-decoration: underline; font-weight: 500;" target="_blank">📄 ${doc.name}</a>`;
        });
        documentLinks = docLinksArray.join(", ");
      }

      // Generate Google Maps link from company address
      const generateMapLink = (address) => {
        if (
          !address ||
          address === "Visit our office for in-person assistance"
        ) {
          return "#";
        }
        const encodedAddress = encodeURIComponent(address);
        return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      };

      const promptVariables = {
        instructions:
          config.instructions ||
          `You are an AI assistant for ${config.companyName}.`,
        companyName: config.companyName,
        companyCategory: config.companyCategory || "Business",
        companyEmail: config.companyEmail || "contact@company.com",
        companyPhone: config.companyPhone || "Contact us for phone support",
        companyAddress:
          config.companyAddress || "Visit our office for in-person assistance",
        mapLink: generateMapLink(config.companyAddress),
        history: memoryVariables.history || "",
        documentContext: documentContext,
        documentLinks: documentLinks,
        question: message,
      };

      // Create the primary chain
      const primaryChain = RunnableSequence.from([promptTemplate, this.llm]);

      let response;
      let aiResponse;

      try {
        // Check rate limits before making API call
        const rateLimitKey = `user-groq-api:${sessionId}`;
        const rateLimitStatus = await rateLimiter.waitForRateLimit(
          rateLimitKey,
          30,
          60
        ); // 30 requests per minute for Groq

        if (rateLimitStatus.error) {
          console.warn(
            "⚠️ Rate limiter error for user chatbot, proceeding with caution"
          );
        }

        // Try with primary Groq model first
        response = await primaryChain.invoke(promptVariables);
        aiResponse = response.content;
        console.log("✅ User chatbot response generated using Groq AI");
      } catch (primaryError) {
        console.error(
          "Primary Groq model error for user chatbot:",
          primaryError
        );

        // Handle various error types
        if (
          primaryError.status === 429 ||
          primaryError.message?.includes("rate limit")
        ) {
          console.log(
            "⚠️ Rate limit hit on primary Groq model for user chatbot, using fallback..."
          );
        } else if (
          primaryError.status === 503 ||
          primaryError.message?.includes("overloaded")
        ) {
          console.log(
            "⚠️ Primary Groq model overloaded for user chatbot, using fallback..."
          );
        } else if (primaryError.message?.includes("timeout")) {
          console.log(
            "⚠️ Primary Groq model timeout for user chatbot, using fallback..."
          );
        } else {
          console.log(
            "⚠️ Unexpected primary Groq model error for user chatbot, using fallback..."
          );
        }

        // Create fallback chain with faster model
        const fallbackChain = RunnableSequence.from([
          promptTemplate,
          this.fallbackLLM,
        ]);

        try {
          // Check rate limits before making fallback API call
          const fallbackRateLimitKey = `user-groq-fallback:${sessionId}`;
          const fallbackRateLimitStatus = await rateLimiter.waitForRateLimit(
            fallbackRateLimitKey,
            20,
            60
          ); // 20 requests per minute for fallback

          if (fallbackRateLimitStatus.error) {
            console.warn(
              "⚠️ Fallback rate limiter error for user chatbot, proceeding with caution"
            );
          }

          response = await fallbackChain.invoke(promptVariables);
          aiResponse = response.content;
          console.log(
            "✅ User chatbot response generated using Groq AI fallback"
          );
        } catch (fallbackError) {
          console.error(
            "❌ Fallback Groq model error for user chatbot:",
            fallbackError
          );

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

      // Save message to memory and prepare response without showing sources to user
      const result = {
        response: aiResponse,
        sources: [], // Don't show sources to users for a cleaner experience
      };

      try {
        await memoryService.addMessage(sessionId, message, aiResponse);
      } catch (memoryError) {
        console.error("Error saving to memory for user chatbot:", memoryError);
        // Continue with response even if memory save fails
      }

      return result;
    } catch (error) {
      console.error("Error generating response for user chatbot:", error);
      throw error;
    }
  }

  async clearConversation(sessionId) {
    try {
      await memoryService.clearSession(sessionId);
    } catch (error) {
      console.error("Error clearing conversation for user chatbot:", error);
      throw error;
    }
  }
}

module.exports = new UserChatService();
