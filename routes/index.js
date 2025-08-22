const express = require('express');
const authRoutes = require('./auth/authRoutes');
const emailConfigRoutes = require('./settings/email-configuration/emailRoutes');
const Bot = require("./settings/chat-bot/chatbot");
const chatRoutes = require('./chat/chatRoutes');
const inngestRoutes = require('./inngest/inngestRoutes');

const organizationRoutes = require('./organization/organization');
const userChatBot = require('./UserChatBot/userchatbotRoutes');

const router = express.Router();

router.use('/auth', authRoutes); 
router.use('/dashboard/settings/email-configuration', emailConfigRoutes);
router.use('/dashboard/settings/chat-bot', Bot);
router.use('/chat', chatRoutes);

router.use('/dashboard/admin/organization', organizationRoutes);

router.use('/dashboard/user/chatbot', userChatBot);

// Inngest webhook routes
router.use('/', inngestRoutes);

module.exports = router; 