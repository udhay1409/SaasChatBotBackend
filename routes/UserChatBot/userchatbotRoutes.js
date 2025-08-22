const express = require('express');
const {
  createUserChatBot,
  getUserChatBots,
  getUserChatBotById,
  updateUserChatBot,
  deleteUserChatBot,
  uploadDocuments,
  deleteDocument,
  getUserChatBotConfig,
  updateChatBotAppearance
} = require('../../controllers/UserChatBot/userChatBotControllers');
const { authenticateToken } = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/user-chat-bot/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.doc', '.docx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, DOC, and DOCX files are allowed.'));
    }
  }
});

// All routes require authentication
router.use(authenticateToken);

// GET /api/dashboard/user/chatbot - Get all user's chatbots
router.get('/', getUserChatBots);

// POST /api/dashboard/user/chatbot - Create a new chatbot
router.post('/', createUserChatBot);

// GET /api/dashboard/user/chatbot/:id - Get specific chatbot by ID
router.get('/:id', getUserChatBotById);

// PUT /api/dashboard/user/chatbot/:id - Update chatbot
router.put('/:id', updateUserChatBot);

// DELETE /api/dashboard/user/chatbot/:id - Delete chatbot
router.delete('/:id', deleteUserChatBot);

// POST /api/dashboard/user/chatbot/:id/documents - Upload documents
router.post('/:id/documents', upload.array('documents', 10), uploadDocuments);

// DELETE /api/dashboard/user/chatbot/:id/documents/:documentId - Delete document
router.delete('/:id/documents/:documentId', deleteDocument);

// GET /api/dashboard/user/chatbot/:id/config - Get chatbot config for chat service
router.get('/:id/config', getUserChatBotConfig);

// PUT /api/dashboard/user/chatbot/:id/appearance - Update chatbot appearance settings
router.put('/:id/appearance', updateChatBotAppearance);

module.exports = router;