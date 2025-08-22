const express = require("express");
const { prisma } = require("../../config/database");

const router = express.Router();

// GET /embed/chatbot-appearance - Modern appearance customizer
router.get("/chatbot-appearance", (req, res) => {
  const { configId } = req.query;

  const appearanceHTML = `
<!DOCTYPE html> 
<html lang="en">
<head> 
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chatbot Appearance Customizer</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            display: grid;
            grid-template-columns: 320px 1fr;
            gap: 20px;
            max-width: 1100px;
            width: 100%;
            height: 650px;
        }
        
        /* Customization Panel */
        .customization-panel {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            overflow-y: auto;
        }
        
        .panel-header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .panel-title {
            font-size: 18px;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 4px;
        }
        
        .panel-subtitle {
            color: #718096;
            font-size: 12px;
        }
        
        .section {
            margin-bottom: 20px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .section-icon {
            width: 16px;
            height: 16px;
            color: #667eea;
        }
        
        /* Individual Color Controls */
        .color-controls {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 12px;
        }
        
        .color-input-group {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            background: #f8fafc;
            transition: all 0.2s;
        }
        
        .color-input-group:hover {
            border-color: #667eea;
            background: #f1f5f9;
        }
        
        .color-input {
            width: 28px;
            height: 28px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .color-input:hover {
            transform: scale(1.05);
        }
        
        .color-display {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .color-name {
            font-size: 12px;
            font-weight: 500;
            color: #2d3748;
        }
        
        .color-value {
            font-size: 10px;
            color: #718096;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        
        /* Preset Color Grid */
        .color-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-top: 8px;
            padding: 12px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .color-option {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
        }
        
        .color-option:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .color-option.active {
            border-color: white;
            box-shadow: 0 0 0 2px #667eea;
            transform: scale(1.05);
        }
        
        .color-option.active::after {
            content: '✓';
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        
        /* Position Selection */
        .position-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }
        
        .position-option {
            padding: 12px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: center;
            background: #f8fafc;
        }
        
        .position-option:hover {
            border-color: #667eea;
            background: #f1f5f9;
        }
        
        .position-option.active {
            border-color: #667eea;
            background: #667eea;
            color: white;
        }
        
        .position-icon {
            width: 18px;
            height: 18px;
            margin: 0 auto 6px;
        }
        
        .position-text {
            font-size: 10px;
            font-weight: 500;
        }
        
        /* Border Radius */
        .radius-control {
            background: #f8fafc;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        
        .radius-slider {
            width: 100%;
            height: 4px;
            border-radius: 2px;
            background: #e2e8f0;
            outline: none;
            cursor: pointer;
            -webkit-appearance: none;
        }
        
        .radius-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #667eea;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        
        .radius-value {
            text-align: center;
            margin-top: 8px;
            font-weight: 600;
            color: #667eea;
            font-size: 12px;
        }
        
        /* Save Button */
        .save-button {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-top: 16px;
        }
        
        .save-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .save-button:active {
            transform: translateY(0);
        }
        
        /* Preview Area */
        .preview-area {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            position: relative;
            overflow: hidden;
        }
        
        .preview-header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .preview-title {
            font-size: 16px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 4px;
        }
        
        .preview-subtitle {
            color: #718096;
            font-size: 12px;
        }
        
        /* Chatbot Preview */
        .chatbot-preview {
            width: 340px;
            height: 450px;
            margin: 0 auto;
            background: white;
            border-radius: var(--border-radius, 12px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border: 1px solid #e2e8f0;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .chatbot-header {
            background: linear-gradient(135deg, var(--primary-color, #3b82f6) 0%, var(--secondary-color, #7c3aed) 100%);
            color: white;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
            border-radius: var(--border-radius, 12px) var(--border-radius, 12px) 0 0;
        }
        
        .bot-avatar {
            width: 32px;
            height: 32px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }
        
        .bot-info h3 {
            font-size: 14px;
            margin-bottom: 2px;
        }
        
        .bot-info p {
            font-size: 11px;
            opacity: 0.8;
        }
        
        .chatbot-messages {
            flex: 1;
            padding: 16px;
            background: linear-gradient(to bottom, #f8fafc, white);
            overflow-y: auto;
        }
        
        .message {
            margin-bottom: 12px;
            display: flex;
            align-items: flex-start;
            gap: 8px;
        }
        
        .message.user {
            flex-direction: row-reverse;
        }
        
        .message-avatar {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .message.bot .message-avatar {
            background: linear-gradient(135deg, var(--secondary-color, #7c3aed) 0%, var(--primary-color, #3b82f6) 100%);
            color: white;
        }
        
        .message.user .message-avatar {
            background: linear-gradient(135deg, var(--primary-color, #3b82f6) 0%, #1d4ed8 100%);
            color: white;
        }
        
        .message-bubble {
            max-width: 220px;
            padding: 10px 12px;
            border-radius: 14px;
            font-size: 12px;
            line-height: 1.4;
        }
        
        .message.bot .message-bubble {
            background: white;
            border: 1px solid #e2e8f0;
            color: #374151;
        }
        
        .message.user .message-bubble {
            background: linear-gradient(135deg, var(--primary-color, #3b82f6) 0%, #1d4ed8 100%);
            color: white;
        }
        
        .chatbot-input {
            padding: 16px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            gap: 8px;
            align-items: center;
        }
        
        .input-field {
            flex: 1;
            padding: 10px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            outline: none;
            font-size: 12px;
        }
        
        .send-btn {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, var(--primary-color, #3b82f6) 0%, var(--secondary-color, #7c3aed) 100%);
            border: none;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        /* Position Preview Overlay */
        .position-preview {
            position: absolute;
            bottom: 16px;
            right: 16px;
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, var(--primary-color, #3b82f6) 0%, var(--secondary-color, #7c3aed) 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        .position-preview:hover {
            transform: scale(1.05);
        }
        
        .position-preview.left {
            right: auto;
            left: 16px;
        }
        
        @media (max-width: 768px) {
            .container {
                grid-template-columns: 1fr;
                height: auto;
                gap: 16px;
            }
            
            .chatbot-preview {
                width: 100%;
                max-width: 340px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Customization Panel -->
        <div class="customization-panel">
            <div class="panel-header">
                <h1 class="panel-title">🎨 Customize</h1>
                <p class="panel-subtitle">Design your perfect chatbot</p>
            </div>
            
            <!-- Color Selection -->
            <div class="section">
                <h2 class="section-title">
                    <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                    </svg>
                    Colors
                </h2>
                
                <!-- Individual Color Controls -->
                <div class="color-controls">
                    <div class="color-input-group">
                        <input type="color" id="primaryColor" class="color-input" value="#3b82f6">
                        <div class="color-display">
                            <div class="color-name">Primary Color</div>
                            <div class="color-value" id="primaryValue">#3b82f6</div>
                        </div>
                    </div>
                    <div class="color-input-group">
                        <input type="color" id="secondaryColor" class="color-input" value="#7c3aed">
                        <div class="color-display">
                            <div class="color-name">Secondary Color</div>
                            <div class="color-value" id="secondaryValue">#7c3aed</div>
                        </div>
                    </div>
                </div>
                
                <!-- Preset Color Combinations -->
                <div class="color-grid">
                    <div class="color-option active" style="background: linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)" data-primary="#3b82f6" data-secondary="#7c3aed"></div>
                    <div class="color-option" style="background: linear-gradient(135deg, #ef4444 0%, #f97316 100%)" data-primary="#ef4444" data-secondary="#f97316"></div>
                    <div class="color-option" style="background: linear-gradient(135deg, #10b981 0%, #84cc16 100%)" data-primary="#10b981" data-secondary="#84cc16"></div>
                    <div class="color-option" style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)" data-primary="#f59e0b" data-secondary="#ef4444"></div>
                    <div class="color-option" style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)" data-primary="#8b5cf6" data-secondary="#ec4899"></div>
                    <div class="color-option" style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)" data-primary="#06b6d4" data-secondary="#3b82f6"></div>
                    <div class="color-option" style="background: linear-gradient(135deg, #84cc16 0%, #10b981 100%)" data-primary="#84cc16" data-secondary="#10b981"></div>
                    <div class="color-option" style="background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%)" data-primary="#f97316" data-secondary="#f59e0b"></div>
                </div>
            </div>
            
            <!-- Position Selection -->
            <div class="section">
                <h2 class="section-title">
                    <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="9" cy="9" r="2"/>
                    </svg>
                    Position
                </h2>
                <div class="position-grid">
                    <div class="position-option active" data-position="bottom-right">
                        <svg class="position-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M7 17L17 7"/>
                            <path d="M17 17H7V7"/>
                        </svg>
                        <div class="position-text">Bottom Right</div>
                    </div>
                    <div class="position-option" data-position="bottom-left">
                        <svg class="position-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 17L7 7"/>
                            <path d="M7 17H17V7"/>
                        </svg>
                        <div class="position-text">Bottom Left</div>
                    </div>
                </div>
            </div>
            
            <!-- Border Radius -->
            <div class="section">
                <h2 class="section-title">
                    <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    </svg>
                    Roundness
                </h2>
                <div class="radius-control">
                    <input type="range" class="radius-slider" id="borderRadius" min="0" max="24" value="12" step="2">
                    <div class="radius-value" id="radiusValue">12px</div>
                </div>
            </div>
            
            <!-- Save Button -->
            <button class="save-button" id="saveButton">
                💾 Save Changes
            </button>
        </div>
        
        <!-- Preview Area -->
        <div class="preview-area">
            <div class="preview-header">
                <h2 class="preview-title">Live Preview</h2>
                <p class="preview-subtitle">See how your chatbot will look</p>
            </div>
            
            <div class="chatbot-preview" id="chatbotPreview">
                <div class="chatbot-header" id="chatbotHeader">
                    <div class="bot-avatar">🤖</div>
                    <div class="bot-info">
                        <h3 id="botTitle">AI Assistant</h3>
                        <p>Online • Ready to help</p>
                    </div>
                </div>
                
                <div class="chatbot-messages">
                    <div class="message bot">
                        <div class="message-avatar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <circle cx="12" cy="5" r="2"></circle>
                                <path d="M12 7v4"></path>
                            </svg>
                        </div>
                        <div class="message-bubble">
                            Hello! 👋 I'm your AI assistant. How can I help you today?
                        </div>
                    </div>
                    
                    <div class="message user">
                        <div class="message-avatar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <div class="message-bubble">
                            Hi! Can you help me with my account?
                        </div>
                    </div>
                    
                    <div class="message bot">
                        <div class="message-avatar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <circle cx="12" cy="5" r="2"></circle>
                                <path d="M12 7v4"></path>
                            </svg>
                        </div>
                        <div class="message-bubble">
                            Of course! I'd be happy to help you with your account. What specific issue are you experiencing?
                        </div>
                    </div>
                </div>
                
                <div class="chatbot-input">
                    <input type="text" class="input-field" placeholder="Type your message..." disabled>
                    <button class="send-btn" disabled>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22,2 15,22 11,13 2,9"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- Position Preview -->
            <div class="position-preview" id="positionPreview">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </div>
        </div>
    </div>

    <script>
        // Configuration
        const CONFIG = {
            configId: '${configId || "default"}',
            baseUrl: '${
              process.env.BACKEND_URL ||
              process.env.INNGEST_SERVE_HOST ||
              "https://saaschatbotbackend.onrender.com"
            }'
        };

        // Current settings - FULLY DYNAMIC
        let currentSettings = {
            primaryColor: '#3b82f6',
            secondaryColor: '#7c3aed',
            position: 'bottom-right',
            borderRadius: 12,
            borderWidth: '2px',
            borderStyle: 'solid',
            gradientType: 'linear',
            gradientDirection: '135deg'
        };

        // DOM elements
        const colorOptions = document.querySelectorAll('.color-option');
        const positionOptions = document.querySelectorAll('.position-option');
        const borderRadiusSlider = document.getElementById('borderRadius');
        const radiusValue = document.getElementById('radiusValue');
        const saveButton = document.getElementById('saveButton');
        const chatbotHeader = document.getElementById('chatbotHeader');
        const chatbotPreview = document.getElementById('chatbotPreview');
        const positionPreview = document.getElementById('positionPreview');
        const botTitle = document.getElementById('botTitle');
        
        // Individual color inputs
        const primaryColorInput = document.getElementById('primaryColor');
        const secondaryColorInput = document.getElementById('secondaryColor');
        const primaryValueDisplay = document.getElementById('primaryValue');
        const secondaryValueDisplay = document.getElementById('secondaryValue');

        // Initialize chatbot config
        async function initializeChatbot() {
            try {
                const response = await fetch(\`\${CONFIG.baseUrl}/api/embed/user-chatbot/\${CONFIG.configId}/config\`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        const config = data.data;
                        botTitle.textContent = \`\${config.companyName} Assistant\`;
                        
                        // Load saved appearance settings - FULLY DYNAMIC
                        if (config.appearance) {
                            const appearance = typeof config.appearance === 'string' 
                                ? JSON.parse(config.appearance) 
                                : config.appearance;
                            
                            currentSettings = {
                                primaryColor: appearance.primaryColor || '#3b82f6',
                                secondaryColor: appearance.secondaryColor || '#7c3aed',
                                position: appearance.position || 'bottom-right',
                                borderRadius: parseInt(appearance.borderRadius) || 12,
                                borderWidth: appearance.borderWidth || '2px',
                                borderStyle: appearance.borderStyle || 'solid',
                                gradientType: appearance.gradientType || 'linear',
                                gradientDirection: appearance.gradientDirection || '135deg'
                            };
                            
                            updateUI();
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load chatbot config:', error);
            }
        }

        // Update UI with current settings
        function updateUI() {
            // Update individual color inputs
            primaryColorInput.value = currentSettings.primaryColor;
            secondaryColorInput.value = currentSettings.secondaryColor;
            primaryValueDisplay.textContent = currentSettings.primaryColor;
            secondaryValueDisplay.textContent = currentSettings.secondaryColor;

            // Update color selection
            updateActivePresetColor();

            // Update position selection
            positionOptions.forEach(option => {
                option.classList.remove('active');
                if (option.dataset.position === currentSettings.position) {
                    option.classList.add('active');
                }
            });

            // Update border radius
            borderRadiusSlider.value = currentSettings.borderRadius;
            radiusValue.textContent = currentSettings.borderRadius + 'px';

            // Update preview
            updatePreview();
        }

        // Update active preset color based on current settings
        function updateActivePresetColor() {
            colorOptions.forEach(option => {
                option.classList.remove('active');
                if (option.dataset.primary === currentSettings.primaryColor && 
                    option.dataset.secondary === currentSettings.secondaryColor) {
                    option.classList.add('active');
                }
            });
        }

        // Update preview with current settings - FULLY DYNAMIC
        function updatePreview() {
            const gradient = \`\${currentSettings.gradientType}-gradient(\${currentSettings.gradientDirection}, \${currentSettings.primaryColor} 0%, \${currentSettings.secondaryColor} 100%)\`;
            
            console.log('Updating DYNAMIC preview with settings:', currentSettings);
            
            // Update CSS variables for FULL dynamic styling
            const root = document.documentElement;
            root.style.setProperty('--primary-color', currentSettings.primaryColor);
            root.style.setProperty('--secondary-color', currentSettings.secondaryColor);
            root.style.setProperty('--border-radius', currentSettings.borderRadius + 'px');
            root.style.setProperty('--border-width', currentSettings.borderWidth);
            root.style.setProperty('--border-style', currentSettings.borderStyle);
            
            // Update header gradient
            if (chatbotHeader) {
                chatbotHeader.style.background = gradient;
            }
            
            // Update message avatars and send button
            const botAvatars = document.querySelectorAll('.message.bot .message-avatar');
            const userAvatars = document.querySelectorAll('.message.user .message-avatar');
            const userBubbles = document.querySelectorAll('.message.user .message-bubble');
            const sendBtn = document.querySelector('.send-btn');
            
            botAvatars.forEach(avatar => {
                avatar.style.background = \`\${currentSettings.gradientType}-gradient(\${currentSettings.gradientDirection}, \${currentSettings.secondaryColor} 0%, \${currentSettings.primaryColor} 100%)\`;
            });
            
            userAvatars.forEach(avatar => {
                avatar.style.background = gradient;
            });
            
            userBubbles.forEach(bubble => {
                bubble.style.background = gradient;
            });
            
            if (sendBtn) {
                sendBtn.style.background = gradient;
            }
            
            // Update border radius for chatbot preview
            if (chatbotPreview) {
                chatbotPreview.style.borderRadius = currentSettings.borderRadius + 'px';
                // Also update header border radius
                const header = chatbotPreview.querySelector('.chatbot-header');
                if (header) {
                    header.style.borderRadius = \`\${currentSettings.borderRadius}px \${currentSettings.borderRadius}px 0 0\`;
                }
                // Update input area border radius
                const inputArea = chatbotPreview.querySelector('.chatbot-input');
                if (inputArea) {
                    inputArea.style.borderRadius = \`0 0 \${currentSettings.borderRadius}px \${currentSettings.borderRadius}px\`;
                }
            }
            
            // Update position preview (floating chat icon) - Apply border radius correctly
            if (positionPreview) {
                positionPreview.style.background = gradient;
                // Apply the border radius from the slider to the floating chat icon with !important to override CSS
                
                if (currentSettings.position === 'bottom-left') {
                    positionPreview.classList.add('left');
                } else {
                    positionPreview.classList.remove('left');
                }
            }
            
            console.log('Preview updated successfully');
        }

        // Individual color input listeners
        primaryColorInput.addEventListener('input', (e) => {
            currentSettings.primaryColor = e.target.value;
            primaryValueDisplay.textContent = e.target.value;
            updateActivePresetColor();
            updatePreview();
        });

        secondaryColorInput.addEventListener('input', (e) => {
            currentSettings.secondaryColor = e.target.value;
            secondaryValueDisplay.textContent = e.target.value;
            updateActivePresetColor();
            updatePreview();
        });

        // Preset color selection
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                colorOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                currentSettings.primaryColor = option.dataset.primary;
                currentSettings.secondaryColor = option.dataset.secondary;
                
                // Update individual color inputs
                primaryColorInput.value = currentSettings.primaryColor;
                secondaryColorInput.value = currentSettings.secondaryColor;
                primaryValueDisplay.textContent = currentSettings.primaryColor;
                secondaryValueDisplay.textContent = currentSettings.secondaryColor;
                
                updatePreview();
            });
        });

        // Position selection
        positionOptions.forEach(option => {
            option.addEventListener('click', () => {
                positionOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                currentSettings.position = option.dataset.position;
                updatePreview();
            });
        });

        // Border radius - Updates floating chat icon border radius
        borderRadiusSlider.addEventListener('input', (e) => {
            currentSettings.borderRadius = parseInt(e.target.value);
            radiusValue.textContent = currentSettings.borderRadius + 'px';
            updatePreview(); // This will update the floating chat icon border radius
        });

        // Save settings
        saveButton.addEventListener('click', async () => {
            try {
                saveButton.textContent = '💾 Saving...';
                saveButton.disabled = true;

                const response = await fetch(\`\${CONFIG.baseUrl}/embed/chatbot-appearance/save\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({
                        configId: CONFIG.configId,
                        appearance: {
                            primaryColor: currentSettings.primaryColor,
                            secondaryColor: currentSettings.secondaryColor,
                            position: currentSettings.position,
                            borderRadius: currentSettings.borderRadius + 'px',
                            borderWidth: currentSettings.borderWidth,
                            borderStyle: currentSettings.borderStyle,
                            gradientType: currentSettings.gradientType,
                            gradientDirection: currentSettings.gradientDirection
                        }
                    })
                });

                if (response.ok) {
                    saveButton.textContent = '✅ Saved!';
                    saveButton.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    
                    setTimeout(() => {
                        saveButton.textContent = '💾 Save Changes';
                        saveButton.style.background = '';
                        saveButton.disabled = false;
                    }, 2000);
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || \`HTTP \${response.status}: \${response.statusText}\`);
                }
            } catch (error) {
                console.error('Error saving appearance:', error);
                saveButton.textContent = '❌ Save Failed';
                saveButton.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                
                // Show more specific error message
                if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                    alert('Authentication required. Please log in to save appearance settings.');
                } else {
                    alert('Failed to save appearance settings: ' + error.message);
                }
                
                setTimeout(() => {
                    saveButton.textContent = '💾 Save Changes';
                    saveButton.style.background = '';
                    saveButton.disabled = false;
                }, 3000);
            }
        });

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            initializeChatbot();
            updatePreview();
        });
    </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.send(appearanceHTML);
});

// POST /embed/chatbot-appearance/save - Save appearance settings (public endpoint)
router.post("/chatbot-appearance/save", async (req, res) => {
  try {
    const { configId, appearance } = req.body;

    if (!configId || !appearance) {
      return res.status(400).json({
        success: false,
        message: "Config ID and appearance data are required",
      });
    }

    // Validate appearance data structure
    const validatedAppearance = {
      primaryColor: appearance.primaryColor || "#3b82f6",
      secondaryColor: appearance.secondaryColor || "#7c3aed",
      position: appearance.position || "bottom-right",
      borderRadius: appearance.borderRadius || "12px",
      borderWidth: appearance.borderWidth || "2px",
      borderStyle: appearance.borderStyle || "solid",
      gradientType: appearance.gradientType || "linear",
      gradientDirection: appearance.gradientDirection || "135deg",
    };

    // Check if chatbot exists
    const existingChatbot = await prisma.userChatBot.findUnique({
      where: { id: configId },
    });

    if (!existingChatbot) {
      return res.status(404).json({
        success: false,
        message: "Chatbot not found",
      });
    }

    // Update appearance settings
    const updatedChatbot = await prisma.userChatBot.update({
      where: { id: configId },
      data: {
        appearance: validatedAppearance,
      },
      select: {
        id: true,
        companyName: true,
        appearance: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedChatbot,
      message: "Appearance settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating appearance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update appearance settings",
      error: error.message,
    });
  }
});

module.exports = router;
