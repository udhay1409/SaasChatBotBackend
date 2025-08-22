const { Pinecone } = require("@pinecone-database/pinecone");
const VectorStoreService = require("../services/vectorStore");
require("dotenv").config();

async function checkPineconeStatus() {
  try {
    console.log("🔍 Checking Pinecone database status...");

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    // List all indexes
    console.log("\n📊 Listing all Pinecone indexes:");
    const indexList = await pinecone.listIndexes();
    
    if (indexList.indexes && indexList.indexes.length > 0) {
      indexList.indexes.forEach((index, i) => {
        console.log(`  ${i + 1}. ${index.name} (${index.dimension}D, ${index.metric})`);
        console.log(`     Status: ${index.status?.ready ? 'Ready' : 'Not Ready'}`);
        console.log(`     Host: ${index.host}`);
        console.log("");
      });
    } else {
      console.log("  No indexes found");
    }

    // Check default admin index
    const defaultIndexName = process.env.PINECONE_INDEX || "chat-bot";
    console.log(`\n📊 Checking default admin index: ${defaultIndexName}`);

    try {
      const defaultIndex = pinecone.index(defaultIndexName);
      const defaultStats = await defaultIndex.describeIndexStats();
      console.log("📊 Default index stats:", JSON.stringify(defaultStats, null, 2));
    } catch (defaultError) {
      console.log(`⚠️ Default index ${defaultIndexName} not found or error:`, defaultError.message);
    }

    // Test VectorStore service functionality
    console.log("\n🧪 Testing VectorStore service...");
    
    // Test default instance
    console.log("Testing default VectorStore instance:");
    const defaultVectorStore = VectorStoreService.defaultInstance;
    const defaultIndexStats = await defaultVectorStore.getIndexStats();
    if (defaultIndexStats) {
      console.log(`✅ Default index: ${defaultIndexStats.indexName}`);
      console.log(`   Total vectors: ${defaultIndexStats.totalVectors}`);
      console.log(`   Dimension: ${defaultIndexStats.dimension}`);
      console.log(`   Namespaces:`, Object.keys(defaultIndexStats.namespaces || {}));
    }

    // Test user chatbot instance (simulate)
    console.log("\nTesting user chatbot VectorStore instance:");
    const testConfigId = "test-user-chatbot-123";
    const userVectorStore = new VectorStoreService(testConfigId);
    const userIndexName = userVectorStore.getIndexName();
    console.log(`📝 User chatbot would use index: ${userIndexName}`);

    // Test search functionality on default index
    console.log("\n🔍 Testing search functionality on default index:");
    try {
      const searchResults = await defaultVectorStore.searchSimilarDocuments("company policy", 3);
      console.log(`📄 Found ${searchResults.length} documents for test query`);
      
      if (searchResults.length > 0) {
        searchResults.forEach((doc, i) => {
          console.log(`  ${i + 1}. Content preview: ${doc.pageContent.substring(0, 100)}...`);
          console.log(`     Metadata:`, doc.metadata);
          console.log("");
        });
      }
    } catch (searchError) {
      console.log(`⚠️ Search test failed:`, searchError.message);
    }

    // Check for existing user chatbot indexes
    console.log("\n🔍 Checking for existing user chatbot indexes:");
    const userChatbotIndexes = indexList.indexes?.filter(index => 
      index.name.startsWith('chatbot-') && index.name !== defaultIndexName
    ) || [];

    if (userChatbotIndexes.length > 0) {
      console.log(`📊 Found ${userChatbotIndexes.length} user chatbot indexes:`);
      for (const index of userChatbotIndexes) {
        console.log(`  - ${index.name}`);
        try {
          const userIndex = pinecone.index(index.name);
          const userStats = await userIndex.describeIndexStats();
          console.log(`    Total vectors: ${userStats.totalVectorCount}`);
          console.log(`    Namespaces:`, Object.keys(userStats.namespaces || {}));
        } catch (userIndexError) {
          console.log(`    Error getting stats: ${userIndexError.message}`);
        }
        console.log("");
      }
    } else {
      console.log("  No user chatbot indexes found");
    }

    console.log("✅ Pinecone status check completed!");

  } catch (error) {
    console.error("❌ Error checking Pinecone:", error);
  }
}

checkPineconeStatus();
