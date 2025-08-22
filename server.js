const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/auth");
const { connectDB, disconnectDB } = require("./config/database");
const apiRoutes = require("./routes");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true)

      const allowedOrigins = [
        process.env.FRONTEND_URL,
        process.env.BACKEND_URL,
        process.env.INNGEST_SERVE_HOST,
        "http://localhost:3000", // Add localhost for development
        "https://saas-chat-bot-frontend-ten.vercel.app", // Add your specific frontend URL
        "https://saaschatbotbackend.onrender.com", // Add your backend URL
      ]

      const validOrigins = allowedOrigins.filter((allowedOrigin) => allowedOrigin && allowedOrigin.trim() !== "")

      if (validOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(null, true)
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "ngrok-skip-browser-warning",
      "Accept",
      "Origin",
      "Cache-Control",
    ],
  }),
)
app.use(express.json());

// Session middleware for Passport
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from public directory
app.use("/public", express.static("public"));

// Serve user chatbot documents with proper headers for download
app.get("/api/documents/user-chatbot/:configId/:filename", async (req, res) => {
  try {
    const { configId, filename } = req.params;
    const fs = require('fs');
    const path = require('path');
    
    // Verify the chatbot exists and get document info
    const { prisma } = require('./config/database');
    const chatbot = await prisma.userChatBot.findUnique({
      where: { id: configId },
      select: { uploadedDocuments: true, companyName: true }
    });
    
    if (!chatbot) {
      return res.status(404).json({ error: 'Chatbot not found' });
    }
    
    // Find the document in the chatbot's uploaded documents
    const document = chatbot.uploadedDocuments.find(doc => doc.filename === filename);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Construct file path
    const filePath = path.join(__dirname, 'public', 'user-chat-bot', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }
    
    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Send file
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('Error serving document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dynamic widget endpoint that injects environment variables
app.get("/public/UserChatBotWidget/userChatBotWidget.js", (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  // Read the widget file
  const widgetPath = path.join(__dirname, 'public', 'UserChatBotWidget', 'userChatBotWidget.js');
  let widgetContent = fs.readFileSync(widgetPath, 'utf8');
  
  // Replace the hardcoded base URL with environment variable
  const baseUrl = process.env.BACKEND_URL || process.env.INNGEST_SERVE_HOST;
  widgetContent = widgetContent.replace(
    "baseUrl: 'https://saaschatbotbackend.onrender.com',",
    `baseUrl: '${baseUrl}',`
  );
  
  res.setHeader('Content-Type', 'application/javascript');
  res.send(widgetContent);
});

// Request logging middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function (data) {
    const method = req.method;
    const url = req.originalUrl;
    const statusCode = res.statusCode;

    console.log(`${method} ${url} - ${statusCode}`);

    originalSend.call(this, data);
  };

  next();
});

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Backend server is running!" });
});

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});


// API routes
app.use("/api", apiRoutes);

// Embed routes (direct mount for public access)
const embedRoutes = require("./routes/embed/embedRoutes");
app.use("/embed", embedRoutes);

// Also mount embed routes under /api for API access
app.use("/api/embed", embedRoutes);

// Session cleanup function
const cleanupExpiredSessions = async () => {
  try {
    const { prisma } = require('./config/database');
    const result = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    });
    if (result.count > 0) {
      console.log(`🧹 Cleaned up ${result.count} expired sessions`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up expired sessions:', error);
  }
};

// Start server
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on port ${PORT}`);
  
  // Clean up expired sessions on startup
  await cleanupExpiredSessions();
  
  // Set up periodic session cleanup (every hour)
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});
