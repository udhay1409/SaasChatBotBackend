const { inngest } = require("../services/inngest");
const VectorStoreService = require("../services/vectorStore");
const { prisma } = require("../config/database");
const path = require("path");

// In-memory cache to prevent duplicate processing
const processingCache = new Map();
const PROCESSING_TIMEOUT = 60000; // 1 minute timeout

// Global event deduplication cache
const eventCache = new Map();
const EVENT_TIMEOUT = 30000; // 30 seconds timeout for events

// Function to process uploaded documents
const processDocuments = inngest.createFunction(
  { 
    id: "process-documents",
    retries: 0, // Disable retries to prevent duplicate processing
    concurrency: {
      limit: 1, // Process one at a time to prevent race conditions
      key: "event.data.configId" // Use configId as the concurrency key
    }
  },
  { event: "chatbot/documents.uploaded" },
  async ({ event, step }) => {
    const { configId, documents } = event.data;

    // Create a unique event ID based on content, not timestamp
    const eventId = `${configId}-${documents.map(d => d.filename).sort().join('-')}`;
    const now = Date.now();
    
    // Check if this exact event is already being processed
    if (eventCache.has(eventId)) {
      const eventEntry = eventCache.get(eventId);
      if (now - eventEntry.timestamp < EVENT_TIMEOUT) {
        console.log(`⏭️ Event already being processed, skipping: ${eventId}`);
        return { success: true, message: 'Event already being processed', skipped: true };
      } else {
        // Event cache expired, remove it
        eventCache.delete(eventId);
      }
    }
    
    // Mark this event as being processed
    eventCache.set(eventId, { timestamp: now, status: 'processing' });
    console.log(`🔄 Processing ${documents.length} documents for config ${configId} (Event ID: ${eventId})`);

    // Process each document
    for (const document of documents) {
      // Create deterministic step ID to ensure idempotency
      const stepId = `process-document-${configId}-${document.filename}`;
      
      await step.run(stepId, async () => {
        try {
          console.log(`🔄 Starting processing for document: ${document.name} (${document.filename})`);
          console.log(`🔑 Step ID: ${stepId}`);
          
          // Create a unique cache key for this document processing
          const cacheKey = `${configId}-${document.filename}`;
          const now = Date.now();
          
          // Check if this document is already being processed or completed
          if (processingCache.has(cacheKey)) {
            const cacheEntry = processingCache.get(cacheKey);
            if (now - cacheEntry.timestamp < PROCESSING_TIMEOUT) {
              console.log(`⏭️ Document already ${cacheEntry.status}, skipping: ${document.name}`);
              return { success: true, message: `Document already ${cacheEntry.status}`, skipped: true };
            } else {
              // Cache entry expired, remove it
              processingCache.delete(cacheKey);
            }
          }
          
          // Mark as being processed
          processingCache.set(cacheKey, { timestamp: now, status: 'processing' });
          console.log(`🔒 Marked document as processing: ${cacheKey}`);
          
          // Check if this is a user chatbot by looking up the config
          const isUserChatbot = await prisma.userChatBot.findUnique({
            where: { id: configId },
            select: { id: true, companyName: true },
          });

          console.log(`📋 Chatbot type: ${isUserChatbot ? 'User' : 'Admin'} chatbot`);

          // Create vector store instance - use default for admin chatbots
          const vectorStore = new VectorStoreService(isUserChatbot ? configId : null);

          // Determine the correct file path
          let filePath;
          if (document.path && document.path.startsWith("/public/")) {
            // Path from upload - convert to absolute path
            filePath = path.join(__dirname, "..", document.path);
          } else if (document.filename) {
            // Construct path based on chatbot type
            if (isUserChatbot) {
              filePath = path.join(
                __dirname,
                "../public/user-chat-bot",
                document.filename
              );
            } else {
              filePath = path.join(
                __dirname,
                "../public/chat-bot",
                document.filename
              );
            }
          } else {
            throw new Error("No valid file path found for document");
          }

          // Double-check if document already exists in vector store before processing
          const sourceForCheck = document.path || document.filename;
          console.log(`🔍 Checking if document exists in vector store: ${sourceForCheck}`);
          
          const vectorStoreForCheck = await vectorStore.getVectorStore(isUserChatbot ? configId : null);
          const alreadyExists = await vectorStore.documentExists(vectorStoreForCheck, null, sourceForCheck);
          
          if (alreadyExists) {
            console.log(`⏭️ Document already exists in vector store, skipping processing: ${document.name}`);
            // Mark as completed in cache
            processingCache.set(cacheKey, { timestamp: now, status: 'completed' });
            return { 
              success: true, 
              message: 'Document already exists in vector store', 
              skipped: true,
              chunksStored: 0
            };
          }
          
          console.log(`✅ Document not found in vector store, proceeding with processing: ${document.name}`);

          const result = await vectorStore.processDocument(filePath, {
            configId,
            documentName: document.name,
            documentType: document.type,
            uploadedAt: document.uploadedAt,
            isUserChatbot: !!isUserChatbot,
            companyName: isUserChatbot?.companyName || "Default",
            source: document.path || document.filename,
          });

          console.log(
            `✅ Processed document: ${document.name} for ${
              isUserChatbot ? "user" : "admin"
            } chatbot - Chunks stored: ${result.chunksStored}`
          );
          
          // Mark as completed and clean up cache
          processingCache.set(cacheKey, { timestamp: now, status: 'completed' });
          console.log(`✅ Marked document as completed: ${cacheKey}`);
          
          return result;
        } catch (error) {
          console.error(
            `❌ Error processing document ${document.name}:`,
            error
          );
          
          // Clean up cache on error
          processingCache.delete(cacheKey);
          console.log(`🧹 Cleaned up cache on error: ${cacheKey}`);
          
          throw error;
        }
      });
    }

    // Update the chatbot configuration to mark documents as processed
    await step.run("update-config-status", async () => {
      try {
        // Check if this is a user chatbot or admin chatbot
        const isUserChatbot = await prisma.userChatBot.findUnique({
          where: { id: configId },
          select: { id: true },
        });

        if (isUserChatbot) {
          // Update user chatbot
          await prisma.userChatBot.update({
            where: { id: configId },
            data: {
              updatedAt: new Date(),
            },
          });
          console.log(`✅ Updated user chatbot config: ${configId}`);
        } else {
          // Check if admin chatbot exists before updating
          const adminChatbot = await prisma.chatBot.findUnique({
            where: { id: configId },
            select: { id: true },
          });

          if (adminChatbot) {
            await prisma.chatBot.update({
              where: { id: configId },
              data: {
                updatedAt: new Date(),
              },
            });
            console.log(`✅ Updated admin chatbot config: ${configId}`);
          } else {
            console.warn(`⚠️ Admin chatbot ${configId} not found, skipping update`);
          }
        }
      } catch (error) {
        console.error(`❌ Error updating chatbot config ${configId}:`, error);
        // Don't throw error to prevent blocking the document processing
        console.warn(`⚠️ Continuing despite config update error for ${configId}`);
      }
    });

    // Mark event as completed and clean up cache
    eventCache.set(eventId, { timestamp: now, status: 'completed' });
    console.log(`✅ Event processing completed: ${eventId}`);

    return {
      success: true,
      message: `Processed ${documents.length} documents successfully`,
    };
  }
);

// Function to handle document deletion
const deleteDocuments = inngest.createFunction(
  { 
    id: "delete-documents",
    retries: 0,
    concurrency: {
      limit: 1,
      key: "event.data.configId"
    }
  },
  { event: "chatbot/documents.deleted" },
  async ({ event, step }) => {
    const { configId, documentSources } = event.data;

    console.log(`🗑️ Deleting documents for config ${configId}`);

    for (const source of documentSources) {
      await step.run(
        `delete-document-${source.replace(/[^a-zA-Z0-9]/g, "-")}`,
        async () => {
          try {
            // Check if this is a user chatbot by looking up the config
            const isUserChatbot = await prisma.userChatBot.findUnique({
              where: { id: configId },
              select: { id: true },
            });

            // Create vector store instance - use default for admin chatbots
            const vectorStore = new VectorStoreService(isUserChatbot ? configId : null);
            await vectorStore.deleteDocumentsBySource(source);
            console.log(`✅ Deleted document vectors: ${source}`);
          } catch (error) {
            console.error(`❌ Error deleting document ${source}:`, error);
            // Don't throw error to prevent blocking other deletions
            console.warn(
              `⚠️ Continuing with other deletions despite error with ${source}`
            );
          }
        }
      );
    }

    return {
      success: true,
      message: `Processed deletion for ${documentSources.length} document sources`,
    };
  }
);

// Function to handle chatbot configuration updates
const updateChatbotConfig = inngest.createFunction(
  { 
    id: "update-chatbot-config",
    retries: 0, // Disable retries to prevent duplicate processing
    concurrency: {
      limit: 1,
      key: "event.data.configId"
    }
  },
  { event: "chatbot/config.updated" },
  async ({ event, step }) => {
    const { configId, changes } = event.data;

    console.log(`🔄 Processing config update for ${configId}`);

    await step.run("process-config-changes", async () => {
      // If documents were added, process them
      if (changes.documentsAdded && changes.documentsAdded.length > 0) {
        console.log(`📄 Processing ${changes.documentsAdded.length} newly added documents`);
        await inngest.send({
          name: "chatbot/documents.uploaded",
          data: {
            configId,
            documents: changes.documentsAdded,
          },
        });
      } else {
        console.log(`ℹ️ No new documents to process for config ${configId}`);
      }

      // If documents were removed, delete their vectors
      if (changes.documentsRemoved && changes.documentsRemoved.length > 0) {
        console.log(`🗑️ Removing ${changes.documentsRemoved.length} documents from vector store`);
        await inngest.send({
          name: "chatbot/documents.deleted",
          data: {
            configId,
            documentSources: changes.documentsRemoved.map((doc) => doc.path),
          },
        });
      } else {
        console.log(`ℹ️ No documents to remove for config ${configId}`);
      }
    });

    return {
      success: true,
      message: "Config update processed successfully",
    };
  }
);

// Function to handle chatbot deletion and cleanup
const deleteChatbot = inngest.createFunction(
  { id: "delete-chatbot" },
  { event: "chatbot/chatbot.deleted" },
  async ({ event, step }) => {
    const { configId, isUserChatbot, companyName } = event.data;

    console.log(
      `🗑️ Starting Pinecone cleanup for chatbot: ${companyName || configId} (${
        isUserChatbot ? "user" : "admin"
      } chatbot)`
    );

    await step.run("cleanup-vector-store", async () => {
      try {
        // Create vector store instance for this specific chatbot
        const vectorStore = new VectorStoreService(configId);

        // For user chatbots, delete the entire index since each has its own
        if (isUserChatbot) {
          console.log(
            `🔍 Attempting to delete Pinecone index for user chatbot: ${configId}`
          );

          // Get the index name that would be used
          const indexName = vectorStore.getIndexName();
          console.log(`📋 Index name to delete: ${indexName}`);

          // Check if index exists before trying to delete
          const existingIndexes = await vectorStore.pinecone.listIndexes();
          const indexExists = existingIndexes.indexes?.some(
            (index) => index.name === indexName
          );

          if (indexExists) {
            console.log(
              `✅ Index ${indexName} exists, proceeding with deletion...`
            );
            await vectorStore.deleteIndex();
            console.log(`🗑️ Successfully deleted Pinecone index: ${indexName}`);
          } else {
            console.log(
              `ℹ️ Index ${indexName} does not exist, skipping deletion`
            );
          }
        } else {
          // For admin chatbots, just clear the namespace
          console.log(`🔍 Clearing namespace ${configId} from admin index`);
          const stats = await vectorStore.getIndexStats();
          if (stats && stats.namespaces && stats.namespaces[configId]) {
            // Delete all documents in this namespace
            const index = vectorStore.pinecone.index(
              vectorStore.getIndexName()
            );
            await index.namespace(configId).deleteAll();
            console.log(`✅ Cleared namespace ${configId} from admin index`);
          } else {
            console.log(
              `ℹ️ Namespace ${configId} does not exist in admin index`
            );
          }
        }
      } catch (error) {
        console.error(
          `❌ Error cleaning up vector store for ${configId}:`,
          error
        );
        console.error(`❌ Error details:`, error.message);
        // Don't throw error to prevent blocking the deletion process
        console.warn(
          `⚠️ Continuing with chatbot deletion despite vector store cleanup error`
        );
      }
    });

    console.log(
      `✅ Pinecone cleanup completed for chatbot: ${companyName || configId}`
    );

    return {
      success: true,
      message: `Cleaned up chatbot ${configId} successfully`,
    };
  }
);

module.exports = {
  processDocuments,
  deleteDocuments,
  updateChatbotConfig,
  deleteChatbot,
};
