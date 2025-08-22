const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
    getBOT,
    postBOT,
    putBOT,
    deleteBOT
} = require("../../../controllers/Settings/chatBot/chatBotControllers");

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../../public/chat-bot');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only specific file types
  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// GET /api/dashboard/settings/chat-bot
router.get('/', getBOT);

// POST /api/dashboard/settings/chat-bot (with file upload)
router.post('/', upload.array('documents', 10), postBOT);

// PUT /api/dashboard/settings/chat-bot/:id (with file upload)
router.put('/:id', upload.array('documents', 10), putBOT);

// DELETE /api/dashboard/settings/chat-bot/:id
router.delete('/:id', deleteBOT);

module.exports = router;