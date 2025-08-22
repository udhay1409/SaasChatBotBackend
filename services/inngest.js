const { Inngest } = require("inngest");

// Create an Inngest client
const inngest = new Inngest({ 
  id: "chatbot-app",
  name: "ChatBot Application",
    eventKey: process.env.INNGEST_EVENT_KEY,   // 🔑 REQUIRED
  serveHost: process.env.INNGEST_SERVE_HOST, // Optional
});

module.exports = { inngest };