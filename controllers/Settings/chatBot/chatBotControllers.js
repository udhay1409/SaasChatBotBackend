const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { inngest } = require('../../../services/inngest');
const prisma = new PrismaClient();

// GET - Retrieve chatbot configurations
const getBOT = async (req, res) => {
  try {
    const chatbots = await prisma.chatBot.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: chatbots,
      message: 'Chatbot configurations retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching chatbot configurations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chatbot configurations',
      error: error.message
    });
  }
};

// POST - Create new chatbot configuration
const postBOT = async (req, res) => {
  try {
    const {
      companyName,
      companyCategory,
      instructions,
      exampleConversation,
      chatEnabled
    } = req.body;

    // Validate required fields
    if (!companyName || !companyCategory || !instructions) {
      return res.status(400).json({
        success: false,
        message: 'Company name, category, and instructions are required'
      });
    }

    // Process uploaded files
    const processedDocuments = req.files ? req.files.map(file => ({
      name: file.originalname,
      filename: file.filename,
      size: file.size,
      type: file.mimetype,
      path: `/public/chat-bot/${file.filename}`,
      uploadedAt: new Date().toISOString()
    })) : [];

    const newChatBot = await prisma.chatBot.create({
      data: {
        companyName,
        companyCategory,
        instructions,
        exampleConversation: exampleConversation || '',
        chatEnabled: chatEnabled !== undefined ? JSON.parse(chatEnabled) : true,
        uploadedDocuments: processedDocuments
      }
    });

    // Trigger document processing if documents were uploaded
    if (processedDocuments.length > 0) {
      console.log(`🚀 Triggering document processing for ${processedDocuments.length} documents`);
      await inngest.send({
        name: "chatbot/documents.uploaded",
        data: {
          configId: newChatBot.id,
          documents: processedDocuments
        }
      });
      console.log(`✅ Document processing triggered for config: ${newChatBot.id}`);
    }

    res.status(201).json({
      success: true,
      data: newChatBot,
      message: 'Chatbot configuration created successfully'
    });
  } catch (error) {
    console.error('Error creating chatbot configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chatbot configuration',
      error: error.message
    });
  }
};

// PUT - Update chatbot configuration
const putBOT = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      companyName,
      companyCategory,
      instructions,
      exampleConversation,
      chatEnabled
    } = req.body;

    // Check if chatbot exists
    const existingChatBot = await prisma.chatBot.findUnique({
      where: { id }
    });

    if (!existingChatBot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot configuration not found'
      });
    }

    // Handle existing documents (for document removal)
    let processedDocuments = existingChatBot.uploadedDocuments;
    
    // If existingDocuments is provided, use it as the base (this handles document removal)
    if (req.body.existingDocuments) {
      try {
        const newDocumentsList = JSON.parse(req.body.existingDocuments);
        
        // Find documents that were removed and delete their files
        const removedDocuments = existingChatBot.uploadedDocuments.filter(
          existingDoc => !newDocumentsList.some(newDoc => newDoc.filename === existingDoc.filename)
        );
        
        // Delete physical files for removed documents
        removedDocuments.forEach(doc => {
          if (doc.filename) {
            const filePath = path.join(__dirname, '../../../public/chat-bot', doc.filename);
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error('Error deleting file:', filePath, err);
              } else {
                console.log('Successfully deleted file:', filePath);
              }
            });
          }
        });
        
        processedDocuments = newDocumentsList;
      } catch (error) {
        console.error('Error parsing existingDocuments:', error);
      }
    }
    
    // Process new uploaded files and append them
    if (req.files && req.files.length > 0) {
      const newDocuments = req.files.map(file => ({
        name: file.originalname,
        filename: file.filename,
        size: file.size,
        type: file.mimetype,
        path: `/public/chat-bot/${file.filename}`,
        uploadedAt: new Date().toISOString()
      }));
      
      // Append new documents to existing ones
      processedDocuments = [...processedDocuments, ...newDocuments];
    }

    const updatedChatBot = await prisma.chatBot.update({
      where: { id },
      data: {
        ...(companyName && { companyName }),
        ...(companyCategory && { companyCategory }),
        ...(instructions && { instructions }),
        ...(exampleConversation !== undefined && { exampleConversation }),
        ...(chatEnabled !== undefined && { chatEnabled: JSON.parse(chatEnabled) }),
        uploadedDocuments: processedDocuments
      }
    });

    // Determine what changed for Inngest processing
    const changes = {
      documentsAdded: [],
      documentsRemoved: []
    };

    // Find newly added documents
    if (req.files && req.files.length > 0) {
      changes.documentsAdded = req.files.map(file => ({
        name: file.originalname,
        filename: file.filename,
        size: file.size,
        type: file.mimetype,
        path: `/public/chat-bot/${file.filename}`,
        uploadedAt: new Date().toISOString()
      }));
    }

    // Find removed documents
    if (req.body.existingDocuments) {
      const newDocumentsList = JSON.parse(req.body.existingDocuments);
      changes.documentsRemoved = existingChatBot.uploadedDocuments.filter(
        existingDoc => !newDocumentsList.some(newDoc => newDoc.filename === existingDoc.filename)
      );
    }

    // Trigger Inngest event if there are changes
    if (changes.documentsAdded.length > 0 || changes.documentsRemoved.length > 0) {
      console.log(`🚀 Triggering config update for ${changes.documentsAdded.length} added, ${changes.documentsRemoved.length} removed documents`);
      
      // Add a small delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await inngest.send({
        name: "chatbot/config.updated",
        data: {
          configId: id,
          changes
        }
      });
      console.log(`✅ Config update event sent for: ${id}`);
    } else {
      console.log(`ℹ️ No document changes detected, skipping Inngest trigger for: ${id}`);
    }

    res.status(200).json({
      success: true,
      data: updatedChatBot,
      message: 'Chatbot configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating chatbot configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chatbot configuration',
      error: error.message
    });
  }
};

// DELETE - Delete chatbot configuration
const deleteBOT = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if chatbot exists
    const existingChatBot = await prisma.chatBot.findUnique({
      where: { id }
    });

    if (!existingChatBot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot configuration not found'
      });
    }

    await prisma.chatBot.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Chatbot configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chatbot configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chatbot configuration',
      error: error.message
    });
  }
};

module.exports = {
  getBOT,
  postBOT,
  putBOT,
  deleteBOT
};