const express = require('express');
const path = require('path');
const userChatBotEmbedRoutes = require('./userChatBotEmbededRoutes');
const userChatBotPreview = require('./userChatBotPreview');
const userChatBotAppearance = require('./userChatBotAppearance');

const router = express.Router();

// Include user chatbot embed routes
router.use('/', userChatBotEmbedRoutes);
router.use('/', userChatBotPreview);
router.use('/', userChatBotAppearance);

// GET /embed/chatbot - Serve embedded chatbot page with React component
router.get('/chatbot', (req, res) => {
  const { configId } = req.query;
  
  // Generate the embedded chatbot HTML that loads React component
  const embedHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Chatbot</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: transparent;
            height: 100vh;
            overflow: hidden;
        }
        
        #chatbot-container {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        }
        
        .chatbot-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
            border-radius: 12px 12px 0 0;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .chatbot-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }
        
        .chatbot-info h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .chatbot-info p {
            font-size: 12px;
            opacity: 0.8;
        }
        
        .chatbot-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: linear-gradient(to bottom, #f8fafc, #ffffff);
        }
        
        .message {
            margin-bottom: 16px;
            display: flex;
            gap: 8px;
        }
        
        .message.user {
            flex-direction: row-reverse;
        }
        
        .message-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            flex-shrink: 0;
        }
        
        .message.bot .message-avatar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .message.user .message-avatar {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
        }
        
        .message-content {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 18px;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .message.bot .message-content {
            background: white;
            border: 1px solid #e2e8f0;
            color: #334155;
        }
        
        .message.user .message-content {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
        }
        
        .typing-indicator {
            display: none;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .typing-dots {
            display: flex;
            gap: 4px;
        }
        
        .typing-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #667eea;
            animation: typing 1.4s infinite ease-in-out;
        }
        
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes typing {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-10px); }
        }
        
        .chatbot-input {
            padding: 16px;
            border-top: 1px solid #e2e8f0;
            background: white;
            border-radius: 0 0 12px 12px;
        }
        
        .input-container {
            display: flex;
            gap: 8px;
            align-items: flex-end;
        }
        
        .input-field {
            flex: 1;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 24px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
            resize: none;
            min-height: 44px;
            max-height: 120px;
        }
        
        .input-field:focus {
            border-color: #667eea;
        }
        
        .send-button {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
        }
        
        .send-button:hover {
            transform: scale(1.05);
        }
        
        .send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        @media (max-width: 768px) {
            #chatbot-container {
                border-radius: 0;
                height: 100vh;
            }
            
            .chatbot-header {
                border-radius: 0;
            }
            
            .chatbot-input {
                border-radius: 0;
            }
        }
    </style>
</head>
<body>
    <div id="chatbot-container">
        <div class="chatbot-header">
            <div class="chatbot-avatar">🤖</div>
            <div class="chatbot-info">
                <h3 id="chatbot-title">AI Assistant</h3>
                <p id="chatbot-status">Online • Ready to help</p>
            </div>
        </div>
        
        <div class="chatbot-messages" id="messages-container">
            <div class="message bot">
                <div class="message-avatar">🤖</div>
                <div class="message-content" id="welcome-message">
                    Hello! 👋 I'm your AI assistant. How can I help you today?
                </div>
            </div>
            
            <div class="typing-indicator" id="typing-indicator">
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="chatbot-input">
            <div class="input-container">
                <textarea 
                    id="message-input" 
                    class="input-field" 
                    placeholder="Type your message..."
                    rows="1"
                ></textarea>
                <button id="send-button" class="send-button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22,2 15,22 11,13 2,9"></polygon>
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <script>
        // Configuration
        const CONFIG = {
            configId: '${configId || 'default'}',
            baseUrl: '${process.env.BACKEND_URL || process.env.INNGEST_SERVE_HOST || 'https://harmless-flea-inviting.ngrok-free.app'}',
            sessionId: null
        };

        // DOM elements
        const messagesContainer = document.getElementById('messages-container');
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        const typingIndicator = document.getElementById('typing-indicator');
        const chatbotTitle = document.getElementById('chatbot-title');
        const chatbotStatus = document.getElementById('chatbot-status');
        const welcomeMessage = document.getElementById('welcome-message');

        // Initialize chatbot
        async function initializeChatbot() {
            try {
                // Fetch chatbot configuration
                const response = await fetch(\`\${CONFIG.baseUrl}/api/dashboard/settings/chat-bot\`);
                const data = await response.json();
                
                if (data.success && data.data.length > 0) {
                    const config = CONFIG.configId !== 'default' 
                        ? data.data.find(c => c.id === CONFIG.configId) || data.data[0]
                        : data.data[0];
                    
                    // Update UI with config
                    chatbotTitle.textContent = config.companyName + ' Assistant';
                    welcomeMessage.textContent = \`Hello! 👋 I'm your \${config.companyName} assistant. How can I help you today?\`;
                }
            } catch (error) {
                console.error('Failed to initialize chatbot:', error);
            }
        }

        // Send message function
        async function sendMessage(message) {
            if (!message.trim()) return;

            // Add user message to chat
            addMessage(message, 'user');
            
            // Clear input
            messageInput.value = '';
            adjustTextareaHeight();
            
            // Show typing indicator
            showTyping(true);
            
            try {
                const response = await fetch(\`\${CONFIG.baseUrl}/api/chat\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message,
                        sessionId: CONFIG.sessionId,
                        configId: CONFIG.configId
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    // Set session ID if first message
                    if (!CONFIG.sessionId) {
                        CONFIG.sessionId = data.data.sessionId;
                    }
                    
                    // Add bot response
                    addMessage(data.data.response, 'bot');
                } else {
                    addMessage('Sorry, I encountered an error. Please try again.', 'bot');
                }
            } catch (error) {
                console.error('Error sending message:', error);
                addMessage('Sorry, I\\'m having trouble connecting. Please try again.', 'bot');
            } finally {
                showTyping(false);
            }
        }

        // Add message to chat
        function addMessage(content, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${sender}\`;
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.textContent = sender === 'user' ? '👤' : '🤖';
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageContent.textContent = content;
            
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(messageContent);
            
            // Insert before typing indicator
            messagesContainer.insertBefore(messageDiv, typingIndicator);
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Show/hide typing indicator
        function showTyping(show) {
            typingIndicator.style.display = show ? 'flex' : 'none';
            if (show) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }

        // Adjust textarea height
        function adjustTextareaHeight() {
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
        }

        // Event listeners
        sendButton.addEventListener('click', () => {
            sendMessage(messageInput.value);
        });

        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(messageInput.value);
            }
        });

        messageInput.addEventListener('input', adjustTextareaHeight);

        // Initialize on load
        document.addEventListener('DOMContentLoaded', () => {
            initializeChatbot();
            messageInput.focus();
        });
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow embedding in iframes
  res.send(embedHTML);
});

module.exports = router; 