// User AI Chatbot Widget - Standalone Implementation
(function () {
  "use strict";

  // Configuration from script attributes or global config
  let config = {
    configId: "default",
    baseUrl: "https://saaschatbotbackend.onrender.com",
    // baseUrl: "https://harmless-flea-inviting.ngrok-free.app",
    apiEndpoint: null,
    theme: "light",
    position: "bottom-right",
    primaryColor: "#3b82f6",
    secondaryColor: "#7c3aed",
    borderRadius: "12px",
    borderWidth: "2px",
    borderStyle: "solid",
    gradientType: "linear",
    gradientDirection: "135deg",
    greeting: "Hello! How can I help you today?",
    placeholder: "Type your message...",
    autoOpen: false,
    autoOpenDelay: 5000,
    showBranding: true,
    companyName: "AI Assistant",
    customStyles: {},
    onOpen: null,
    onClose: null,
    onMessage: null,
  };

  // State management
  let isOpen = false;
  let isMinimized = false;
  let messages = [];
  let sessionId = null;
  let isTyping = false;
  let connectionStatus = "online";
  let chatbotConfig = null;

  // Decode hex-encoded values for security
  function decodeHash(hashedValue) {
    try {
      // Check if it's hex encoded (even length, only hex characters)
      if (hashedValue.length % 2 === 0 && /^[0-9a-f]+$/i.test(hashedValue)) {
        // Convert hex string back to original string
        let result = '';
        for (let i = 0; i < hashedValue.length; i += 2) {
          result += String.fromCharCode(parseInt(hashedValue.substr(i, 2), 16));
        }
        console.log(`Decoded hex: ${hashedValue} -> ${result}`);
        return result;
      } else {
        // Not hex encoded, return as-is
        console.log(`Not hex encoded: ${hashedValue}`);
        return hashedValue;
      }
    } catch (error) {
      console.warn('Failed to decode hash:', hashedValue, error.message);
      // If decoding fails, return the original value (might be plain text)
      return hashedValue;
    }
  }

  // Check if a string is likely Base64 encoded
  function isBase64Encoded(str) {
    // Base64 strings should only contain A-Z, a-z, 0-9, +, /, -, _, and =
    const base64Regex = /^[A-Za-z0-9+/\-_=]+$/;
    return base64Regex.test(str) && str.length > 10; // Reasonable length check
  }

  // Initialize configuration with support for fully obfuscated script tags
  function initializeConfig() {
    console.log('Initializing chatbot configuration...');
    
    // Get config from script attributes - first try normal src attribute
    const scripts = document.querySelectorAll('script[src*="userChatBotWidget.js"]');
    let currentScript = scripts[scripts.length - 1];
    
    console.log('Found scripts with normal src:', scripts.length);

    // If no script found with normal src, look for obfuscated scripts
    if (!currentScript) {
      console.log('No normal script found, searching for obfuscated scripts...');
      const allScripts = document.querySelectorAll("script");
      
      for (let script of allScripts) {
        const attributes = script.attributes;
        let foundWidget = false;
        
        // Check each attribute to see if it's an encoded src pointing to our widget
        for (let attr of attributes) {
          try {
            const decodedAttrName = decodeHash(attr.name);
            if (decodedAttrName === "src") {
              const decodedSrc = decodeHash(attr.value);
              console.log('Decoded src:', decodedSrc);
              if (decodedSrc.includes("userChatBotWidget.js")) {
                currentScript = script;
                foundWidget = true;
                console.log('Found obfuscated widget script!');
                break;
              }
            }
          } catch (e) {
            // Continue checking other attributes
          }
        }
        if (foundWidget) break;
        
        // Also check for data-enc-config-id as a fallback identifier
        for (let attr of attributes) {
          try {
            const decodedAttrName = decodeHash(attr.name);
            if (decodedAttrName === "data-enc-config-id") {
              currentScript = script;
              foundWidget = true;
              console.log('Found script with obfuscated config-id!');
              break;
            }
          } catch (e) {
            // Continue checking
          }
        }
        if (foundWidget) break;
      }
    }
    
    // Now process the found script (or fallback to current script)
    if (currentScript) {
      console.log('Processing script attributes...');
      const attributes = currentScript.attributes;
      let foundConfig = false;

      for (let attr of attributes) {
        try {
          const decodedAttrName = decodeHash(attr.name);
          
          console.log(`Checking attribute: ${attr.name} -> ${decodedAttrName}`);

          // Handle obfuscated attributes (double encoded)
          if (decodedAttrName === "data-enc-config-id") {
            const decodedAttrValue = decodeHash(attr.value);
            config.configId = decodeHash(decodedAttrValue); // Double decode for enc attributes
            console.log('Found obfuscated config-id:', config.configId);
            foundConfig = true;
          } else if (decodedAttrName === "data-enc-base-url") {
            const decodedAttrValue = decodeHash(attr.value);
            config.baseUrl = decodeHash(decodedAttrValue); // Double decode for enc attributes
            console.log('Found obfuscated base-url:', config.baseUrl);
          }
          // Handle regular hashed attributes (backward compatibility)
          else if (decodedAttrName === "data-config-id") {
            config.configId = decodeHash(attr.value);
            console.log('Found regular hashed config-id:', config.configId);
            foundConfig = true;
          } else if (decodedAttrName === "data-base-url") {
            config.baseUrl = decodeHash(attr.value);
            console.log('Found regular hashed base-url:', config.baseUrl);
          }
        } catch (e) {
          // Try regular attribute names for backward compatibility
          if (attr.name === "data-config-id") {
            config.configId = decodeHash(attr.value);
            console.log('Found plain config-id:', config.configId);
            foundConfig = true;
          } else if (attr.name === "data-base-url") {
            config.baseUrl = decodeHash(attr.value);
            console.log('Found plain base-url:', config.baseUrl);
          }
        }
      }
      
      if (!foundConfig) {
        console.warn('No config ID found in script attributes, using default');
      }
    } else {
      console.warn('No script element found, using default configuration');
    }

    // Merge with global config if available
    if (window.chatbotConfig) {
      // If global config has hashed values, decode them
      if (window.chatbotConfig.configId) {
        window.chatbotConfig.configId = decodeHash(
          window.chatbotConfig.configId
        );
      }
      if (window.chatbotConfig.baseUrl) {
        window.chatbotConfig.baseUrl = decodeHash(window.chatbotConfig.baseUrl);
      }
      config = { ...config, ...window.chatbotConfig };
    }

    // Set API endpoint
    config.apiEndpoint = `${config.baseUrl}/api/embed/user-chatbot`;

    console.log("Chatbot initialized with config:", {
      configId: config.configId,
      baseUrl: config.baseUrl,
      apiEndpoint: config.apiEndpoint,
    });
  }

  // Create chatbot widget
  function createChatBotWidget() {
    // Main container
    const widgetContainer = document.createElement("div");
    widgetContainer.id = "user-ai-chatbot-widget";
    widgetContainer.style.cssText = `
      position: fixed;
      ${config.position.includes("right") ? "right: 20px;" : "left: 20px;"}
      bottom: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create toggle button
    const toggleButton = createToggleButton();

    // Create chat window
    const chatWindow = createChatWindow();

    // Assemble widget
    widgetContainer.appendChild(chatWindow);
    widgetContainer.appendChild(toggleButton);

    // Add to page
    document.body.appendChild(widgetContainer);

    // Add CSS styles
    addStyles();

    // Initialize chatbot
    initializeChatbot();

    // Auto-open if configured
    if (config.autoOpen) {
      setTimeout(() => {
        if (!isOpen) {
          toggleChat();
        }
      }, config.autoOpenDelay);
    }

    return widgetContainer;
  }

  // Create toggle button
  function createToggleButton() {
    const toggleButton = document.createElement("button");
    toggleButton.id = "user-chatbot-toggle";
    toggleButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chat-icon">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;

    toggleButton.style.cssText = `
      position: relative;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%);
      border: none;
      color: white;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      outline: none;
      z-index: 1000;
    `;

    // Event listeners
    toggleButton.addEventListener("click", toggleChat);
    toggleButton.addEventListener("mouseenter", () => {
      toggleButton.style.transform = "scale(1.1)";
      toggleButton.style.boxShadow = "0 8px 25px rgba(0,0,0,0.2)";
    });
    toggleButton.addEventListener("mouseleave", () => {
      toggleButton.style.transform = "scale(1)";
      toggleButton.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
    });

    return toggleButton;
  }

  // Create chat window
  function createChatWindow() {
    const chatWindow = document.createElement("div");
    chatWindow.id = "user-chatbot-window";
    chatWindow.style.cssText = `
      position: fixed;
      ${config.position.includes("right") ? "right: 20px;" : "left: 20px;"}
      bottom: 90px;
      width: 380px;
      height: 550px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      border: 1px solid #e5e7eb;
      display: none;
      flex-direction: column;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 999998;
    `;

    // Create header
    const header = createHeader();

    // Create messages area
    const messagesArea = createMessagesArea();

    // Create input area
    const inputArea = createInputArea();

    // Assemble chat window
    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesArea);
    chatWindow.appendChild(inputArea);

    return chatWindow;
  }

  // Create header
  function createHeader() {
    const header = document.createElement("div");
    header.id = "user-chatbot-header";
    header.style.cssText = `
      background: linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%);
      color: white;
      padding: 20px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-radius: 16px 16px 0 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;

    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
        <div style="position: relative; flex-shrink: 0;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <circle cx="12" cy="5" r="2"></circle>
              <path d="M12 7v4"></path>
            </svg>
          </div>
          <div id="status-indicator" style="position: absolute; bottom: -1px; right: -1px; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; background: #10b981;"></div>
        </div>
        <div style="min-width: 0; flex: 1;">
          <h3 id="chatbot-title" style="font-size: 15px; font-weight: 600; margin: 0; color: white;">${config.companyName}</h3>
          <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
            <span id="status-badge" style="font-size: 11px; background: rgba(255,255,255,0.2); color: white; padding: 2px 6px; border-radius: 8px;">Online</span>
            <span style="font-size: 11px; opacity: 0.9; color: rgba(255,255,255,0.9);">Ready to help</span>
          </div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
        <button id="clear-btn" style="width: 28px; height: 28px; border: none; background: rgba(255,255,255,0.15); color: white; border-radius: 50%; cursor: pointer; display: none; align-items: center; justify-content: center; transition: all 0.2s; backdrop-filter: blur(10px);" title="Clear conversation">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </button>
        <button id="close-btn" style="width: 28px; height: 28px; border: none; background: rgba(255,255,255,0.15); color: white; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; backdrop-filter: blur(10px);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;

    // Add event listeners
    header
      .querySelector("#clear-btn")
      .addEventListener("click", clearConversation);
    header.querySelector("#close-btn").addEventListener("click", toggleChat);

    return header;
  }

  // Create messages area
  function createMessagesArea() {
    const messagesArea = document.createElement("div");
    messagesArea.id = "user-chatbot-messages";
    messagesArea.style.cssText = `
      flex: 1;
      padding: 20px 16px;
      overflow-y: auto;
      scroll-behavior: smooth;
    `;

    return messagesArea;
  }

  // Create input area
  function createInputArea() {
    const inputArea = document.createElement("div");
    inputArea.id = "user-chatbot-input";
    inputArea.style.cssText = `
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      background: white;
      border-radius: 0 0 16px 16px;
    `;

    inputArea.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="flex: 1; position: relative;">
          <input 
            id="message-input" 
            type="text"
            placeholder="${config.placeholder}"
            style="width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 20px; font-size: 14px; outline: none; transition: all 0.2s; background: #f9fafb; box-sizing: border-box;"
          />
        </div>
        <button id="send-btn" style="width: 40px; height: 40px; border: none; border-radius: 50%; background: linear-gradient(135deg, ${
          config.primaryColor
        } 0%, ${
      config.secondaryColor
    } 100%); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: all 0.2s; flex-shrink: 0;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m22 2-7 20-4-9-9-4z"/>
            <path d="M22 2 11 13"/>
          </svg>
        </button>
      </div>
      ${
        config.showBranding
          ? `
      <div style="margin-top: 8px; text-align: center;">
        <p style="font-size: 11px; color: #9ca3af; margin: 0;">
          Powered by ${config.companyName}
        </p>
      </div>
      `
          : ""
      }
    `;

    // Add event listeners
    const messageInput = inputArea.querySelector("#message-input");
    const sendBtn = inputArea.querySelector("#send-btn");

    sendBtn.addEventListener("click", () => {
      sendMessage(messageInput.value);
      messageInput.value = "";
    });

    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage(messageInput.value);
        messageInput.value = "";
      }
    });

    messageInput.addEventListener("focus", () => {
      messageInput.style.borderColor = config.primaryColor;
    });

    messageInput.addEventListener("blur", () => {
      messageInput.style.borderColor = "#e2e8f0";
    });

    return inputArea;
  }

  // Initialize chatbot configuration
  async function initializeChatbot() {
    try {
      connectionStatus = "connecting";
      updateStatusIndicator();

      const response = await fetch(
        `${config.baseUrl}/api/embed/user-chatbot/${config.configId}/config`,
        {
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        chatbotConfig = data.data;

        // Apply appearance settings if available
        if (chatbotConfig.appearance) {
          const appearance =
            typeof chatbotConfig.appearance === "string"
              ? JSON.parse(chatbotConfig.appearance)
              : chatbotConfig.appearance;

          console.log("Loaded appearance settings:", appearance);

          // Update config with appearance settings
          config.primaryColor = appearance.primaryColor || config.primaryColor;
          config.secondaryColor =
            appearance.secondaryColor || config.secondaryColor;
          config.borderRadius = appearance.borderRadius || config.borderRadius;
          config.borderWidth = appearance.borderWidth || config.borderWidth;
          config.borderStyle = appearance.borderStyle || config.borderStyle;
          config.position = appearance.position || config.position;
          config.gradientType = appearance.gradientType || config.gradientType;
          config.gradientDirection =
            appearance.gradientDirection || config.gradientDirection;

          // Update existing elements with new appearance
          setTimeout(() => {
            updateWidgetAppearance();
          }, 100); // Small delay to ensure DOM elements are ready
        } else {
          console.log("No appearance settings found, using defaults");
        }

        // Update UI with config
        const titleElement = document.getElementById("chatbot-title");
        if (titleElement) {
          titleElement.textContent = `${chatbotConfig.companyName} Assistant`;
        }

        // Add welcome message
        const welcomeText = `Hello! 👋 I'm your ${chatbotConfig.companyName} assistant. How can I help you today?`;
        addMessage(welcomeText, "bot");
      } else {
        throw new Error(data.message || "Failed to load chatbot configuration");
      }

      connectionStatus = "online";
      updateStatusIndicator();
    } catch (error) {
      console.error("Failed to initialize user chatbot:", error);
      connectionStatus = "offline";
      updateStatusIndicator();
      addMessage(config.greeting, "bot");
    }
  }

  // Toggle chat window
  function toggleChat() {
    isOpen = !isOpen;
    const chatWindow = document.getElementById("user-chatbot-window");
    const toggleButton = document.getElementById("user-chatbot-toggle");

    if (isOpen) {
      chatWindow.style.display = "flex";
      toggleButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      toggleButton.style.background = `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%)`;

      // Focus input
      setTimeout(() => {
        const messageInput = document.getElementById("message-input");
        if (messageInput) messageInput.focus();
      }, 100);

      // Call onOpen callback
      if (config.onOpen && typeof config.onOpen === "function") {
        config.onOpen();
      }
    } else {
      chatWindow.style.display = "none";
      toggleButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chat-icon">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
      toggleButton.style.background = `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%)`;

      // Call onClose callback
      if (config.onClose && typeof config.onClose === "function") {
        config.onClose();
      }
    }
  }

  // Add message to chat
  function addMessage(content, sender) {
    const messagesArea = document.getElementById("user-chatbot-messages");
    if (!messagesArea) return;

    const messageDiv = document.createElement("div");
    messageDiv.style.cssText = `
      display: flex;
      margin-bottom: 20px;
      ${
        sender === "user"
          ? "justify-content: flex-end;"
          : "justify-content: flex-start;"
      }
    `;

    const messageContent = document.createElement("div");
    messageContent.style.cssText = `
      display: flex;
      align-items: flex-start;
      gap: 10px;
      max-width: 80%;
      ${sender === "user" ? "flex-direction: row-reverse;" : ""}
    `;

    const avatar = document.createElement("div");
    avatar.style.cssText = `
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      ${
        sender === "user"
          ? `background: linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%); color: white;`
          : `background: linear-gradient(135deg, ${config.secondaryColor} 0%, ${config.primaryColor} 100%); color: white;`
      }
    `;
    avatar.innerHTML =
      sender === "user"
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>';

    const bubble = document.createElement("div");
    bubble.style.cssText = `
      padding: 10px 14px;
      border-radius: ${
        sender === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px"
      };
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
      ${
        sender === "user"
          ? `background: linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%); color: white;`
          : "background: white; color: #374151; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
      }
    `;
    bubble.innerHTML = content;

    const timestamp = document.createElement("div");
    timestamp.style.cssText = `
      font-size: 11px;
      color: #9ca3af;
      margin-top: 4px;
      ${sender === "user" ? "text-align: right;" : "text-align: left;"}
    `;
    timestamp.textContent = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const messageWrapper = document.createElement("div");
    messageWrapper.style.cssText = "display: flex; flex-direction: column;";
    messageWrapper.appendChild(bubble);
    messageWrapper.appendChild(timestamp);

    messageContent.appendChild(avatar);
    messageContent.appendChild(messageWrapper);
    messageDiv.appendChild(messageContent);

    messagesArea.appendChild(messageDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;

    messages.push({ content, sender, timestamp: new Date() });
  }

  // Send message with enhanced user experience
  async function sendMessage(message) {
    if (!message.trim() || isTyping) return;

    addMessage(message, "user");
    isTyping = true;
    showTypingIndicator();

    // Call onMessage callback
    if (config.onMessage && typeof config.onMessage === "function") {
      config.onMessage(message);
    }

    try {
      connectionStatus = "connecting";
      updateStatusIndicator();

      const response = await fetch(config.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          message: message,
          sessionId: sessionId,
          configId: config.configId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (!sessionId) {
          sessionId = data.data.sessionId;
          const clearBtn = document.getElementById("clear-btn");
          if (clearBtn) clearBtn.style.display = "flex";
        }

        connectionStatus = "online";
        updateStatusIndicator();
        addMessage(data.data.response, "bot");

        // Show sources if available
        if (data.data.sources && data.data.sources.length > 0) {
          showSources(data.data.sources);
        }
      } else {
        // Handle specific error types with user-friendly messages
        if (
          data.message.includes("not found") ||
          data.message.includes("disabled")
        ) {
          addMessage(
            "🚫 This chatbot is currently unavailable. Please try again later or contact support.",
            "bot"
          );
        } else if (data.message.includes("rate limit")) {
          addMessage(
            "⏱️ I'm receiving a lot of questions right now. Please wait a moment and try again.",
            "bot"
          );
        } else {
          addMessage(
            "😔 I apologize, but I encountered an issue processing your request. Could you please try rephrasing your question?",
            "bot"
          );
        }
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      connectionStatus = "offline";
      updateStatusIndicator();

      // Provide more specific error messages based on error type
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        addMessage(
          "🌐 I'm having trouble connecting to our servers. Please check your internet connection and try again.",
          "bot"
        );
      } else if (error.message.includes("timeout")) {
        addMessage(
          "⏱️ The request is taking longer than expected. Please try again with a shorter message.",
          "bot"
        );
      } else {
        addMessage(
          "🔧 I'm experiencing some technical difficulties. Please try again in a moment, and if the problem persists, feel free to contact our support team.",
          "bot"
        );
      }
    } finally {
      isTyping = false;
      hideTypingIndicator();
    }
  }

  // Show sources function for document references
  function showSources(sources) {
    if (!sources || sources.length === 0) return;

    const messagesArea = document.getElementById("user-chatbot-messages");
    if (!messagesArea) return;

    const sourcesDiv = document.createElement("div");
    sourcesDiv.style.cssText = `
      display: flex;
      justify-content: flex-start;
      margin-bottom: 16px;
    `;

    const sourcesContent = document.createElement("div");
    sourcesContent.style.cssText = `
      max-width: 85%;
      padding: 8px 12px;
      background: rgba(124, 58, 237, 0.1);
      border: 1px solid rgba(124, 58, 237, 0.2);
      border-radius: 12px;
      font-size: 12px;
      color: #6b7280;
    `;

    sourcesContent.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px; color: #7c3aed;">📚 Sources:</div>
      ${sources
        .map(
          (source, index) => `
        <div style="margin-bottom: 2px;">
          ${index + 1}. ${source.source || "Document"}
        </div>
      `
        )
        .join("")}
    `;

    sourcesDiv.appendChild(sourcesContent);
    messagesArea.appendChild(sourcesDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  // Show typing indicator
  function showTypingIndicator() {
    const messagesArea = document.getElementById("user-chatbot-messages");
    if (!messagesArea) return;

    const typingDiv = document.createElement("div");
    typingDiv.id = "typing-indicator";
    typingDiv.style.cssText = `
      display: flex;
      justify-content: flex-start;
      margin-bottom: 16px;
    `;

    typingDiv.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 8px;">
        <div style="width: 28px; height: 28px; border-radius: 50%; background: ${config.secondaryColor}; color: white; display: flex; align-items: center; justify-content: center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>
        </div>
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 16px 16px 16px 4px; padding: 10px 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="display: flex; gap: 4px;">
              <div class="typing-dot" style="width: 6px; height: 6px; border-radius: 50%; background: ${config.secondaryColor};"></div>
              <div class="typing-dot" style="width: 6px; height: 6px; border-radius: 50%; background: ${config.secondaryColor};"></div>
              <div class="typing-dot" style="width: 6px; height: 6px; border-radius: 50%; background: ${config.secondaryColor};"></div>
            </div>
            <span style="font-size: 12px; color: #6b7280;">AI is thinking...</span>
          </div>
        </div>
      </div>
    `;

    messagesArea.appendChild(typingDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  // Hide typing indicator
  function hideTypingIndicator() {
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // Update status indicator
  function updateStatusIndicator() {
    const indicator = document.getElementById("status-indicator");
    const badge = document.getElementById("status-badge");

    if (!indicator || !badge) return;

    switch (connectionStatus) {
      case "online":
        indicator.style.background = "#10b981";
        badge.textContent = "Online";
        break;
      case "connecting":
        indicator.style.background = "#f59e0b";
        badge.textContent = "Connecting...";
        break;
      case "offline":
        indicator.style.background = "#ef4444";
        badge.textContent = "Offline";
        break;
    }
  }

  // Update widget appearance with current config - FULLY DYNAMIC
  function updateWidgetAppearance() {
    const toggleButton = document.getElementById("user-chatbot-toggle");
    const chatWindow = document.getElementById("user-chatbot-window");
    const header = document.getElementById("user-chatbot-header");
    const sendBtn = document.getElementById("send-btn");
    const inputArea = document.getElementById("user-chatbot-input");

    if (!toggleButton || !chatWindow || !header) {
      console.log("Widget elements not found, retrying in 100ms...");
      setTimeout(updateWidgetAppearance, 100);
      return;
    }

    console.log("Applying DYNAMIC appearance settings:", config);

    // Create dynamic gradient based on config
    const gradient = `${config.gradientType}-gradient(${config.gradientDirection}, ${config.primaryColor} 0%, ${config.secondaryColor} 100%)`;

    // Update toggle button with DYNAMIC gradient and border
    toggleButton.style.background = gradient;
    toggleButton.style.border = `${config.borderWidth} ${config.borderStyle} rgba(255,255,255,0.2)`;
    toggleButton.style.borderRadius =
      config.borderRadius === "0px" ? "50%" : "50%"; // Keep circular for toggle

    // Update chat window with DYNAMIC border radius and border
    chatWindow.style.borderRadius = config.borderRadius;
    chatWindow.style.border = `${config.borderWidth} ${config.borderStyle} rgba(255,255,255,0.1)`;

    // Update header with DYNAMIC gradient and border radius
    header.style.background = gradient;
    header.style.borderRadius = `${config.borderRadius} ${config.borderRadius} 0 0`;

    // Update input area with DYNAMIC border radius
    if (inputArea) {
      inputArea.style.borderRadius = `0 0 ${config.borderRadius} ${config.borderRadius}`;
    }

    // Update send button with DYNAMIC gradient
    if (sendBtn) {
      sendBtn.style.background = gradient;
    }

    // Update position DYNAMICALLY
    const isLeft = config.position === "bottom-left";
    const widgetContainer = document.getElementById("user-ai-chatbot-widget");
    if (widgetContainer) {
      widgetContainer.style.right = isLeft ? "auto" : "20px";
      widgetContainer.style.left = isLeft ? "20px" : "auto";
    }

    chatWindow.style.right = isLeft ? "auto" : "20px";
    chatWindow.style.left = isLeft ? "20px" : "auto";

    // Update existing user message bubbles with DYNAMIC gradient
    const existingUserBubbles = document.querySelectorAll(
      '[data-sender="user"] .message-bubble'
    );
    existingUserBubbles.forEach((bubble) => {
      bubble.style.background = gradient;
    });

    // Update existing bot avatars with DYNAMIC gradient (reversed)
    const existingBotAvatars = document.querySelectorAll(
      '[data-sender="bot"] .message-avatar'
    );
    existingBotAvatars.forEach((avatar) => {
      avatar.style.background = `${config.gradientType}-gradient(${config.gradientDirection}, ${config.secondaryColor} 0%, ${config.primaryColor} 100%)`;
    });

    // Update existing user avatars with DYNAMIC gradient
    const existingUserAvatars = document.querySelectorAll(
      '[data-sender="user"] .message-avatar'
    );
    existingUserAvatars.forEach((avatar) => {
      avatar.style.background = gradient;
    });

    // Update input field focus color
    const messageInput = document.getElementById("message-input");
    if (messageInput) {
      // Store current value and selection
      const currentValue = messageInput.value;
      const currentSelectionStart = messageInput.selectionStart;
      const currentSelectionEnd = messageInput.selectionEnd;

      // Remove existing focus listeners to avoid duplicates
      const newInput = messageInput.cloneNode(true);
      newInput.value = currentValue;
      messageInput.parentNode.replaceChild(newInput, messageInput);

      // Restore selection
      newInput.setSelectionRange(currentSelectionStart, currentSelectionEnd);

      // Add event listeners with updated colors
      newInput.addEventListener("focus", () => {
        newInput.style.borderColor = config.primaryColor;
      });

      newInput.addEventListener("blur", () => {
        newInput.style.borderColor = "#d1d5db";
      });

      // Re-add the keypress and click listeners
      newInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          sendMessage(newInput.value);
          newInput.value = "";
        }
      });

      // Re-add send button click listener
      const newSendBtn = document.getElementById("send-btn");
      if (newSendBtn) {
        newSendBtn.addEventListener("click", () => {
          sendMessage(newInput.value);
          newInput.value = "";
        });
      }
    }

    console.log(
      "Appearance settings applied successfully with primary color:",
      config.primaryColor,
      "and secondary color:",
      config.secondaryColor
    );
  }

  // Clear conversation
  async function clearConversation() {
    if (!sessionId) return;

    try {
      await fetch(`${config.baseUrl}/api/chat/session/${sessionId}`, {
        method: "DELETE",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      });

      sessionId = null;
      const clearBtn = document.getElementById("clear-btn");
      if (clearBtn) clearBtn.style.display = "none";

      // Clear messages and add welcome message
      const messagesArea = document.getElementById("user-chatbot-messages");
      if (messagesArea) {
        messagesArea.innerHTML = "";
        const welcomeText = chatbotConfig
          ? `Hello! 👋 I'm your ${chatbotConfig.companyName} assistant. How can I help you today?`
          : config.greeting;
        addMessage(welcomeText, "bot");
      }

      messages = [];
    } catch (error) {
      console.error("Error clearing conversation:", error);
    }
  }

  // Add CSS styles
  function addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes typing-bounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-8px); }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      #user-ai-chatbot-widget .typing-dot {
        animation: typing-bounce 1.4s infinite ease-in-out;
      }
      
      #user-ai-chatbot-widget .typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      #user-ai-chatbot-widget .typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      #user-ai-chatbot-widget button:hover {
        transform: scale(1.05);
      }
      
      #user-ai-chatbot-widget #send-btn:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transform: scale(1.05);
      }
      
      #user-ai-chatbot-widget #clear-btn:hover,
      #user-ai-chatbot-widget #close-btn:hover {
        background: rgba(255,255,255,0.25) !important;
      }
      
      #user-chatbot-messages {
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 transparent;
      }
      
      #user-chatbot-messages::-webkit-scrollbar {
        width: 6px;
      }
      
      #user-chatbot-messages::-webkit-scrollbar-track {
        background: transparent;
      }
      
      #user-chatbot-messages::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }
      
      #user-chatbot-messages::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
      
      /* Mobile Responsive Design */
      @media (max-width: 480px) {
        #user-ai-chatbot-widget {
          right: 10px !important;
          left: 10px !important;
          bottom: 10px !important;
        }
        
        #user-chatbot-window {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          border-radius: 0 !important;
          max-width: none !important;
          max-height: none !important;
          border: none !important;
        }
        
        #user-chatbot-header {
          border-radius: 0 !important;
          padding: 16px !important;
        }
        
        #user-chatbot-input {
          border-radius: 0 !important;
          padding: 16px !important;
        }
        
        #user-chatbot-toggle {
          bottom: 20px !important;
          right: 20px !important;
          width: 50px !important;
          height: 50px !important;
        }
        
        #user-chatbot-toggle svg {
          width: 20px !important;
          height: 20px !important;
        }
      }
      
      /* Tablet Responsive Design */
      @media (min-width: 481px) and (max-width: 768px) {
        #user-chatbot-window {
          width: 360px !important;
          height: 500px !important;
          bottom: 80px !important;
        }
        
        #user-ai-chatbot-widget {
          right: 15px !important;
          bottom: 15px !important;
        }
      }
      
      /* Desktop Responsive Design */
      @media (min-width: 769px) and (max-width: 1024px) {
        #user-chatbot-window {
          width: 370px !important;
          height: 520px !important;
        }
      }
      
      /* Large Desktop */
      @media (min-width: 1025px) {
        #user-chatbot-window {
          width: 380px !important;
          height: 550px !important;
        }
      }
      
      /* Landscape Mobile */
      @media (max-height: 500px) and (orientation: landscape) {
        #user-chatbot-window {
          height: 90vh !important;
          width: 350px !important;
        }
      }
      
      /* High DPI Displays */
      @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
        #user-chatbot-toggle {
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        
        #user-chatbot-window {
          box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        }
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
       
       
        
        #message-input::placeholder {
          color: #9ca3af !important;
        }
      }
      
      /* Accessibility improvements */
      @media (prefers-reduced-motion: reduce) {
        #user-ai-chatbot-widget * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
      
      /* Focus styles for accessibility */
      #user-ai-chatbot-widget button:focus,
      #message-input:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* Print styles */
      @media print {
        #user-ai-chatbot-widget {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Auto-initialize when script loads
  function autoInit() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        console.log('DOM loaded, initializing chatbot...');
        setTimeout(() => {
          initializeConfig();
          createChatBotWidget();
        }, 500); // Increased delay to ensure all scripts are loaded and processed
      });
    } else {
      console.log('DOM already ready, initializing chatbot...');
      setTimeout(() => {
        initializeConfig();
        createChatBotWidget();
      }, 500); // Increased delay to ensure all scripts are loaded and processed
    }
  }

  // Initialize
  autoInit();

  // Expose global function for manual initialization
  window.initUserAIChatBot = function (customConfig) {
    if (customConfig) {
      config = { ...config, ...customConfig };
    }
    return createChatBotWidget();
  };
})();
