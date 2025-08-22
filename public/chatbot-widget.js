// Standalone ChatBot Widget - Exact React Component Design
(function() {
  'use strict';

  // Create ChatBot Widget with exact React component styling
  function createChatBotWidget(configId, baseUrl) {
    
    // State management
    let isOpen = false;
    let isMinimized = false;
    let messages = [];
    let inputMessage = '';
    let isTyping = false;
    let sessionId = '';
    let connectionStatus = 'online';
    let chatConfig = null;

    // Create main container
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'ai-chatbot-widget';
    widgetContainer.style.cssText = `
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create toggle button (exact same as React component)
    const toggleButton = document.createElement('button');
    toggleButton.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="group-hover:scale-125 transition-all duration-300">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <div style="position: absolute; top: -4px; right: -8px; display: flex; align-items: center; justify-content: center;">
        <div style="position: relative;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" style="animation: sparkle-pulse 2s infinite;">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
          </svg>
          <div style="position: absolute; inset: 0; width: 20px; height: 20px; background: #fbbf24; border-radius: 50%; animation: sparkle-ping 2s infinite; opacity: 0.3;"></div>
        </div>
      </div>
    `;
    toggleButton.style.cssText = `
      position: relative;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #4338ca 100%);
      border: 2px solid rgba(255,255,255,0.2);
      color: white;
      cursor: pointer;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      transition: all 0.5s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create chat window (exact same structure as React component)
    const chatWindow = document.createElement('div');
    chatWindow.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 16px;
      width: 448px;
      height: 640px;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(8px);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      border: 2px solid rgba(255,255,255,0.1);
      display: none;
      flex-direction: column;
      overflow: hidden;
      transition: all 0.5s ease;
    `;

    // Create header (exact same as React component)
    const header = document.createElement('div');
    header.style.cssText = `
      background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #4338ca 100%);
      color: white;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-between;
      border-radius: 12px 12px 0 0;
    `;

    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
        <div style="position: relative; flex-shrink: 0;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1)); display: flex; align-items: center; justify-content: center; border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 4px 8px rgba(0,0,0,0.1); backdrop-filter: blur(4px);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <circle cx="12" cy="5" r="2"></circle>
              <path d="M12 7v4"></path>
            </svg>
          </div>
          <div style="position: absolute; top: -4px; right: -4px;">
            <div style="position: relative;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" style="animation: sparkle-pulse 2s infinite;">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
              </svg>
              <div style="position: absolute; inset: 0; width: 16px; height: 16px; background: #fbbf24; border-radius: 50%; animation: sparkle-ping 2s infinite; opacity: 0.3;"></div>
            </div>
          </div>
          <div id="status-indicator" style="position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; background: #10b981;"></div>
        </div>
        <div style="min-width: 0; flex: 1;">
          <h3 id="chatbot-title" style="font-size: 16px; font-weight: 600; margin: 0; color: white;">AI Assistant</h3>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
            <span id="status-badge" style="font-size: 12px; background: rgba(255,255,255,0.2); color: white; padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.3); backdrop-filter: blur(4px);">Online</span>
            <span style="font-size: 12px; opacity: 0.8; color: rgba(255,255,255,0.8);">Always here to help</span>
          </div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
        <button id="clear-btn" style="width: 32px; height: 32px; border: none; background: rgba(255,255,255,0.2); color: white; border-radius: 50%; cursor: pointer; display: none; align-items: center; justify-content: center; transition: all 0.2s;" title="Clear conversation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
        <button id="minimize-btn" style="width: 32px; height: 32px; border: none; background: rgba(255,255,255,0.2); color: white; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="4,14 10,14 10,20"></polyline>
            <polyline points="20,10 14,10 14,4"></polyline>
            <line x1="14" y1="10" x2="21" y2="3"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </button>
        <button id="close-btn" style="width: 32px; height: 32px; border: none; background: rgba(255,255,255,0.2); color: white; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;

    // Create messages area (exact same as React component)
    const messagesArea = document.createElement('div');
    messagesArea.id = 'messages-area';
    messagesArea.style.cssText = `
      flex: 1;
      padding: 12px 16px;
      overflow-y: auto;
      background: linear-gradient(to bottom, rgba(248,250,252,0.5), white);
    `;

    // Create input area (exact same as React component)
    const inputArea = document.createElement('div');
    inputArea.style.cssText = `
      padding: 12px 16px;
      border-top: 1px solid #e2e8f0;
      background: rgba(255,255,255,0.8);
      backdrop-filter: blur(4px);
      border-radius: 0 0 12px 12px;
    `;

    inputArea.innerHTML = `
      <div style="display: flex; align-items: flex-end; gap: 8px;">
        <div style="flex: 1; position: relative;">
          <input 
            id="message-input" 
            type="text"
            placeholder="Ask me anything..."
            style="width: 100%; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 24px; font-size: 14px; outline: none; transition: border-color 0.2s; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.05);"
          />
        </div>
        <button id="send-btn" style="width: 40px; height: 40px; border: none; border-radius: 50%; background: linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.1); transition: all 0.2s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22,2 15,22 11,13 2,9"></polygon>
          </svg>
        </button>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px;">
        <p style="font-size: 12px; color: #6b7280; margin: 0;">AI Assistant • Powered by your system</p>
      </div>
    `;

    // Assemble chat window
    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesArea);
    chatWindow.appendChild(inputArea);

    // Assemble widget
    widgetContainer.appendChild(chatWindow);
    widgetContainer.appendChild(toggleButton);

    // Initialize chatbot (same logic as React component)
    async function initializeChatbot() {
      try {
        connectionStatus = 'connecting';
        updateStatusIndicator();

        const response = await fetch(`${baseUrl}/api/dashboard/settings/chat-bot`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        const data = await response.json();

        if (data.success && data.data.length > 0) {
          const config = configId !== 'default' 
            ? data.data.find(c => c.id === configId) || data.data[0]
            : data.data[0];
          
          chatConfig = config;
          
          // Update UI
          document.getElementById('chatbot-title').textContent = config.companyName + ' Assistant';
          
          // Add welcome message
          const welcomeText = `Hello! 👋 I'm your friendly ${config.companyName || 'AI'} assistant. I'm here to help you with any questions about our company, policies, or services. 😊`;
          addMessage(welcomeText, 'bot');
        } else {
          chatConfig = { id: 'default', companyName: 'AI Assistant' };
          addMessage("Hello! 👋 I'm your friendly AI assistant. I'm here to help you with any questions about our company, policies, or services. Feel free to ask me anything in your preferred language! 😊", 'bot');
        }

        connectionStatus = 'online';
        updateStatusIndicator();
      } catch (error) {
        console.error('Error initializing chatbot:', error);
        connectionStatus = 'offline';
        updateStatusIndicator();
        chatConfig = { id: 'default', companyName: 'AI Assistant' };
        addMessage("Hello! 👋 I'm your friendly AI assistant. I'm currently experiencing some connectivity issues, but I'll do my best to help you with any questions! 😊", 'bot');
      }
    }

    // Add message function (exact same styling as React component)
    function addMessage(text, sender) {
      const messageDiv = document.createElement('div');
      messageDiv.style.cssText = `
        display: flex;
        margin-bottom: 24px;
        ${sender === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
      `;

      const messageContent = document.createElement('div');
      messageContent.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 8px;
        max-width: 85%;
        ${sender === 'user' ? 'flex-direction: row-reverse;' : ''}
      `;

      const avatar = document.createElement('div');
      avatar.style.cssText = `
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ${sender === 'user' 
          ? 'background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; border: 1px solid rgba(59,130,246,0.2);' 
          : 'background: linear-gradient(135deg, #7c3aed 0%, #4338ca 100%); color: white; border: 1px solid rgba(124,58,237,0.2);'
        }
      `;
      avatar.innerHTML = sender === 'user' 
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>';

      const bubble = document.createElement('div');
      bubble.style.cssText = `
        padding: 12px 16px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.4;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        backdrop-filter: blur(4px);
        transition: all 0.2s;
        white-space: pre-line;
        ${sender === 'user' 
          ? 'background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white;' 
          : 'background: white; color: #334155; border: 1px solid #e2e8f0;'
        }
      `;
      bubble.textContent = text;

      const timestamp = document.createElement('div');
      timestamp.style.cssText = `
        font-size: 12px;
        color: #6b7280;
        margin-top: 4px;
        padding: 0 4px;
        ${sender === 'user' ? 'text-align: right;' : 'text-align: left;'}
      `;
      timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const messageWrapper = document.createElement('div');
      messageWrapper.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';
      messageWrapper.appendChild(bubble);
      messageWrapper.appendChild(timestamp);

      messageContent.appendChild(avatar);
      messageContent.appendChild(messageWrapper);
      messageDiv.appendChild(messageContent);

      messagesArea.appendChild(messageDiv);
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    // Send message function (same logic as React component)
    async function sendMessage(message) {
      if (!message.trim() || isTyping) return;

      addMessage(message, 'user');
      isTyping = true;
      showTypingIndicator();

      try {
        connectionStatus = 'connecting';
        updateStatusIndicator();

        const response = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({
            message: message,
            sessionId: sessionId || undefined,
            configId: chatConfig?.id || 'default'
          })
        });

        const data = await response.json();

        if (data.success) {
          if (!sessionId) {
            sessionId = data.data.sessionId;
            document.getElementById('clear-btn').style.display = 'flex';
          }
          
          connectionStatus = 'online';
          updateStatusIndicator();
          addMessage(data.data.response, 'bot');
        } else {
          throw new Error(data.message || 'Failed to get AI response');
        }
      } catch (error) {
        console.error('Error getting AI response:', error);
        connectionStatus = 'offline';
        updateStatusIndicator();
        addMessage("I'm sorry, I'm currently experiencing technical difficulties. Please try again in a moment, or contact support if the issue persists.", 'bot');
      } finally {
        isTyping = false;
        hideTypingIndicator();
      }
    }

    // Typing indicator functions (exact same as React component)
    function showTypingIndicator() {
      const typingDiv = document.createElement('div');
      typingDiv.id = 'typing-indicator';
      typingDiv.style.cssText = `
        display: flex;
        justify-content: flex-start;
        margin-bottom: 16px;
      `;

      typingDiv.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 8px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed 0%, #4338ca 100%); color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid rgba(124,58,237,0.2);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>
          </div>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 18px; padding: 12px 16px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="display: flex; gap: 4px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #7c3aed; animation: typing-bounce 1.4s infinite ease-in-out;"></div>
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #7c3aed; animation: typing-bounce 1.4s infinite ease-in-out; animation-delay: 0.2s;"></div>
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #7c3aed; animation: typing-bounce 1.4s infinite ease-in-out; animation-delay: 0.4s;"></div>
              </div>
              <span style="font-size: 12px; color: #6b7280;">AI is thinking...</span>
            </div>
          </div>
        </div>
      `;

      messagesArea.appendChild(typingDiv);
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    function hideTypingIndicator() {
      const typingIndicator = document.getElementById('typing-indicator');
      if (typingIndicator) {
        typingIndicator.remove();
      }
    }

    // Update status indicator
    function updateStatusIndicator() {
      const indicator = document.getElementById('status-indicator');
      const badge = document.getElementById('status-badge');
      
      switch (connectionStatus) {
        case 'online':
          indicator.style.background = '#10b981';
          badge.textContent = 'Online';
          break;
        case 'connecting':
          indicator.style.background = '#f59e0b';
          badge.textContent = 'Connecting...';
          break;
        case 'offline':
          indicator.style.background = '#ef4444';
          badge.textContent = 'Offline';
          break;
      }
    }

    // Clear conversation
    async function clearConversation() {
      if (!sessionId) return;

      try {
        await fetch(`${baseUrl}/api/chat/session/${sessionId}`, {
          method: 'DELETE',
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        
        sessionId = '';
        document.getElementById('clear-btn').style.display = 'none';
        
        // Clear messages and add welcome message
        messagesArea.innerHTML = '';
        const welcomeText = `Hello! 👋 I'm the ${chatConfig?.companyName || 'AI'} assistant. I'm here to help you with any questions you might have. What would you like to know?`;
        addMessage(welcomeText, 'bot');
      } catch (error) {
        console.error('Error clearing conversation:', error);
      }
    }

    // Event listeners
    toggleButton.addEventListener('click', () => {
      isOpen = !isOpen;
      if (isOpen) {
        chatWindow.style.display = 'flex';
        toggleButton.innerHTML = `
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
        toggleButton.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        
        if (!chatConfig) {
          initializeChatbot();
        }
        
        // Focus input
        setTimeout(() => {
          document.getElementById('message-input').focus();
        }, 100);
      } else {
        chatWindow.style.display = 'none';
        toggleButton.innerHTML = `
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <div style="position: absolute; top: -4px; right: -8px; display: flex; align-items: center; justify-content: center;">
            <div style="position: relative;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" style="animation: sparkle-pulse 2s infinite;">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
              </svg>
              <div style="position: absolute; inset: 0; width: 20px; height: 20px; background: #fbbf24; border-radius: 50%; animation: sparkle-ping 2s infinite; opacity: 0.3;"></div>
            </div>
          </div>
        `;
        toggleButton.style.background = 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #4338ca 100%)';
      }
    });

    // Close button
    document.addEventListener('click', (e) => {
      if (e.target.closest('#close-btn')) {
        isOpen = false;
        chatWindow.style.display = 'none';
        toggleButton.innerHTML = `
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <div style="position: absolute; top: -4px; right: -8px; display: flex; align-items: center; justify-content: center;">
            <div style="position: relative;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" style="animation: sparkle-pulse 2s infinite;">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
              </svg>
              <div style="position: absolute; inset: 0; width: 20px; height: 20px; background: #fbbf24; border-radius: 50%; animation: sparkle-ping 2s infinite; opacity: 0.3;"></div>
            </div>
          </div>
        `;
        toggleButton.style.background = 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #4338ca 100%)';
      }
    });

    // Clear conversation button
    document.addEventListener('click', (e) => {
      if (e.target.closest('#clear-btn')) {
        clearConversation();
      }
    });

    // Send message
    document.addEventListener('click', (e) => {
      if (e.target.closest('#send-btn')) {
        const input = document.getElementById('message-input');
        sendMessage(input.value);
        input.value = '';
      }
    });

    // Enter key to send
    document.addEventListener('keydown', (e) => {
      if (e.target.id === 'message-input' && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const input = document.getElementById('message-input');
        sendMessage(input.value);
        input.value = '';
      }
    });

    // Input focus styling
    document.addEventListener('focusin', (e) => {
      if (e.target.id === 'message-input') {
        e.target.style.borderColor = '#3b82f6';
      }
    });

    document.addEventListener('focusout', (e) => {
      if (e.target.id === 'message-input') {
        e.target.style.borderColor = '#e2e8f0';
      }
    });

    // Hover effects
    toggleButton.addEventListener('mouseenter', () => {
      toggleButton.style.transform = 'scale(1.1)';
      toggleButton.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
    });

    toggleButton.addEventListener('mouseleave', () => {
      toggleButton.style.transform = 'scale(1)';
      toggleButton.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
    });

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes sparkle-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      @keyframes sparkle-ping {
        75%, 100% {
          transform: scale(2);
          opacity: 0;
        }
      }
      
      @keyframes typing-bounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-8px); }
      }
      
      #ai-chatbot-widget button:hover {
        transform: scale(1.05);
      }
      
      #ai-chatbot-widget #send-btn:hover {
        box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        transform: scale(1.05);
      }
      
      #ai-chatbot-widget #clear-btn:hover,
      #ai-chatbot-widget #minimize-btn:hover,
      #ai-chatbot-widget #close-btn:hover {
        background: rgba(255,255,255,0.3) !important;
      }
      
      @media (max-width: 768px) {
        #ai-chatbot-widget > div:first-child {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          border-radius: 0 !important;
        }
        
        #ai-chatbot-widget {
          bottom: 16px !important;
          right: 16px !important;
        }
      }
    `;
    document.head.appendChild(style);

    return widgetContainer;
  }

  // Auto-initialize if script has data attributes
  function autoInit() {
    const scripts = document.querySelectorAll('script[src*="chatbot-widget.js"]');
    const currentScript = scripts[scripts.length - 1];
    
    if (currentScript) {
      const configId = currentScript.getAttribute('data-config-id') || 'default';
      const baseUrl = currentScript.getAttribute('data-base-url') || 'https://saaschatbotbackend.onrender.com';
      
      const widget = createChatBotWidget(configId, baseUrl);
      document.body.appendChild(widget);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // Expose global function for manual initialization
  window.initAIChatBot = function(configId, baseUrl) {
    const widget = createChatBotWidget(configId, baseUrl);
    document.body.appendChild(widget);
    return widget;
  };

})();