const { Inngest } = require("inngest");

// Create an Inngest client
const inngest = new Inngest({ 
  id: "chatbot-app",
  name: "ChatBot Application"
});

module.exports = { inngest };