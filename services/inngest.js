const { Inngest } = require("inngest");

// Create an Inngest client
const inngest = new Inngest({ 
  id: "chatbot-app",
  name: "ChatBot Application",
  eventKey: process.env.INNGEST_EVENT_KEY,   // 🔑 REQUIRED
  serveHost: process.env.INNGEST_SERVE_HOST, // Optional
});
console.log("🔑 EVENT_KEY exists?", !!process.env.INNGEST_EVENT_KEY);
console.log("🔗 SERVE_HOST:", process.env.INNGEST_SERVE_HOST);


module.exports = { inngest };