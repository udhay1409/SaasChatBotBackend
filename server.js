// const express = require("express");
// const cors = require("cors");
// const session = require("express-session");
// const passport = require("./config/auth");
// const { connectDB, disconnectDB } = require("./config/database");
// const apiRoutes = require("./routes");
// require("dotenv").config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // Allow requests with no origin (like mobile apps or curl requests)
//       if (!origin) return callback(null, true);

//       // Allow specific origins
//       const allowedOrigins = [
//         process.env.FRONTEND_URL,
//         process.env.BACKEND_URL,
//         process.env.INNGEST_SERVE_HOST,
//         "http://localhost:3000", // Add localhost for development
//       ];

//       // Allow any origin for embed routes (for chatbot embedding)
//       if (allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       }

//       // Allow all origins for embedded chatbot
//       return callback(null, true);
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: [
//       "Content-Type", 
//       "Authorization", 
//       "X-Requested-With",
//       "ngrok-skip-browser-warning", // Add ngrok header
//       "Accept",
//       "Origin",
//       "Cache-Control",
//       "X-Requested-With"
//     ],
//   })
// );
// app.use(express.json());

// // Session middleware for Passport
// app.use(session({
//   secret: process.env.JWT_SECRET,
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     secure: process.env.NODE_ENV === 'production',
//     httpOnly: true,
//     maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
//   }
// }));

// // Initialize Passport
// app.use(passport.initialize());
// app.use(passport.session());

// // Serve static files from public directory
// app.use("/public", express.static("public"));

// // Serve user chatbot documents with proper headers for download
// app.get("/api/documents/user-chatbot/:configId/:filename", async (req, res) => {
//   try {
//     const { configId, filename } = req.params;
//     const fs = require('fs');
//     const path = require('path');
    
//     // Verify the chatbot exists and get document info
//     const { prisma } = require('./config/database');
//     const chatbot = await prisma.userChatBot.findUnique({
//       where: { id: configId },
//       select: { uploadedDocuments: true, companyName: true }
//     });
    
//     if (!chatbot) {
//       return res.status(404).json({ error: 'Chatbot not found' });
//     }
    
//     // Find the document in the chatbot's uploaded documents
//     const document = chatbot.uploadedDocuments.find(doc => doc.filename === filename);
//     if (!document) {
//       return res.status(404).json({ error: 'Document not found' });
//     }
    
//     // Construct file path
//     const filePath = path.join(__dirname, 'public', 'user-chat-bot', filename);
    
//     // Check if file exists
//     if (!fs.existsSync(filePath)) {
//       return res.status(404).json({ error: 'File not found on server' });
//     }
    
//     // Set headers for download
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
//     res.setHeader('Access-Control-Allow-Origin', '*');
    
//     // Send file
//     res.sendFile(filePath);
    
//   } catch (error) {
//     console.error('Error serving document:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // Dynamic widget endpoint that injects environment variables
// app.get("/public/UserChatBotWidget/userChatBotWidget.js", (req, res) => {
//   const fs = require('fs');
//   const path = require('path');
  
//   // Read the widget file
//   const widgetPath = path.join(__dirname, 'public', 'UserChatBotWidget', 'userChatBotWidget.js');
//   let widgetContent = fs.readFileSync(widgetPath, 'utf8');
  
//   // Replace the hardcoded base URL with environment variable
//   const baseUrl = process.env.BACKEND_URL || process.env.INNGEST_SERVE_HOST || 'https://harmless-flea-inviting.ngrok-free.app';
//   widgetContent = widgetContent.replace(
//     "baseUrl: 'https://harmless-flea-inviting.ngrok-free.app',",
//     `baseUrl: '${baseUrl}',`
//   );
  
//   res.setHeader('Content-Type', 'application/javascript');
//   res.send(widgetContent);
// });

// // Request logging middleware
// app.use((req, res, next) => {
//   const originalSend = res.send;
//   res.send = function (data) {
//     const method = req.method;
//     const url = req.originalUrl;
//     const statusCode = res.statusCode;

//     console.log(`${method} ${url} - ${statusCode}`);

//     originalSend.call(this, data);
//   };

//   next();
// });

// // Basic route
// app.get("/", (req, res) => {
//   res.json({ message: "Backend server is running!" });
// });

// // Health check route
// app.get("/health", (req, res) => {
//   res.json({ status: "OK", timestamp: new Date().toISOString() });
// });


// // API routes
// app.use("/api", apiRoutes);

// // Embed routes (direct mount for public access)
// const embedRoutes = require("./routes/embed/embedRoutes");
// app.use("/embed", embedRoutes);

// // Also mount embed routes under /api for API access
// app.use("/api/embed", embedRoutes);

// // Session cleanup function
// const cleanupExpiredSessions = async () => {
//   try {
//     const { prisma } = require('./config/database');
//     const result = await prisma.session.deleteMany({
//       where: {
//         expires: {
//           lt: new Date()
//         }
//       }
//     });
//     if (result.count > 0) {
//       console.log(`🧹 Cleaned up ${result.count} expired sessions`);
//     }
//   } catch (error) {
//     console.error('❌ Error cleaning up expired sessions:', error);
//   }
// };

// // Start server
// app.listen(PORT, async () => {
//   await connectDB();
//   console.log(`Server running on port ${PORT}`);
  
//   // Clean up expired sessions on startup
//   await cleanupExpiredSessions();
  
//   // Set up periodic session cleanup (every hour)
//   setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
// });

// // Graceful shutdown
// process.on("SIGINT", async () => {
//   await disconnectDB();
//   process.exit(0);
// });

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/auth");
const { connectDB, disconnectDB } = require("./config/database");
const apiRoutes = require("./routes");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration to fix the widget issue
app.use(
  cors({
    origin: function (origin, callback) {
      console.log('🌐 CORS Request from origin:', origin);
      
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) {
        console.log('✅ Allowing request with no origin');
        return callback(null, true);
      }

      // Define allowed origins
      const allowedOrigins = [
        process.env.FRONTEND_URL,          // https://saas-chat-bot-frontend-ten.vercel.app
        process.env.BACKEND_URL,           // https://saaschatbotbackend.onrender.com
        process.env.INNGEST_SERVE_HOST,    // https://saas-chat-bot-frontend-ten.vercel.app
        "http://localhost:3000",           // Development
        "http://localhost:5000",           // Development backend
        "https://localhost:3000",          // HTTPS development
        "https://localhost:5000"           // HTTPS development backend
      ];

      // Remove duplicates and filter out undefined values
      const uniqueOrigins = [...new Set(allowedOrigins.filter(Boolean))];
      
      console.log('🔍 Checking against allowed origins:', uniqueOrigins);

      // Check if the origin is in the allowed list
      if (uniqueOrigins.includes(origin)) {
        console.log('✅ Origin allowed:', origin);
        return callback(null, true);
      }

      // For chatbot embed functionality, allow all origins
      // This is necessary for the widget to work when embedded on customer websites
      console.log('🤖 Allowing origin for chatbot embed functionality:', origin);
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization", 
      "X-Requested-With",
      "ngrok-skip-browser-warning",
      "Accept",
      "Origin",
      "Cache-Control",
      "X-Requested-With",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers"
    ],
    // Important: Expose headers for the frontend to access
    exposedHeaders: [
      "Content-Length",
      "X-Requested-With"
    ],
    // Handle preflight requests
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  console.log('🔄 Handling preflight OPTIONS request for:', req.path);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,ngrok-skip-browser-warning,Accept,Origin,Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

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

// FIXED: Dynamic widget endpoint that injects environment variables
app.get("/public/UserChatBotWidget/userChatBotWidget.js", (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Read the widget file
    const widgetPath = path.join(__dirname, 'public', 'UserChatBotWidget', 'userChatBotWidget.js');
    
    if (!fs.existsSync(widgetPath)) {
      console.error('❌ Widget file not found at:', widgetPath);
      return res.status(404).send('Widget file not found');
    }
    
    let widgetContent = fs.readFileSync(widgetPath, 'utf8');
    
    // Replace the base URL with the correct backend URL
    const baseUrl = process.env.BACKEND_URL || 'https://saaschatbotbackend.onrender.com';
    console.log('🔧 Injecting base URL into widget:', baseUrl);
    
    // Replace multiple possible patterns
    widgetContent = widgetContent.replace(
      /baseUrl:\s*["'][^"']*["']/g,
      `baseUrl: "${baseUrl}"`
    );
    
    // Also replace process.env references
    widgetContent = widgetContent.replace(
      /process\.env\.BACKEND_URL\s*\|\|\s*process\.env\.INNGEST_SERVE_HOST\s*\|\|\s*["'][^"']*["']/g,
      `"${baseUrl}"`
    );
    
    // Set proper headers for JavaScript
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.send(widgetContent);
    
  } catch (error) {
    console.error('❌ Error serving widget file:', error);
    res.status(500).send('Error loading widget');
  }
});

// Request logging middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function (data) {
    const method = req.method;
    const url = req.originalUrl;
    const statusCode = res.statusCode;
    const origin = req.headers.origin || 'no-origin';

    console.log(`${method} ${url} - ${statusCode} (Origin: ${origin})`);

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
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 CORS configured for origins:`, {
    frontend: process.env.FRONTEND_URL,
    backend: process.env.BACKEND_URL,
    inngest: process.env.INNGEST_SERVE_HOST
  });
  
  // Clean up expired sessions on startup
  await cleanupExpiredSessions();
  
  // Set up periodic session cleanup (every hour)
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log('🛑 Shutting down server...');
  await disconnectDB();
  process.exit(0);
});