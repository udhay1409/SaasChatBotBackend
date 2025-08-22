const express = require('express');
const { getUserChatBotEmbedConfig } = require('../../controllers/embed/userChatBotEmbedControllers');

const router = express.Router();

// GET /embed/user-chatbot-preview - Serve chatbot preview with appearance customization
router.get('/user-chatbot-preview', (req, res) => {
  const { configId, primaryColor, position, borderRadius, theme } = req.query;
  
  // Default appearance settings - FULLY DYNAMIC
  const appearance = {
    primaryColor: primaryColor || '#3b82f6',
    secondaryColor: req.query.secondaryColor || '#7c3aed',
    position: position || 'bottom-right',
    borderRadius: borderRadius || '12px',
    borderWidth: req.query.borderWidth || '2px',
    borderStyle: req.query.borderStyle || 'solid',
    theme: theme || 'light',
    gradientType: req.query.gradientType || 'linear',
    gradientDirection: req.query.gradientDirection || '135deg'
  };
  
  const previewHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chatbot Preview - Appearance Customizer</title>
    <style>
        :root {
            --primary-color: ${appearance.primaryColor};
            --secondary-color: ${appearance.secondaryColor};
            --border-radius: ${appearance.borderRadius};
            --theme-bg: ${appearance.theme === 'dark' ? '#1f2937' : '#f8fafc'};
            --theme-text: ${appearance.theme === 'dark' ? '#ffffff' : '#000000'};
            --chat-bg: ${appearance.theme === 'dark' ? 'rgba(31,41,55,0.95)' : 'rgba(255,255,255,0.95)'};
            --panel-bg: ${appearance.theme === 'dark' ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.95)'};
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
        
        /* Modern Appearance Panel Styles */
        #appearance-panel {
            width: 380px;
            height: 600px;
            background: var(--panel-bg);
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
            border: 1px solid ${appearance.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
            padding: 0;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .panel-header {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            color: white;
            padding: 24px;
            margin: 0;
            border: none;
        }
        
        .panel-title {
            font-size: 20px;
            font-weight: 700;
            color: white;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .panel-subtitle {
            font-size: 14px;
            color: rgba(255,255,255,0.8);
            margin: 0;
        }
        
        .panel-content {
            flex: 1;
            padding: 24px;
            overflow-y: auto;
        }
        
        .control-group {
            margin-bottom: 24px;
        }
        
        .control-label {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 600;
            color: var(--theme-text);
            margin-bottom: 12px;
        }
        
        .control-icon {
            width: 16px;
            height: 16px;
            margin-right: 8px;
            opacity: 0.7;
        }
        
        .color-input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border: 2px solid ${appearance.theme === 'dark' ? '#374151' : '#e5e7eb'};
            border-radius: 12px;
            background: ${appearance.theme === 'dark' ? '#1f2937' : '#ffffff'};
            transition: all 0.2s;
        }
        
        .color-input-wrapper:hover {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .color-input {
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 8px;
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
            font-size: 14px;
            font-weight: 500;
            color: var(--theme-text);
        }
        
        .color-value {
            font-size: 12px;
            color: #6b7280;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        
        .select-input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid ${appearance.theme === 'dark' ? '#374151' : '#e5e7eb'};
            border-radius: 12px;
            background: ${appearance.theme === 'dark' ? '#1f2937' : '#ffffff'};
            color: var(--theme-text);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            appearance: none;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 12px center;
            background-repeat: no-repeat;
            background-size: 16px;
            padding-right: 40px;
        }
        
        .select-input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .range-container {
            padding: 16px;
            border: 2px solid ${appearance.theme === 'dark' ? '#374151' : '#e5e7eb'};
            border-radius: 12px;
            background: ${appearance.theme === 'dark' ? '#1f2937' : '#ffffff'};
        }
        
        .range-input {
            width: 100%;
            height: 8px;
            border-radius: 4px;
            background: ${appearance.theme === 'dark' ? '#374151' : '#e5e7eb'};
            outline: none;
            cursor: pointer;
            -webkit-appearance: none;
            margin: 8px 0;
        }
        
        .range-input::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: var(--primary-color);
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: transform 0.2s;
        }
        
        .range-input::-webkit-slider-thumb:hover {
            transform: scale(1.1);
        }
        
        .range-labels {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
        }
        
        .range-value {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            font-weight: 600;
            color: var(--primary-color);
            background: rgba(59, 130, 246, 0.1);
            padding: 4px 8px;
            border-radius: 6px;
        }
        
        .gradient-controls {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 16px;
        }
        
        .preset-gradients {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-top: 16px;
            padding: 16px;
            background: ${appearance.theme === 'dark' ? '#1f2937' : '#f9fafb'};
            border-radius: 12px;
            border: 1px solid ${appearance.theme === 'dark' ? '#374151' : '#e5e7eb'};
        }
        
        .preset-gradient {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            cursor: pointer;
            border: 3px solid transparent;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        
        .preset-gradient:hover {
            transform: scale(1.1);
            border-color: rgba(255,255,255,0.3);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .preset-gradient.active {
            border-color: white;
            box-shadow: 0 0 0 2px var(--primary-color), 0 8px 25px rgba(0,0,0,0.15);
            transform: scale(1.05);
        }
        
        .preset-gradient.active::after {
            content: '✓';
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        
        .preset-colors {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-top: 16px;
            padding: 16px;
            background: ${appearance.theme === 'dark' ? '#1f2937' : '#f9fafb'};
            border-radius: 12px;
            border: 1px solid ${appearance.theme === 'dark' ? '#374151' : '#e5e7eb'};
        }
        
        .preset-color {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            cursor: pointer;
            border: 3px solid transparent;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        
        .preset-color::before {
            content: '';
            position: absolute;
            inset: 0;
            background: inherit;
            border-radius: inherit;
            transition: transform 0.3s;
        }
        
        .preset-color:hover {
            transform: scale(1.1);
            border-color: rgba(255,255,255,0.3);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .preset-color:hover::before {
            transform: scale(1.1);
        }
        
        .preset-color.active {
            border-color: white;
            box-shadow: 0 0 0 2px var(--primary-color), 0 8px 25px rgba(0,0,0,0.15);
            transform: scale(1.05);
        }
        
        .preset-color.active::after {
            content: '✓';
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        
        .code-section {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid ${appearance.theme === 'dark' ? '#374151' : '#e5e7eb'};
        }
        
        .code-container {
            position: relative;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid ${appearance.theme === 'dark' ? '#374151' : '#e5e7eb'};
        }
        
        .code-header {
            background: ${appearance.theme === 'dark' ? '#1f2937' : '#f9fafb'};
            padding: 12px 16px;
            border-bottom: 1px solid ${appearance.theme === 'dark' ? '#374151' : '#e5e7eb'};
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .code-title {
            font-size: 12px;
            font-weight: 600;
            color: var(--theme-text);
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .code-textarea {
            width: 100%;
            height: 140px;
            padding: 16px;
            border: none;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            font-size: 11px;
            line-height: 1.5;
            resize: none;
            background: ${appearance.theme === 'dark' ? '#0f172a' : '#ffffff'};
            color: var(--theme-text);
            outline: none;
        }
        
        .copy-button {
            width: 100%;
            padding: 14px;
            margin-top: 12px;
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .copy-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }
        
        .copy-button:active {
            transform: translateY(0);
        }
        
        .copy-button.copied {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        /* Theme Toggle */
        .theme-toggle {
            display: flex;
            background: ${appearance.theme === 'dark' ? '#374151' : '#f3f4f6'};
            border-radius: 10px;
            padding: 4px;
            position: relative;
        }
        
        .theme-option {
            flex: 1;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            color: #6b7280;
        }
        
        .theme-option.active {
            background: white;
            color: var(--theme-text);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* Position Toggle */
        .position-toggle {
            display: flex;
            background: ${appearance.theme === 'dark' ? '#374151' : '#f3f4f6'};
            border-radius: 10px;
            padding: 4px;
        }
        
        .position-option {
            flex: 1;
            padding: 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            color: #6b7280;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        
        .position-option.active {
            background: white;
            color: var(--theme-text);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* Chatbot Styles */
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
            background: ${appearance.theme === 'dark' ? 'linear-gradient(to bottom, rgba(31,41,55,0.5), rgba(17,24,39,0.8))' : 'linear-gradient(to bottom, rgba(248,250,252,0.5), white)'};
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
        }
        
        .message.user .message-avatar {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            color: white;
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
            background: ${appearance.theme === 'dark' ? 'rgba(55,65,81,0.8)' : 'white'};
            color: ${appearance.theme === 'dark' ? '#f3f4f6' : '#334155'};
            border: 1px solid ${appearance.theme === 'dark' ? '#4b5563' : '#e2e8f0'};
        }
        
        .message.user .message-bubble {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
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
        
        .chatbot-input {
            padding: 16px;
            border-top: 1px solid ${appearance.theme === 'dark' ? '#374151' : '#e2e8f0'};
            background: ${appearance.theme === 'dark' ? 'rgba(31,41,55,0.8)' : 'rgba(255,255,255,0.8)'};
            backdrop-filter: blur(4px);
            border-radius: 0 0 var(--border-radius) var(--border-radius);
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
            border: 2px solid ${appearance.theme === 'dark' ? '#374151' : '#e2e8f0'};
            border-radius: 24px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
            background: ${appearance.theme === 'dark' ? '#374151' : 'white'};
            color: var(--theme-text);
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
        
        .send-button:hover {
            box-shadow: 0 6px 12px rgba(0,0,0,0.15);
            transform: scale(1.05);
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
            #main-container {
                flex-direction: column;
                gap: 10px;
            }
            
            #appearance-panel {
                width: 100%;
                height: 300px;
                order: 2;
            }
            
            #chatbot-container {
                width: 100%;
                height: 400px;
                order: 1;
            }
        }
    </style>
</head>
<body>
    <div id="main-container">
        <!-- Modern Appearance Customization Panel -->
        <div id="appearance-panel">
            <div class="panel-header">
                <h2 class="panel-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="13.5" cy="6.5" r=".5"/>
                        <circle cx="17.5" cy="10.5" r=".5"/>
                        <circle cx="8.5" cy="7.5" r=".5"/>
                        <circle cx="6.5" cy="12.5" r=".5"/>
                        <circle cx="12" cy="2" r="10"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Appearance
                </h2>
                <p class="panel-subtitle">Customize your chatbot's design</p>
            </div>
            
            <div class="panel-content">
                <!-- Gradient Color Customization -->
                <div class="control-group">
                    <label class="control-label">
                        <span>
                            <svg class="control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                            </svg>
                            Gradient Colors
                        </span>
                    </label>
                    <div class="gradient-controls">
                        <div class="color-input-wrapper">
                            <input type="color" id="primary-color" class="color-input" value="${appearance.primaryColor}">
                            <div class="color-display">
                                <div class="color-name">Primary</div>
                                <div class="color-value" id="primary-value">${appearance.primaryColor}</div>
                            </div>
                        </div>
                        <div class="color-input-wrapper">
                            <input type="color" id="secondary-color" class="color-input" value="${appearance.secondaryColor}">
                            <div class="color-display">
                                <div class="color-name">Secondary</div>
                                <div class="color-value" id="secondary-value">${appearance.secondaryColor}</div>
                            </div>
                        </div>
                    </div>
                    <div class="preset-gradients">
                        <div class="preset-gradient" style="background: linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)" data-primary="#3b82f6" data-secondary="#7c3aed" title="Blue Purple"></div>
                        <div class="preset-gradient" style="background: linear-gradient(135deg, #ef4444 0%, #f97316 100%)" data-primary="#ef4444" data-secondary="#f97316" title="Red Orange"></div>
                        <div class="preset-gradient" style="background: linear-gradient(135deg, #10b981 0%, #84cc16 100%)" data-primary="#10b981" data-secondary="#84cc16" title="Green Lime"></div>
                        <div class="preset-gradient" style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)" data-primary="#f59e0b" data-secondary="#ef4444" title="Yellow Red"></div>
                        <div class="preset-gradient" style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)" data-primary="#8b5cf6" data-secondary="#ec4899" title="Purple Pink"></div>
                        <div class="preset-gradient" style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)" data-primary="#06b6d4" data-secondary="#3b82f6" title="Cyan Blue"></div>
                        <div class="preset-gradient" style="background: linear-gradient(135deg, #84cc16 0%, #10b981 100%)" data-primary="#84cc16" data-secondary="#10b981" title="Lime Green"></div>
                        <div class="preset-gradient" style="background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%)" data-primary="#f97316" data-secondary="#f59e0b" title="Orange Yellow"></div>
                    </div>
                </div>



                <!-- Position Selection -->
                <div class="control-group">
                    <label class="control-label">
                        <span>
                            <svg class="control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="9" cy="9" r="2"/>
                                <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                            </svg>
                            Position
                        </span>
                    </label>
                    <div class="position-toggle">
                        <div class="position-option ${appearance.position === 'bottom-right' ? 'active' : ''}" data-position="bottom-right">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M7 17L17 7"/>
                                <path d="M17 17H7V7"/>
                            </svg>
                            Bottom Right
                        </div>
                        <div class="position-option ${appearance.position === 'bottom-left' ? 'active' : ''}" data-position="bottom-left">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 17L7 7"/>
                                <path d="M7 17H17V7"/>
                            </svg>
                            Bottom Left
                        </div>
                    </div>
                </div>

                <!-- Border Radius -->
                <div class="control-group">
                    <label class="control-label">
                        <span>
                            <svg class="control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            </svg>
                            Border Radius
                        </span>
                        <span class="range-value" id="radius-value">${appearance.borderRadius}</span>
                    </label>
                    <div class="range-container">
                        <input type="range" id="border-radius" class="range-input" min="0" max="24" value="${parseInt(appearance.borderRadius)}" step="2">
                        <div class="range-labels">
                            <span>Sharp</span>
                            <span>Rounded</span>
                        </div>
                    </div>
                </div>

                <!-- Save Button -->
                <div class="control-group">
                    <button id="save-appearance" class="copy-button">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17,21 17,13 7,13 7,21"/>
                            <polyline points="7,3 7,8 15,8"/>
                        </svg>
                        Save Appearance Settings
                    </button>
                </div>
            </div>
        </div>

        <!-- Position Preview Overlay -->
        <div id="position-preview" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000; display: none;">
            <div id="preview-chatbot-icon" style="position: absolute; ${appearance.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'} bottom: 20px; width: 64px; height: 64px; background: linear-gradient(135deg, ${appearance.primaryColor} 0%, ${appearance.secondaryColor} 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 8px 32px rgba(0,0,0,0.12); animation: bounce 2s infinite;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </div>
        </div>
                        <div class="position-option ${appearance.position === 'bottom-left' ? 'active' : ''}" data-position="bottom-left">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 17L7 7"/>
                                <path d="M7 17H17V7"/>
                            </svg>
                            Bottom Left
                        </div>
                    </div>
                </div>

                <!-- Border Customization -->
                <div class="control-group">
                    <label class="control-label">
                        <span>
                            <svg class="control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            </svg>
                            Border Style
                        </span>
                    </label>
                    <div class="border-controls">
                        <div class="range-container">
                            <label class="control-label">
                                <span>Border Width</span>
                                <span class="range-value" id="border-width-value">2px</span>
                            </label>
                            <input type="range" id="border-width" class="range-input" min="0" max="8" value="2" step="1">
                            <div class="range-labels">
                                <span>None</span>
                                <span>Thick</span>
                            </div>
                        </div>
                    </div>
                </div>
                        <div class="position-option ${appearance.position === 'bottom-left' ? 'active' : ''}" data-position="bottom-left">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 17L7 7"/>
                                <path d="M7 17H17V7"/>
                            </svg>
                            Bottom Left
                        </div>
                    </div>
                </div>

                <!-- Border Radius -->
                <div class="control-group">
                    <label class="control-label">
                        <span>
                            <svg class="control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            </svg>
                            Border Radius
                        </span>
                        <span class="range-value" id="radius-value">${appearance.borderRadius}</span>
                    </label>
                    <div class="range-container">
                        <input type="range" id="border-radius" class="range-input" min="0" max="24" value="${parseInt(appearance.borderRadius)}" step="2">
                        <div class="range-labels">
                            <span>Sharp</span>
                            <span>Rounded</span>
                        </div>
                    </div>
                </div>


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
                <!-- Sample messages for preview -->
                <div class="message bot">
                    <div class="message-content">
                        <div class="message-avatar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <circle cx="12" cy="5" r="2"></circle>
                                <path d="M12 7v4"></path>
                            </svg>
                        </div>
                        <div class="message-wrapper">
                            <div class="message-bubble">Hello! 👋 I'm your AI assistant. How can I help you today?</div>
                            <div class="message-timestamp">10:30 AM</div>
                        </div>
                    </div>
                </div>
                
                <div class="message user">
                    <div class="message-content">
                        <div class="message-avatar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <div class="message-wrapper">
                            <div class="message-bubble">Hi! Can you help me with my account?</div>
                            <div class="message-timestamp">10:31 AM</div>
                        </div>
                    </div>
                </div>
                
                <div class="message bot">
                    <div class="message-content">
                        <div class="message-avatar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <circle cx="12" cy="5" r="2"></circle>
                                <path d="M12 7v4"></path>
                            </svg>
                        </div>
                        <div class="message-wrapper">
                            <div class="message-bubble">Of course! I'd be happy to help you with your account. What specific issue are you experiencing?</div>
                            <div class="message-timestamp">10:31 AM</div>
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
                            disabled
                        />
                    </div>
                    <button id="send-button" class="send-button" disabled>
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
    </div>

    <script>
        // Configuration
        const CONFIG = {
            configId: '${configId || 'default'}',
            baseUrl: '${process.env.BACKEND_URL || process.env.INNGEST_SERVE_HOST || 'https://saaschatbotbackend.onrender.com'}'
        };

        // Current appearance settings - FULLY DYNAMIC
        let currentAppearance = {
            primaryColor: '${appearance.primaryColor}',
            secondaryColor: '${appearance.secondaryColor}',
            position: '${appearance.position}',
            borderRadius: '${appearance.borderRadius}',
            borderWidth: '${appearance.borderWidth}',
            borderStyle: '${appearance.borderStyle}',
            gradientType: '${appearance.gradientType}',
            gradientDirection: '${appearance.gradientDirection}',
            theme: '${appearance.theme}'
        };
 
        // DOM elements
        const primaryColorInput = document.getElementById('primary-color');
        const secondaryColorInput = document.getElementById('secondary-color');
        const primaryValueDisplay = document.getElementById('primary-value');
        const secondaryValueDisplay = document.getElementById('secondary-value');
        const borderRadiusInput = document.getElementById('border-radius');
        const radiusValue = document.getElementById('radius-value');
        const presetGradients = document.querySelectorAll('.preset-gradient');
        const saveButton = document.getElementById('save-appearance');
        const positionPreview = document.getElementById('position-preview');
        const previewIcon = document.getElementById('preview-chatbot-icon');
        const chatbotTitle = document.getElementById('chatbot-title');
        const brandingText = document.getElementById('branding-text');

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
                        chatbotTitle.textContent = \`\${config.companyName} Assistant\`;
                        brandingText.textContent = \`AI Assistant • Powered by \${config.companyName}\`;
                    }
                }
            } catch (error) {
                console.error('Failed to load chatbot config:', error);
            }
        }

        // Update CSS variables - FULLY DYNAMIC
        function updateCSSVariables() {
            const root = document.documentElement;
            root.style.setProperty('--primary-color', currentAppearance.primaryColor);
            root.style.setProperty('--secondary-color', currentAppearance.secondaryColor);
            root.style.setProperty('--border-radius', currentAppearance.borderRadius);
            root.style.setProperty('--border-width', currentAppearance.borderWidth);
            root.style.setProperty('--border-style', currentAppearance.borderStyle);
            root.style.setProperty('--gradient-type', currentAppearance.gradientType);
            root.style.setProperty('--gradient-direction', currentAppearance.gradientDirection);
            root.style.setProperty('--theme-bg', currentAppearance.theme === 'dark' ? '#1f2937' : '#f8fafc');
            root.style.setProperty('--theme-text', currentAppearance.theme === 'dark' ? '#ffffff' : '#000000');
            root.style.setProperty('--chat-bg', currentAppearance.theme === 'dark' ? 'rgba(31,41,55,0.95)' : 'rgba(255,255,255,0.95)');
            root.style.setProperty('--panel-bg', currentAppearance.theme === 'dark' ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.95)');
            
            // Apply dynamic gradient to all elements
            const dynamicGradient = \`\${currentAppearance.gradientType}-gradient(\${currentAppearance.gradientDirection}, \${currentAppearance.primaryColor} 0%, \${currentAppearance.secondaryColor} 100%)\`;
            
            // Update all gradient elements
            const gradientElements = document.querySelectorAll('.panel-header, .chatbot-header, .send-button, .copy-button, .message.user .message-bubble, .message.user .message-avatar');
            gradientElements.forEach(element => {
                element.style.background = dynamicGradient;
            });
            
            // Update bot avatars with reversed gradient
            const botAvatars = document.querySelectorAll('.message.bot .message-avatar');
            botAvatars.forEach(avatar => {
                avatar.style.background = \`\${currentAppearance.gradientType}-gradient(\${currentAppearance.gradientDirection}, \${currentAppearance.secondaryColor} 0%, \${currentAppearance.primaryColor} 100%)\`;
            });
        }

        // Update URL with current appearance settings
        function updateURL() {
            const url = new URL(window.location);
            url.searchParams.set('primaryColor', currentAppearance.primaryColor);
            url.searchParams.set('secondaryColor', currentAppearance.secondaryColor);
            url.searchParams.set('position', currentAppearance.position);
            url.searchParams.set('borderRadius', parseInt(currentAppearance.borderRadius));
            window.history.replaceState({}, '', url.toString());
        }

        // Event listeners for individual color inputs
        primaryColorInput.addEventListener('input', (e) => {
            currentAppearance.primaryColor = e.target.value;
            primaryValueDisplay.textContent = e.target.value;
            updateCSSVariables();
            updateURL();
            updateActivePresetGradient();
        });

        secondaryColorInput.addEventListener('input', (e) => {
            currentAppearance.secondaryColor = e.target.value;
            secondaryValueDisplay.textContent = e.target.value;
            updateCSSVariables();
            updateURL();
            updateActivePresetGradient();
        });

        // Preset gradient selection
        presetGradients.forEach(gradient => {
            gradient.addEventListener('click', () => {
                presetGradients.forEach(g => g.classList.remove('active'));
                gradient.classList.add('active');
                
                currentAppearance.primaryColor = gradient.dataset.primary;
                currentAppearance.secondaryColor = gradient.dataset.secondary;
                
                // Update individual color inputs
                primaryColorInput.value = currentAppearance.primaryColor;
                secondaryColorInput.value = currentAppearance.secondaryColor;
                primaryValueDisplay.textContent = currentAppearance.primaryColor;
                secondaryValueDisplay.textContent = currentAppearance.secondaryColor;
                
                updateCSSVariables();
                updateURL();
            });
        });

        // Update active preset gradient based on current settings
        function updateActivePresetGradient() {
            presetGradients.forEach(gradient => {
                gradient.classList.remove('active');
                if (gradient.dataset.primary === currentAppearance.primaryColor && 
                    gradient.dataset.secondary === currentAppearance.secondaryColor) {
                    gradient.classList.add('active');
                }
            });
        }

        // Position toggle functionality
        document.querySelectorAll('.position-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.position-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                currentAppearance.position = option.dataset.position;
                updateURL();
            });
        });

        borderRadiusInput.addEventListener('input', (e) => {
            currentAppearance.borderRadius = e.target.value + 'px';
            radiusValue.textContent = currentAppearance.borderRadius;
            updateCSSVariables();
            updateURL();
        });

        // Preset color selection
        presetColors.forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.dataset.color;
                currentAppearance.primaryColor = color;
                primaryColorInput.value = color;
                document.getElementById('color-value').textContent = color;
                updateCSSVariables();
                updateURL();
                updateActivePresetColor();
            });
        });

        // Update active preset color
        function updateActivePresetColor() {
            presetColors.forEach(preset => {
                preset.classList.remove('active');
                if (preset.dataset.color === currentAppearance.primaryColor) {
                    preset.classList.add('active');
                }
            });
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            initializeChatbot();
            updateCSSVariables();
            updateActivePresetGradient();
        });
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.send(previewHTML);
});

module.exports = router;