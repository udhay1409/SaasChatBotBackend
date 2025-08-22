const express = require('express');
const { serve } = require("inngest/express");
const { inngest } = require("../../services/inngest");
const { 
  processDocuments, 
  deleteDocuments, 
  updateChatbotConfig 
} = require("../../inngest/functions");

const router = express.Router();

// Create the Inngest serve handler
const inngestHandler = serve({
  client: inngest,
  functions: [
    processDocuments,
    deleteDocuments,
    updateChatbotConfig,
  ],
});

// Handle both GET and POST requests for Inngest
router.use("/inngest", inngestHandler);

module.exports = router;