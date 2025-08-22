const { Pinecone } = require("@pinecone-database/pinecone");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { PineconeStore } = require("@langchain/pinecone");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { TextLoader } = require("langchain/document_loaders/fs/text");
const { DocxLoader } = require("@langchain/community/document_loaders/fs/docx");
const path = require("path");
const fs = require("fs");

class VectorStoreService {
  constructor(configId = null) {
    this.configId = configId;
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    // Initialize embeddings with Google Gemini
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: "embedding-001",
    });

    console.log("✅ VectorStore initialized with Google Gemini embeddings");
  }

  // Generate index name based on config ID
  getIndexName(configId = null) {
    const targetConfigId = configId || this.configId;
    if (!targetConfigId || targetConfigId === 'default') {
      return process.env.PINECONE_INDEX || "chat-bot"; // Default admin index
    }
    
    // Create unique index name for user chatbots
    return `chatbot-${targetConfigId.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
  }

  // Create Pinecone index if it doesn't exist
  async createIndexIfNotExists(indexName) {
    try {
      const existingIndexes = await this.pinecone.listIndexes();
      const indexExists = existingIndexes.indexes?.some(index => index.name === indexName);

      if (!indexExists) {
        console.log(`🔄 Creating new Pinecone index: ${indexName}`);
        
        await this.pinecone.createIndex({
          name: indexName,
          dimension: 768, // Google Gemini embedding dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });

        // Wait for index to be ready
        console.log(`⏳ Waiting for index ${indexName} to be ready...`);
        let isReady = false;
        let attempts = 0;
        const maxAttempts = 30;

        while (!isReady && attempts < maxAttempts) {
          try {
            const indexDescription = await this.pinecone.describeIndex(indexName);
            isReady = indexDescription.status?.ready === true;
            
            if (!isReady) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
              attempts++;
            }
          } catch (error) {
            console.log(`⏳ Index ${indexName} not ready yet, waiting... (${attempts + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
          }
        }

        if (isReady) {
          console.log(`✅ Index ${indexName} created and ready`);
        } else {
          console.warn(`⚠️ Index ${indexName} creation timeout, but continuing...`);
        }
      } else {
        console.log(`✅ Index ${indexName} already exists`);
      }

      return indexName;
    } catch (error) {
      console.error(`❌ Error creating index ${indexName}:`, error);
      throw error;
    }
  }

  // Get or create vector store for specific config
  async getVectorStore(configId = null) {
    try {
      const indexName = this.getIndexName(configId);
      await this.createIndexIfNotExists(indexName);
      
      const index = this.pinecone.index(indexName);
      
      return await PineconeStore.fromExistingIndex(this.embeddings, {
        pineconeIndex: index,
        namespace: configId || 'default',
      });
    } catch (error) {
      console.error("Error getting vector store:", error);
      throw error;
    }
  }

  // Check if document already exists to prevent duplicates
  async documentExists(vectorStore, documentId, source) {
    try {
      const index = this.pinecone.index(this.getIndexName());
      const namespace = this.configId || 'default';
      
      // Query for existing document with same source
      const queryResponse = await index.namespace(namespace).query({
        vector: new Array(768).fill(0.1), // Dummy vector for existence check
        topK: 1,
        filter: {
          source: source
        },
        includeMetadata: true
      });

      return queryResponse.matches && queryResponse.matches.length > 0;
    } catch (error) {
      console.warn("Error checking document existence:", error);
      return false; // Assume doesn't exist if check fails
    }
  }

  // Delete documents by source to prevent duplicates
  async deleteDocumentsBySource(source) {
    try {
      const indexName = this.getIndexName();
      const index = this.pinecone.index(indexName);
      const namespace = this.configId || 'default';

      console.log(`🗑️ Deleting documents with source: ${source} from namespace: ${namespace}`);

      // First, query to get all document IDs with this source
      const queryResponse = await index.namespace(namespace).query({
        vector: new Array(768).fill(0.1), // Dummy vector
        topK: 1000, // Get many results
        filter: {
          source: source
        },
        includeMetadata: true
      });

      if (queryResponse.matches && queryResponse.matches.length > 0) {
        const idsToDelete = queryResponse.matches.map(match => match.id);
        
        // Delete in batches of 100 (Pinecone limit)
        const batchSize = 100;
        for (let i = 0; i < idsToDelete.length; i += batchSize) {
          const batch = idsToDelete.slice(i, i + batchSize);
          await index.namespace(namespace).deleteMany(batch);
          console.log(`🗑️ Deleted batch of ${batch.length} documents`);
          
          // Add small delay between batches to ensure deletion completes
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`✅ Deleted ${idsToDelete.length} documents with source: ${source}`);
        
        // Wait a bit more to ensure deletion is fully processed
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log(`ℹ️ No documents found with source: ${source}`);
      }
    } catch (error) {
      console.error(`❌ Error deleting documents by source ${source}:`, error);
      throw error;
    }
  }

  // Process and store document
  async processDocument(filePath, metadata = {}) {
    try {
      const fullPath = path.resolve(filePath);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${fullPath}`);
      }

      console.log(`📄 Processing document: ${fullPath}`);

      // Get vector store
      const vectorStore = await this.getVectorStore(this.configId);

      // Check if document already exists and delete if so
      const source = metadata.source || filePath;
      console.log(`🔍 Checking for existing document with source: ${source} in namespace: ${this.configId || 'default'}`);
      
      const exists = await this.documentExists(vectorStore, null, source);
      
      if (exists) {
        console.log(`🔄 Document already exists, removing old version: ${source}`);
        await this.deleteDocumentsBySource(source);
        console.log(`✅ Old version removed, proceeding with new upload`);
      } else {
        console.log(`✅ No existing document found, proceeding with fresh upload`);
      }

      // Load document based on file type
      let loader;
      const ext = path.extname(fullPath).toLowerCase();

      switch (ext) {
        case '.pdf':
          loader = new PDFLoader(fullPath);
          break;
        case '.txt':
          loader = new TextLoader(fullPath);
          break;
        case '.docx':
          loader = new DocxLoader(fullPath);
          break;
        default:
          throw new Error(`Unsupported file type: ${ext}`);
      }

      const docs = await loader.load();
      console.log(`📄 Loaded ${docs.length} document chunks`);

      if (docs.length === 0) {
        throw new Error("No content found in document");
      }

      // Split documents into smaller chunks
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const splitDocs = await textSplitter.splitDocuments(docs);
      console.log(`📄 Split into ${splitDocs.length} chunks`);

      // Add metadata to each chunk
      const docsWithMetadata = splitDocs.map((doc, index) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          ...metadata,
          source: source,
          chunkIndex: index,
          configId: this.configId,
          processedAt: new Date().toISOString(),
        },
      }));

      // Store in vector database
      await vectorStore.addDocuments(docsWithMetadata);
      
      console.log(`✅ Successfully processed and stored document: ${source}`);
      console.log(`📊 Total chunks stored: ${docsWithMetadata.length}`);

      return {
        success: true,
        chunksStored: docsWithMetadata.length,
        source: source,
        configId: this.configId
      };
    } catch (error) {
      console.error(`❌ Error processing document ${filePath}:`, error);
      throw error;
    }
  }

  // Search for similar documents
  async searchSimilarDocuments(query, k = 4, filter = {}) {
    try {
      const vectorStore = await this.getVectorStore(this.configId);
      
      // Add configId to filter if specified
      const searchFilter = {
        ...filter,
        ...(this.configId && { configId: this.configId })
      };

      const results = await vectorStore.similaritySearch(query, k, searchFilter);
      
      console.log(`🔍 Found ${results.length} similar documents for query: "${query}"`);
      
      return results;
    } catch (error) {
      console.error("Error searching similar documents:", error);
      return [];
    }
  }

  // Get index statistics
  async getIndexStats() {
    try {
      const indexName = this.getIndexName();
      const index = this.pinecone.index(indexName);
      const stats = await index.describeIndexStats();
      
      return {
        indexName,
        totalVectors: stats.totalVectorCount,
        namespaces: stats.namespaces,
        dimension: stats.dimension
      };
    } catch (error) {
      console.error("Error getting index stats:", error);
      return null;
    }
  }

  // Delete entire index (use with caution)
  async deleteIndex(configId = null) {
    try {
      const targetConfigId = configId || this.configId;
      const indexName = this.getIndexName(targetConfigId);
      
      console.log(`🔍 Attempting to delete index: ${indexName} for configId: ${targetConfigId}`);
      
      // Don't delete the default admin index
      if (indexName === (process.env.PINECONE_INDEX || "chat-bot")) {
        console.warn("⚠️ Cannot delete default admin index");
        return false;
      }

      // Check if index exists before trying to delete
      const existingIndexes = await this.pinecone.listIndexes();
      const indexExists = existingIndexes.indexes?.some(index => index.name === indexName);
      
      if (!indexExists) {
        console.log(`ℹ️ Index ${indexName} does not exist, nothing to delete`);
        return true; // Consider this a success since the goal is achieved
      }

      console.log(`🗑️ Deleting Pinecone index: ${indexName}...`);
      await this.pinecone.deleteIndex(indexName);
      
      // Wait a moment for deletion to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`✅ Successfully deleted index: ${indexName}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting index:`, error);
      console.error(`❌ Error details:`, error.message);
      
      // If the error is that the index doesn't exist, consider it a success
      if (error.message && error.message.includes('not found')) {
        console.log(`ℹ️ Index was already deleted or doesn't exist`);
        return true;
      }
      
      throw error;
    }
  }
}

// Create default instance for admin chatbot
VectorStoreService.defaultInstance = new VectorStoreService();

module.exports = VectorStoreService;