const { prisma } = require('../../config/database');
const { inngest } = require('../../services/inngest');
const { updateOrganizationUsage } = require('../organization/organizationControllers');
const fs = require('fs');
const path = require('path');

// GET /api/dashboard/user/chatbot - Get all user's chatbots
const getUserChatBots = async (req, res) => {
  try {
    const userId = req.userId;

    const chatbots = await prisma.userChatBot.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            subscription: true,
            chatbotsLimit: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: chatbots,
      message: 'Chatbots retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching user chatbots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chatbots',
      error: error.message
    });
  }
};

// POST /api/dashboard/user/chatbot - Create a new chatbot
const createUserChatBot = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      companyCategory,
      instructions,
      chatEnabled = true
    } = req.body;

    // Validate required fields
    if (!companyName || !companyEmail || !companyPhone || !companyAddress || !companyCategory || !instructions) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check user's chatbot limit (considering organization limits)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        chatbotsLimit: true, 
        organizationId: true,
        subscription: true 
      }
    });

    let effectiveLimit = user.chatbotsLimit || 1;
    let limitSource = 'user';

    // If user belongs to an organization, check organization limits
    if (user.organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: { 
          chatbotsLimit: true, 
          isActive: true,
          name: true 
        }
      });

      if (!organization) {
        return res.status(400).json({
          success: false,
          message: 'Organization not found'
        });
      }

      if (!organization.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your organization account is inactive. Please contact your administrator.'
        });
      }

      // For organization users, check organization-wide limit
      const organizationUsers = await prisma.user.findMany({
        where: { organizationId: user.organizationId },
        select: { id: true }
      });

      const organizationChatbotCount = await prisma.userChatBot.count({
        where: {
          userId: {
            in: organizationUsers.map(u => u.id)
          }
        }
      });

      if (organizationChatbotCount >= organization.chatbotsLimit) {
        return res.status(403).json({
          success: false,
          message: `Your organization has reached its chatbot limit of ${organization.chatbotsLimit}. Please contact your administrator to upgrade.`
        });
      }

      effectiveLimit = organization.chatbotsLimit;
      limitSource = 'organization';
    } else {
      // Individual user - check personal limit
      const existingChatbots = await prisma.userChatBot.count({
        where: { userId }
      });

      if (existingChatbots >= user.chatbotsLimit) {
        return res.status(403).json({
          success: false,
          message: `You have reached your chatbot limit of ${user.chatbotsLimit}. Please upgrade your subscription to create more chatbots.`
        });
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(companyEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Create the chatbot
    const chatbot = await prisma.userChatBot.create({
      data: {
        userId,
        companyName,
        companyEmail,
        companyPhone,
        companyAddress,
        companyCategory,
        instructions,
        chatEnabled,
        uploadedDocuments: []
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            organizationId: true
          }
        }
      }
    });

    // Update organization usage count if user belongs to an organization
    if (chatbot.user.organizationId) {
      try {
        await updateOrganizationUsage(chatbot.user.organizationId);
      } catch (usageError) {
        console.error('Error updating organization usage:', usageError);
        // Don't fail the chatbot creation if usage update fails
      }
    }

    res.status(201).json({
      success: true,
      data: chatbot,
      message: 'Chatbot created successfully'
    });
  } catch (error) {
    console.error('Error creating chatbot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chatbot',
      error: error.message
    });
  }
};

// GET /api/dashboard/user/chatbot/:id - Get specific chatbot by ID
const getUserChatBotById = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const chatbot = await prisma.userChatBot.findFirst({
      where: {
        id,
        userId // Ensure user can only access their own chatbots
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found'
      });
    }

    res.status(200).json({
      success: true,
      data: chatbot,
      message: 'Chatbot retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching chatbot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chatbot',
      error: error.message
    });
  }
};

// PUT /api/dashboard/user/chatbot/:id - Update chatbot
const updateUserChatBot = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      companyCategory,
      instructions,
      chatEnabled,
      appearance
    } = req.body;

    // Check if chatbot exists and belongs to user
    const existingChatbot = await prisma.userChatBot.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingChatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found'
      });
    }

    // Validate email if provided
    if (companyEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(companyEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }
    }

    // Update the chatbot
    const updatedChatbot = await prisma.userChatBot.update({
      where: { id },
      data: {
        ...(companyName && { companyName }),
        ...(companyEmail && { companyEmail }),
        ...(companyPhone && { companyPhone }),
        ...(companyAddress && { companyAddress }),
        ...(companyCategory && { companyCategory }),
        ...(instructions && { instructions }),
        ...(chatEnabled !== undefined && { chatEnabled }),
        ...(appearance && { appearance })
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: updatedChatbot,
      message: 'Chatbot updated successfully'
    });
  } catch (error) {
    console.error('Error updating chatbot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chatbot',
      error: error.message
    });
  }
};

// DELETE /api/dashboard/user/chatbot/:id - Delete chatbot
const deleteUserChatBot = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Check if chatbot exists and belongs to user
    const existingChatbot = await prisma.userChatBot.findFirst({
      where: {
        id,
        userId
      },
      include: {
        user: {
          select: {
            organizationId: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!existingChatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found'
      });
    }

    console.log(`🗑️ Starting deletion process for chatbot: ${existingChatbot.companyName} (ID: ${id})`);

    // Step 1: Delete associated documents from filesystem
    let deletedFilesCount = 0;
    if (existingChatbot.uploadedDocuments && existingChatbot.uploadedDocuments.length > 0) {
      console.log(`📄 Deleting ${existingChatbot.uploadedDocuments.length} document files...`);
      
      for (const doc of existingChatbot.uploadedDocuments) {
        try {
          const filePath = path.join(__dirname, '../../public/user-chat-bot', doc.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            deletedFilesCount++;
            console.log(`✅ Deleted file: ${doc.filename}`);
          } else {
            console.log(`⚠️ File not found: ${doc.filename}`);
          }
        } catch (fileError) {
          console.error(`❌ Error deleting file ${doc.filename}:`, fileError);
        }
      }
      console.log(`📄 Deleted ${deletedFilesCount} files from filesystem`);
    }

    // Step 2: Delete Pinecone index data for this chatbot
    console.log(`🔍 Starting Pinecone cleanup for chatbot: ${id}`);
    
    // Direct Pinecone cleanup (more reliable than Inngest)
    try {
      const VectorStoreService = require('../../services/vectorStore');
      const vectorStore = new VectorStoreService(id);
      
      console.log(`🗑️ Attempting direct Pinecone index deletion for: ${existingChatbot.companyName}`);
      const deletionResult = await vectorStore.deleteIndex();
      
      if (deletionResult) {
        console.log(`✅ Successfully deleted Pinecone index for chatbot: ${existingChatbot.companyName}`);
      } else {
        console.log(`⚠️ Pinecone index deletion returned false for chatbot: ${existingChatbot.companyName}`);
      }
    } catch (pineconeError) {
      console.error('❌ Error with direct Pinecone cleanup:', pineconeError);
      
      // Fallback: Try Inngest method
      try {
        console.log(`🔄 Falling back to Inngest cleanup for chatbot: ${id}`);
        await inngest.send({
          name: "chatbot/chatbot.deleted",
          data: {
            configId: id,
            isUserChatbot: true,
            companyName: existingChatbot.companyName,
            documentsCount: existingChatbot.uploadedDocuments?.length || 0
          }
        });
        console.log(`✅ Inngest Pinecone cleanup triggered successfully`);
      } catch (inngestError) {
        console.error('❌ Error triggering Inngest Pinecone cleanup:', inngestError);
        // Don't fail the deletion if cleanup fails
      }
    }

    // Step 3: Delete the chatbot from database
    await prisma.userChatBot.delete({
      where: { id }
    });
    console.log(`🗄️ Chatbot deleted from database`);

    // Step 4: Update organization usage count if user belongs to an organization
    if (existingChatbot.user.organizationId) {
      try {
        const updatedCount = await updateOrganizationUsage(existingChatbot.user.organizationId);
        console.log(`📊 Updated organization usage count: ${updatedCount}`);
      } catch (usageError) {
        console.error('❌ Error updating organization usage:', usageError);
        // Don't fail the deletion if usage update fails
      }
    }

    console.log(`✅ Chatbot deletion completed successfully: ${existingChatbot.companyName}`);

    res.status(200).json({
      success: true,
      message: 'Chatbot and all associated data deleted successfully',
      data: {
        deletedChatbot: {
          id: existingChatbot.id,
          companyName: existingChatbot.companyName
        },
        cleanup: {
          filesDeleted: deletedFilesCount,
          pineconeCleanupTriggered: true,
          organizationUsageUpdated: !!existingChatbot.user.organizationId
        }
      }
    });
  } catch (error) {
    console.error('❌ Error deleting chatbot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chatbot',
      error: error.message
    });
  }
};

// POST /api/dashboard/user/chatbot/:id/documents - Upload documents
const uploadDocuments = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Check if chatbot exists and belongs to user
    const existingChatbot = await prisma.userChatBot.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingChatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found'
      });
    }

    // Check for duplicate documents by name
    const currentDocuments = existingChatbot.uploadedDocuments || [];
    const existingDocNames = currentDocuments.map(doc => doc.name.toLowerCase());
    
    // Filter out duplicate files
    const uniqueFiles = files.filter(file => {
      const isDuplicate = existingDocNames.includes(file.originalname.toLowerCase());
      if (isDuplicate) {
        console.log(`⚠️ Skipping duplicate document: ${file.originalname}`);
        // Delete the uploaded file since it's a duplicate
        try {
          fs.unlinkSync(file.path);
        } catch (deleteError) {
          console.error('Error deleting duplicate file:', deleteError);
        }
      }
      return !isDuplicate;
    });

    if (uniqueFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All uploaded documents already exist. Please upload different documents.'
      });
    }

    // Process unique uploaded files
    const newDocuments = uniqueFiles.map(file => ({
      name: file.originalname,
      filename: file.filename,
      size: file.size,
      type: file.mimetype,
      path: file.path,
      uploadedAt: new Date().toISOString()
    }));

    // Update chatbot with new documents
    const updatedDocuments = [...currentDocuments, ...newDocuments];

    const updatedChatbot = await prisma.userChatBot.update({
      where: { id },
      data: {
        uploadedDocuments: updatedDocuments
      }
    });

    // Trigger document processing for unique files only
    try {
      await inngest.send({
        name: "chatbot/documents.uploaded",
        data: {
          configId: id,
          documents: newDocuments
        }
      });
    } catch (inngestError) {
      console.error('Error triggering document processing:', inngestError);
    }

    const skippedCount = files.length - uniqueFiles.length;
    let message = `${uniqueFiles.length} document(s) uploaded successfully`;
    if (skippedCount > 0) {
      message += ` (${skippedCount} duplicate(s) skipped)`;
    }

    res.status(200).json({
      success: true,
      data: {
        chatbot: updatedChatbot,
        uploadedDocuments: newDocuments,
        skippedDuplicates: skippedCount
      },
      message: message
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload documents',
      error: error.message
    });
  }
};

// DELETE /api/dashboard/user/chatbot/:id/documents/:documentId - Delete document
const deleteDocument = async (req, res) => {
  try {
    const userId = req.userId;
    const { id, documentId } = req.params;

    // Check if chatbot exists and belongs to user
    const existingChatbot = await prisma.userChatBot.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingChatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found'
      });
    }

    const documents = existingChatbot.uploadedDocuments || [];
    const documentIndex = parseInt(documentId);

    if (documentIndex < 0 || documentIndex >= documents.length) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const documentToDelete = documents[documentIndex];

    // Delete file from filesystem
    try {
      const filePath = path.join(__dirname, '../../public/user-chat-bot', documentToDelete.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
    }

    // Remove document from array
    const updatedDocuments = documents.filter((_, index) => index !== documentIndex);

    // Update chatbot
    const updatedChatbot = await prisma.userChatBot.update({
      where: { id },
      data: {
        uploadedDocuments: updatedDocuments
      }
    });

    // Trigger document deletion from vector store
    try {
      await inngest.send({
        name: "chatbot/documents.deleted",
        data: {
          configId: id,
          documentSources: [documentToDelete.path || documentToDelete.filename]
        }
      });
    } catch (inngestError) {
      console.error('Error triggering document deletion:', inngestError);
    }

    res.status(200).json({
      success: true,
      data: updatedChatbot,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
};

// GET /api/dashboard/user/chatbot/:id/config - Get chatbot config for chat service
const getUserChatBotConfig = async (req, res) => {
  try {
    const { id } = req.params;

    const chatbot = await prisma.userChatBot.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
        companyCategory: true,
        instructions: true,
        chatEnabled: true,
        uploadedDocuments: true,
        appearance: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot configuration not found'
      });
    }

    if (!chatbot.chatEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Chatbot is currently disabled'
      });
    }

    res.status(200).json({
      success: true,
      data: chatbot,
      message: 'Chatbot configuration retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching chatbot config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chatbot configuration',
      error: error.message
    });
  }
};

// PUT /api/dashboard/user/chatbot/:id/appearance - Update chatbot appearance settings
const updateChatBotAppearance = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { appearance } = req.body;

    // Validate appearance data
    if (!appearance) {
      return res.status(400).json({
        success: false,
        message: 'Appearance data is required'
      });
    }

    // Check if chatbot exists and belongs to user
    const existingChatbot = await prisma.userChatBot.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingChatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found'
      });
    }

    // Update appearance settings
    const updatedChatbot = await prisma.userChatBot.update({
      where: { id },
      data: {
        appearance: appearance
      },
      select: {
        id: true,
        companyName: true,
        appearance: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      data: updatedChatbot,
      message: 'Appearance settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating appearance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appearance settings',
      error: error.message
    });
  }
};

module.exports = {
  createUserChatBot,
  getUserChatBots,
  getUserChatBotById,
  updateUserChatBot,
  deleteUserChatBot,
  uploadDocuments,
  deleteDocument,
  getUserChatBotConfig,
  updateChatBotAppearance
};