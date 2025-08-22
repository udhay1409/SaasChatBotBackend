const express = require('express');
const { sendUserChatBotMessage, getUserChatBotEmbedConfig } = require('../../controllers/embed/userChatBotEmbedControllers');

const router = express.Router(); 

// POST /api/embed/user-chatbot - Send message to user's chatbot (public endpoint)
router.post('/user-chatbot', sendUserChatBotMessage);

// GET /api/embed/user-chatbot/:configId/config - Get user chatbot config for embed (public endpoint)
router.get('/user-chatbot/:configId/config', getUserChatBotEmbedConfig);

// GET /embed/user-chatbot - Serve embedded user chatbot page (matches widget design exactly)
router.get('/user-chatbot', (req, res) => {
  const { configId, primaryColor, position, borderRadius, theme, showAppearance } = req.query;
  
  // Default appearance settings
  const appearance = {
    primaryColor: primaryColor || '#3b82f6',
    secondaryColor: '#7c3aed',
    position: position || 'bottom-right',
    borderRadius: borderRadius || '12px',
    theme: theme || 'light'
  };
  
  // Generate the embedded user chatbot HTML that matches the widget design exactly
  const embedHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Chatbot ${showAppearance ? '- Appearance Customizer' : ''}</title>
    <style>
        :root {
            --primary-color: ${appearance.primaryColor};
            --secondary-color: ${appearance.secondaryColor};
            --border-radius: ${appearance.borderRadius};
            --theme-bg: ${appearance.theme === 'dark' ? '#1f2937' : '#f8fafc'};
            --theme-text: ${appearance.theme === 'dark' ? '#ffffff' : '#000000'};
            --chat-bg: ${appearance.theme === 'dark' ? 'rgba(31,41,55,0.95)' : 'rgba(255,255,255,0.95)'};
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--theme-bg);
            height: 100vh;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--theme-text);
        }
        
        #main-container {
            display: flex;
            gap: 20px;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            padding: 20px;
        }
        
        #chatbot-container {
            width: 400px;
            height: 600px;
            background: var(--chat-bg);
            backdrop-filter: blur(8px);
            border-radius: var(--border-radius);
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
            border: 2px solid rgba(255,255,255,0.1);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            max-width: calc(100vw - 40px);
            max-height: calc(100vh - 40px);
        }
        
        .chatbot-header {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            color: white;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-radius: var(--border-radius) var(--border-radius) 0 0;
        }
        
        .header-content {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
            min-width: 0;
        }
        
        .chatbot-avatar-container {
            position: relative;
            flex-shrink: 0;
        }
        
        .chatbot-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(255,255,255,0.3);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .status-indicator {
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
            background: #10b981;
        }
        
        .chatbot-info {
            min-width: 0;
            flex: 1;
        }
        
        .chatbot-title {
            font-size: 16px;
            font-weight: 600;
            margin: 0;
            color: white;
        }
        
        .status-container {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 4px;
        }
        
        .status-badge {
            font-size: 12px;
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.3);
        }
        
        .status-text {
            font-size: 12px;
            opacity: 0.8;
            color: rgba(255,255,255,0.8);
        }
        
        .chatbot-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: linear-gradient(to bottom, rgba(248,250,252,0.5), white);
            scroll-behavior: smooth;
        }
        
        .message {
            display: flex;
            margin-bottom: 16px;
        }
        
        .message.user {
            justify-content: flex-end;
        }
        
        .message.bot {
            justify-content: flex-start;
        }
        
        .message-content {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            max-width: 85%;
        }
        
        .message.user .message-content {
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
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .message.bot .message-avatar {
            background: linear-gradient(135deg, var(--secondary-color) 0%, var(--primary-color) 100%);
            color: white;
            border: 1px solid rgba(124,58,237,0.2);
        }
        
        .message.user .message-avatar {
            background: linear-gradient(135deg, var(--primary-color) 0%, #1d4ed8 100%);
            color: white;
            border: 1px solid rgba(59,130,246,0.2);
        }
        
        .message-wrapper {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .message-bubble {
            padding: 12px 16px;
            border-radius: 18px;
            font-size: 14px;
            line-height: 1.4;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            backdrop-filter: blur(4px);
            transition: all 0.2s;
            white-space: pre-line;
        }
        
        .message.bot .message-bubble {
            background: white;
            color: #334155;
            border: 1px solid #e2e8f0;
        }
        
        .message.user .message-bubble {
            background: linear-gradient(135deg, var(--primary-color) 0%, #1d4ed8 100%);
            color: white;
        }
        
        .message-timestamp {
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
            padding: 0 4px;
        }
        
        .message.user .message-timestamp {
            text-align: right;
        }
        
        .message.bot .message-timestamp {
            text-align: left;
        }
        
        .typing-indicator {
            display: none;
            justify-content: flex-start;
            margin-bottom: 16px;
        }
        
        .typing-content {
            display: flex;
            align-items: flex-start;
            gap: 8px;
        }
        
        .typing-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, #7c3aed 0%, #4338ca 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border: 1px solid rgba(124,58,237,0.2);
        }
        
        .typing-bubble {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            padding: 12px 16px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .typing-dots-container {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .typing-dots {
            display: flex;
            gap: 4px;
        }
        
        .typing-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #7c3aed;
            animation: typing-bounce 1.4s infinite ease-in-out;
        }
        
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        
        .typing-text {
            font-size: 12px;
            color: #6b7280;
        }
        
        @keyframes typing-bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-8px); }
        }
        
        .chatbot-input {
            padding: 16px;
            border-top: 1px solid #e2e8f0;
            background: rgba(255,255,255,0.8);
            backdrop-filter: blur(4px);
            border-radius: 0 0 12px 12px;
        }
        
        .input-container {
            display: flex;
            align-items: flex-end;
            gap: 8px;
        }
        
        .input-wrapper {
            flex: 1;
            position: relative;
        }
        
        .input-field {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 24px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .input-field:focus {
            border-color: var(--primary-color);
        }
        
        .send-button {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            transition: all 0.2s;
        }
        
        .typing-avatar {
            background: linear-gradient(135deg, var(--secondary-color) 0%, var(--primary-color) 100%) !important;
        }
        
        .typing-dot {
            background: var(--secondary-color) !important;
        }
        
        /* Appearance Panel Styles */
        #appearance-panel {
            width: 320px;
            height: 600px;
            background: var(--chat-bg);
            border-radius: var(--border-radius);
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
            border: 2px solid rgba(255,255,255,0.1);
            padding: 20px;
            overflow-y: auto;
            display: ${showAppearance ? 'block' : 'none'};
        }
        
        .panel-header {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .panel-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--theme-text);
            margin-bottom: 5px;
        }
        
        .panel-subtitle {
            font-size: 14px;
            color: #6b7280;
        }
        
        .control-group {
            margin-bottom: 20px;
        }
        
        .control-label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: var(--theme-text);
            margin-bottom: 8px;
        }
        
        .color-input {
            width: 100%;
            height: 40px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            cursor: pointer;
            transition: border-color 0.2s;
        }
        
        .color-input:hover {
            border-color: var(--primary-color);
        }
        
        .select-input {
            width: 100%;
            padding: 10px 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            background: white;
            font-size: 14px;
            cursor: pointer;
            transition: border-color 0.2s;
        }
        
        .select-input:focus {
            outline: none;
            border-color: var(--primary-color);
        }
        
        .range-input {
            width: 100%;
            height: 6px;
            border-radius: 3px;
            background: #e2e8f0;
            outline: none;
            cursor: pointer;
        }
        
        .range-input::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: var(--primary-color);
            cursor: pointer;
        }
        
        .range-value {
            display: inline-block;
            margin-left: 10px;
            font-size: 12px;
            color: #6b7280;
        }
        
        .preset-colors {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-top: 8px;
        }
        
        .preset-color {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.2s;
        }
        
        .preset-color:hover {
            transform: scale(1.1);
            border-color: #ffffff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .preset-color.active {
            border-color: #ffffff;
            box-shadow: 0 0 0 2px var(--primary-color);
        }
        
        .code-section {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
        
        .code-textarea {
            width: 100%;
            height: 120px;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 12px;
            resize: vertical;
            background: #f8fafc;
        }
        
        .copy-button {
            width: 100%;
            padding: 10px;
            margin-top: 10px;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .copy-button:hover {
            background: var(--secondary-color);
            transform: translateY(-1px);
        }
        
        .copy-button:active {
            transform: translateY(0);
        }
        
        .send-button:hover {
            box-shadow: 0 6px 12px rgba(0,0,0,0.15);
            transform: scale(1.05);
        }
        
        .send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        .branding {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 12px;
        }
        
        .branding-text {
            font-size: 12px;
            color: #6b7280;
            margin: 0;
        }
        
        @media (max-width: 768px) {
            #chatbot-container {
                width: 100vw;
                height: 100vh;
                border-radius: 0;
                max-width: none;
                max-height: none;
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
    <div id="main-container">
        <!-- Appearance Customization Panel -->
        <div id="appearance-panel">
            <div class="panel-header">
                <h2 class="panel-title">🎨 Appearance</h2>
                <p class="panel-subtitle">Customize your chatbot's look and feel</p>
            </div>
            
            <div class="control-group">
                <label class="control-label">Primary Color</label>
                <input type="color" id="primary-color" class="color-input" value="${appearance.primaryColor}">
                <div class="preset-colors">
                    <div class="preset-color" style="background: #3b82f6" data-color="#3b82f6"></div>
                    <div class="preset-color" style="background: #ef4444" data-color="#ef4444"></div>
                    <div class="preset-color" style="background: #10b981" data-color="#10b981"></div>
                    <div class="preset-color" style="background: #f59e0b" data-color="#f59e0b"></div>
                    <div class="preset-color" style="background: #8b5cf6" data-color="#8b5cf6"></div>
                    <div class="preset-color" style="background: #06b6d4" data-color="#06b6d4"></div>
                    <div class="preset-color" style="background: #84cc16" data-color="#84cc16"></div>
                    <div class="preset-color" style="background: #f97316" data-color="#f97316"></div>
                </div>
            </div>
            
            <div class="control-group">
                <label class="control-label">Theme</label>
                <select id="theme-select" class="select-input">
                    <option value="light" ${appearance.theme === 'light' ? 'selected' : ''}>Light</option>
                    <option value="dark" ${appearance.theme === 'dark' ? 'selected' : ''}>Dark</option>
                </select>
            </div>
            
            <div class="control-group">
                <label class="control-label">Position</label>
                <select id="position-select" class="select-input">
                    <option value="bottom-right" ${appearance.position === 'bottom-right' ? 'selected' : ''}>Bottom Right</option>
                    <option value="bottom-left" ${appearance.position === 'bottom-left' ? 'selected' : ''}>Bottom Left</option>
                </select>
            </div>
            
            <div class="control-group">
                <label class="control-label">Border Radius <span class="range-value" id="radius-value">${appearance.borderRadius}</span></label>
                <input type="range" id="border-radius" class="range-input" min="0" max="24" value="${parseInt(appearance.borderRadius)}" step="2">
            </div>
            
            <div class="code-section">
                <label class="control-label">Embed Code</label>
                <textarea id="embed-code" class="code-textarea" readonly></textarea>
                <button id="copy-code" class="copy-button">📋 Copy Embed Code</button>
            </div>
        </div>
        
        <!-- Chatbot Container -->
        <div id="chatbot-container">
        <div class="chatbot-header">
            <div class="header-content">
                <div class="chatbot-avatar-container">
                    <div class="chatbot-avatar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <circle cx="12" cy="5" r="2"></circle>
                            <path d="M12 7v4"></path>
                        </svg>
                    </div>
                    <div class="status-indicator" id="status-indicator"></div>
                </div>
                <div class="chatbot-info">
                    <h3 class="chatbot-title" id="chatbot-title">AI Assistant</h3>
                    <div class="status-container">
                        <span class="status-badge" id="status-badge">Online</span>
                        <span class="status-text">Ready to help</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="chatbot-messages" id="messages-container">
            <div class="typing-indicator" id="typing-indicator">
                <div class="typing-content">
                    <div class="typing-avatar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <circle cx="12" cy="5" r="2"></circle>
                            <path d="M12 7v4"></path>
                        </svg>
                    </div>
                    <div class="typing-bubble">
                        <div class="typing-dots-container">
                            <div class="typing-dots">
                                <div class="typing-dot"></div>
                                <div class="typing-dot"></div>
                                <div class="typing-dot"></div>
                            </div>
                            <span class="typing-text">AI is thinking...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="chatbot-input">
            <div class="input-container">
                <div class="input-wrapper">
                    <input 
                        id="message-input" 
                        class="input-field"
                        type="text"
                        placeholder="Type your message..."
                    />
                </div>
                <button id="send-button" class="send-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22,2 15,22 11,13 2,9"></polygon>
                    </svg>
                </button>
            </div>
            <div class="branding">
                <p class="branding-text" id="branding-text">AI Assistant • Powered by your system</p>
            </div>
        </div>
    </div>

    <script>
        // Configuration
        const CONFIG = {
            configId: '${configId || 'default'}',
            baseUrl: '${process.env.INNGEST_SERVE_HOST || 'https://harmless-flea-inviting.ngrok-free.app'}',
            sessionId: null
        };

        // State
        let chatbotConfig = null;
        let connectionStatus = 'online';
        let isTyping = false;

        // DOM elements
        const messagesContainer = document.getElementById('messages-container');
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        const typingIndicator = document.getElementById('typing-indicator');
        const chatbotTitle = document.getElementById('chatbot-title');
        const statusBadge = document.getElementById('status-badge');
        const statusIndicator = document.getElementById('status-indicator');
        const brandingText = document.getElementById('branding-text');

        // Initialize chatbot
        async function initializeChatbot() {
            try {
                connectionStatus = 'connecting';
                updateStatusIndicator();

                const response = await fetch(\`\${CONFIG.baseUrl}/api/embed/user-chatbot/\${CONFIG.configId}/config\`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    }
                });

                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }

                const data = await response.json();

                if (data.success && data.data) {
                    chatbotConfig = data.data;
                    
                    // Update UI with config
                    chatbotTitle.textContent = \`\${chatbotConfig.companyName} Assistant\`;
                    brandingText.textContent = \`AI Assistant • Powered by \${chatbotConfig.companyName}\`;
                    
                    // Apply appearance settings if available
                    if (chatbotConfig.appearance) {
                        console.log('Loading appearance settings:', chatbotConfig.appearance);
                        applyAppearanceSettings(chatbotConfig.appearance);
                    }
                    
                    // Add welcome message
                    const welcomeText = \`Hello! 👋 I'm your \${chatbotConfig.companyName} assistant. How can I help you today?\`;
                    addMessage(welcomeText, 'bot');
                } else {
                    throw new Error(data.message || 'Failed to load chatbot configuration');
                }

                connectionStatus = 'online';
                updateStatusIndicator();
            } catch (error) {
                console.error('Failed to initialize user chatbot:', error);
                connectionStatus = 'offline';
                updateStatusIndicator();
                
                // Add fallback welcome message
                const welcomeText = 'Hello! 👋 I\\'m your AI assistant. How can I help you today?';
                addMessage(welcomeText, 'bot');
            }
        }

        // Apply appearance settings to the chatbot - FULLY DYNAMIC
        function applyAppearanceSettings(appearanceData) {
            try {
                const appearance = typeof appearanceData === 'string' 
                    ? JSON.parse(appearanceData) 
                    : appearanceData;
                
                console.log('Applying DYNAMIC appearance settings:', appearance);
                
                // Update CSS variables with ALL dynamic properties
                const root = document.documentElement;
                root.style.setProperty('--primary-color', appearance.primaryColor || '#3b82f6');
                root.style.setProperty('--secondary-color', appearance.secondaryColor || '#7c3aed');
                root.style.setProperty('--border-radius', appearance.borderRadius || '12px');
                root.style.setProperty('--border-width', appearance.borderWidth || '2px');
                root.style.setProperty('--border-style', appearance.borderStyle || 'solid');
                
                // Create DYNAMIC gradient with all properties
                const gradientType = appearance.gradientType || 'linear';
                const gradientDirection = appearance.gradientDirection || '135deg';
                const gradient = \`\${gradientType}-gradient(\${gradientDirection}, \${appearance.primaryColor || '#3b82f6'} 0%, \${appearance.secondaryColor || '#7c3aed'} 100%)\`;
                
                // Update header
                const header = document.querySelector('.chatbot-header');
                if (header) {
                    header.style.background = gradient;
                    header.style.borderRadius = \`\${appearance.borderRadius || '12px'} \${appearance.borderRadius || '12px'} 0 0\`;
                }
                
                // Update chatbot container
                const container = document.getElementById('chatbot-container');
                if (container) {
                    container.style.borderRadius = appearance.borderRadius || '12px';
                }
                
                // Update input area
                const inputArea = document.querySelector('.chatbot-input');
                if (inputArea) {
                    inputArea.style.borderRadius = \`0 0 \${appearance.borderRadius || '12px'} \${appearance.borderRadius || '12px'}\`;
                }
                
                // Update send button
                const sendBtn = document.getElementById('send-button');
                if (sendBtn) {
                    sendBtn.style.background = gradient;
                }
                
                // Update message avatars (for existing messages)
                updateMessageAvatars(appearance);
                
                // Update typing indicator with dynamic colors
                const typingAvatar = document.querySelector('.typing-avatar');
                if (typingAvatar) {
                    typingAvatar.style.background = \`\${gradientType}-gradient(\${gradientDirection}, \${appearance.secondaryColor || '#7c3aed'} 0%, \${appearance.primaryColor || '#3b82f6'} 100%)\`;
                }
                
                const typingDots = document.querySelectorAll('.typing-dot');
                typingDots.forEach(dot => {
                    dot.style.background = appearance.secondaryColor || '#7c3aed';
                });
                
                // Update position if specified
                if (appearance.position) {
                    const isLeft = appearance.position === 'bottom-left';
                    const container = document.getElementById('chatbot-container');
                    if (container) {
                        container.style.right = isLeft ? 'auto' : '20px';
                        container.style.left = isLeft ? '20px' : 'auto';
                    }
                }
                
                console.log('Appearance settings applied successfully');
            } catch (error) {
                console.error('Error applying appearance settings:', error);
            }
        }

        // Update message avatars with appearance colors - FULLY DYNAMIC
        function updateMessageAvatars(appearance) {
            const botAvatars = document.querySelectorAll('.message.bot .message-avatar');
            const userAvatars = document.querySelectorAll('.message.user .message-avatar');
            const userBubbles = document.querySelectorAll('.message.user .message-bubble');
            
            // Create dynamic gradients
            const gradientType = appearance.gradientType || 'linear';
            const gradientDirection = appearance.gradientDirection || '135deg';
            const botGradient = \`\${gradientType}-gradient(\${gradientDirection}, \${appearance.secondaryColor || '#7c3aed'} 0%, \${appearance.primaryColor || '#3b82f6'} 100%)\`;
            const userGradient = \`\${gradientType}-gradient(\${gradientDirection}, \${appearance.primaryColor || '#3b82f6'} 0%, \${appearance.secondaryColor || '#7c3aed'} 100%)\`;
            
            botAvatars.forEach(avatar => {
                avatar.style.background = botGradient;
            });
            
            userAvatars.forEach(avatar => {
                avatar.style.background = userGradient;
            });
            
            userBubbles.forEach(bubble => {
                bubble.style.background = userGradient;
            });
        }

        // Add message to chat (matches widget styling exactly)
        function addMessage(content, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${sender}\`;

            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';

            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            
            // Apply appearance-based styling to avatars
            if (chatbotConfig && chatbotConfig.appearance) {
                const appearance = typeof chatbotConfig.appearance === 'string' 
                    ? JSON.parse(chatbotConfig.appearance) 
                    : chatbotConfig.appearance;
                
                if (sender === 'user') {
                    avatar.style.background = \`linear-gradient(135deg, \${appearance.primaryColor || '#3b82f6'} 0%, #1d4ed8 100%)\`;
                } else {
                    avatar.style.background = \`linear-gradient(135deg, \${appearance.secondaryColor || '#7c3aed'} 0%, \${appearance.primaryColor || '#3b82f6'} 100%)\`;
                }
            }
            
            avatar.innerHTML = sender === 'user' 
                ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
                : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>';

            const messageWrapper = document.createElement('div');
            messageWrapper.className = 'message-wrapper';

            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.textContent = content;
            
            // Apply appearance-based styling to user message bubbles
            if (sender === 'user' && chatbotConfig && chatbotConfig.appearance) {
                const appearance = typeof chatbotConfig.appearance === 'string' 
                    ? JSON.parse(chatbotConfig.appearance) 
                    : chatbotConfig.appearance;
                bubble.style.background = \`linear-gradient(135deg, \${appearance.primaryColor || '#3b82f6'} 0%, #1d4ed8 100%)\`;
            }

            const timestamp = document.createElement('div');
            timestamp.className = 'message-timestamp';
            timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            messageWrapper.appendChild(bubble);
            messageWrapper.appendChild(timestamp);
            messageContent.appendChild(avatar);
            messageContent.appendChild(messageWrapper);
            messageDiv.appendChild(messageContent);

            // Insert before typing indicator
            messagesContainer.insertBefore(messageDiv, typingIndicator);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Send message function
        async function sendMessage(message) {
            if (!message.trim() || isTyping) return;

            addMessage(message, 'user');
            messageInput.value = '';
            isTyping = true;
            showTypingIndicator();

            try {
                connectionStatus = 'connecting';
                updateStatusIndicator();

                const response = await fetch(\`\${CONFIG.baseUrl}/api/embed/user-chatbot\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({
                        message: message,
                        sessionId: CONFIG.sessionId,
                        configId: CONFIG.configId
                    })
                });

                const data = await response.json();

                if (data.success) {
                    if (!CONFIG.sessionId) {
                        CONFIG.sessionId = data.data.sessionId;
                    }
                    
                    connectionStatus = 'online';
                    updateStatusIndicator();
                    addMessage(data.data.response, 'bot');
                } else {
                    // Handle specific error types with user-friendly messages
                    if (data.message.includes('not found') || data.message.includes('disabled')) {
                        addMessage('🚫 This chatbot is currently unavailable. Please try again later or contact support.', 'bot');
                    } else if (data.message.includes('rate limit')) {
                        addMessage('⏱️ I\\'m receiving a lot of questions right now. Please wait a moment and try again.', 'bot');
                    } else {
                        addMessage('😔 I apologize, but I encountered an issue processing your request. Could you please try rephrasing your question?', 'bot');
                    }
                }
            } catch (error) {
                console.error('Error sending message:', error);
                connectionStatus = 'offline';
                updateStatusIndicator();
                
                // Provide more specific error messages based on error type
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    addMessage('🌐 I\\'m having trouble connecting to our servers. Please check your internet connection and try again.', 'bot');
                } else if (error.message.includes('timeout')) {
                    addMessage('⏱️ The request is taking longer than expected. Please try again with a shorter message.', 'bot');
                } else {
                    addMessage('🔧 I\\'m experiencing some technical difficulties. Please try again in a moment, and if the problem persists, feel free to contact our support team.', 'bot');
                }
            } finally {
                isTyping = false;
                hideTypingIndicator();
            }
        }

        // Show/hide typing indicator
        function showTypingIndicator() {
            typingIndicator.style.display = 'flex';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function hideTypingIndicator() {
            typingIndicator.style.display = 'none';
        }

        // Update status indicator
        function updateStatusIndicator() {
            switch (connectionStatus) {
                case 'online':
                    statusIndicator.style.background = '#10b981';
                    statusBadge.textContent = 'Online';
                    break;
                case 'connecting':
                    statusIndicator.style.background = '#f59e0b';
                    statusBadge.textContent = 'Connecting...';
                    break;
                case 'offline':
                    statusIndicator.style.background = '#ef4444';
                    statusBadge.textContent = 'Offline';
                    break;
            }
        }

        // Event listeners
        sendButton.addEventListener('click', () => {
            sendMessage(messageInput.value);
        });

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage(messageInput.value);
            }
        });

        messageInput.addEventListener('focus', () => {
            messageInput.style.borderColor = '#3b82f6';
        });

        messageInput.addEventListener('blur', () => {
            messageInput.style.borderColor = '#e2e8f0';
        });

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