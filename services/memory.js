const { ChatGroq } = require("@langchain/groq");
const { ConversationSummaryBufferMemory } = require("langchain/memory");
const { ChatMessageHistory } = require("langchain/stores/message/in_memory");

class ChatMemoryService {
  constructor() {
    this.sessions = new Map(); // In production, use Redis or database
    
    // Use Groq AI for memory summarization
    this.llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      modelName: "llama-3.1-8b-instant", // Fast model for memory operations
      temperature: 0.3, // Lower temperature for consistent summaries
      timeout: 30000,
    });
    console.log("✅ Memory using Groq AI (llama-3.1-8b-instant)");
  }

  async getOrCreateMemory(sessionId) {
    if (!this.sessions.has(sessionId)) {
      const chatHistory = new ChatMessageHistory();
      const memory = new ConversationSummaryBufferMemory({
        llm: this.llm,
        chatHistory,
        maxTokenLimit: 2000,
        returnMessages: true,
      });
      
      this.sessions.set(sessionId, memory);
    }
    
    return this.sessions.get(sessionId);
  }

  async addMessage(sessionId, humanMessage, aiMessage) {
    const memory = await this.getOrCreateMemory(sessionId);
    await memory.chatHistory.addUserMessage(humanMessage);
    await memory.chatHistory.addAIMessage(aiMessage);
  }

  async getConversationHistory(sessionId) {
    const memory = await this.getOrCreateMemory(sessionId);
    const messages = await memory.chatHistory.getMessages();
    return messages;
  }

  async clearSession(sessionId) {
    if (this.sessions.has(sessionId)) {
      const memory = this.sessions.get(sessionId);
      await memory.clear();
      this.sessions.delete(sessionId);
    }
  }

  async getMemoryVariables(sessionId) {
    const memory = await this.getOrCreateMemory(sessionId);
    return await memory.loadMemoryVariables({});
  }
}

module.exports = new ChatMemoryService();