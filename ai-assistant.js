// ============================================
// AI-POWERED ASSISTANT WITH HUGGING FACE API
// ============================================

// ============================================
// API CONFIGURATION
// ============================================
const API_CONFIG = {
    ENDPOINT: 'https://api-inference.huggingface.co/models/gpt2',
    API_KEY: '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', // Replace with your API key from huggingface.co
    TIMEOUT: 30000, // 30 seconds
    MAX_TOKENS: 150,
    TEMPERATURE: 0.7
};

// ============================================
// HUGGING FACE API SERVICE
// ============================================
class HuggingFaceService {
    constructor(config) {
        this.endpoint = config.ENDPOINT;
        this.apiKey = config.API_KEY;
        this.timeout = config.TIMEOUT;
        this.maxTokens = config.MAX_TOKENS;
        this.temperature = config.TEMPERATURE;
    }

    validateConfig() {
        if (this.apiKey === 'YOUR_HUGGING_FACE_API_KEY_HERE' || !this.apiKey) {
            throw new Error('⚠️ Oops! API key not set pa. Set mo ang key mo sa AI_CONFIG.API_KEY, okay?');
        }
    }

    async generateResponse(prompt, conversationHistory = '') {
        this.validateConfig();

        try {
            // First, try calling the local backend
            try {
                const response = await this.fetchWithTimeout('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: prompt,
                        history: conversationHistory
                    })
                }, 10000); // Shorter timeout for local server

                if (response.ok) {
                    const data = await response.json();
                    if (data.response) {
                        return data.response;
                    }
                }
            } catch (localError) {
                console.log('📡 Local backend not available, trying direct API call...');
            }

            // Fallback: Call Hugging Face API directly
            console.log('🌐 Calling Hugging Face API directly...');
            
            const fullPrompt = conversationHistory 
                ? `${conversationHistory}\nUser: ${prompt}\nAssistant:` 
                : prompt;

            const response = await this.fetchWithTimeout('https://api-inference.huggingface.co/models/gpt2', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: fullPrompt,
                    parameters: {
                        max_new_tokens: 100,
                        temperature: 0.7,
                        do_sample: true
                    }
                })
            }, this.timeout);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                if (response.status === 401) {
                    throw new Error('❌ Invalid API Key');
                } else if (response.status === 429) {
                    throw new Error('⏳ Rate limited. Please wait.');
                }
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            
            if (Array.isArray(data) && data[0]?.generated_text) {
                let text = data[0].generated_text.trim();
                text = text.replace(/User:|Assistant:/g, '').trim();
                text = text.substring(0, 500);
                return text || 'Naintindihan ko yan. What else is on your mind?';
            }
            
            throw new Error('Invalid response format');

        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    cleanResponse(text) {
        // Remove extra whitespace and newlines
        text = text.replace(/\n+/g, ' ').trim();
        
        // Remove common artifacts
        text = text.replace(/User:|Assistant:/g, '').trim();
        
        // Limit to reasonable length
        const sentences = text.match(/[^.!?]*[.!?]+/g) || [text];
        const response = sentences.slice(0, 3).join(' ').trim();
        
        return response || 'Got it. Anything else? Tell me lang what else is on your mind 😊';
    }

    async fetchWithTimeout(url, options, timeoutMs) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Please try again.');
            }
            throw error;
        }
    }
}

// ============================================
// INTENT DETECTOR
// ============================================
class IntentDetector {
    constructor() {
        this.intents = {
            task_planning: {
                keywords: ['plan', 'organize', 'schedule', 'deadline', 'project', 'task', 'organize', 'break down', 'submit', 'deadline', 'plano', 'organize', 'schedule', 'tasks'],
                response: 'Okay, let me help you organize yan! '
            },
            emotional_support: {
                keywords: ['feel', 'sad', 'happy', 'stressed', 'anxious', 'tired', 'overwhelmed', 'frustrated', 'emotion', 'stressed', 'anxious', 'overwhelmed', 'hindi ko kaya', 'nakakapagod', 'down', 'malungkot'],
                response: 'Ay, nakikita ko yan. '
            },
            productivity: {
                keywords: ['focus', 'concentrate', 'distracted', 'procrastinate', 'lazy', 'motivation', 'energy', 'focus', 'productive', 'concentrate', 'hindi makafocus', 'tamad', 'walang motivation'],
                response: 'Let\'s get you productive! '
            },
            learning: {
                keywords: ['learn', 'study', 'understand', 'explain', 'how to', 'teach', 'course', 'education', 'aral', 'study', 'maintindihan'],
                response: 'Maganda question yan! '
            },
            general: {
                keywords: ['hello', 'hi', 'how are you', 'help', 'what', 'hey', 'sup', 'kumusta'],
                response: 'Hey! '
            }
        };
    }

    detect(userInput) {
        const lowerInput = userInput.toLowerCase();
        let detectedIntent = 'general';
        let maxMatches = 0;

        for (const [intent, data] of Object.entries(this.intents)) {
            let matches = 0;
            for (const keyword of data.keywords) {
                if (lowerInput.includes(keyword)) {
                    matches++;
                }
            }

            if (matches > maxMatches) {
                maxMatches = matches;
                detectedIntent = intent;
            }
        }

        return {
            intent: detectedIntent,
            prefix: this.intents[detectedIntent].response,
            confidence: Math.min(maxMatches / 2, 1)
        };
    }
}

// ============================================
// EMOTION DETECTOR
// ============================================
class EmotionDetector {
    constructor() {
        this.emotions = {
            stressed: {
                keywords: ['stressed', 'anxious', 'panic', 'worry', 'nervous', 'pressure', 'stress', 'nerstress', 'anxious', 'walang peace of mind', 'kailan ko tatapusin'],
                emoji: '😰',
                color: '#ff6b6b'
            },
            overwhelmed: {
                keywords: ['overwhelmed', 'too much', 'can\'t handle', 'drowning', 'chaos', 'overwhelmed', 'sobrang dami', 'hindi ko kaya', 'talo ako'],
                emoji: '😵',
                color: '#ff8c42'
            },
            tired: {
                keywords: ['tired', 'exhausted', 'fatigue', 'sleep', 'drained', 'sleepy', 'pagod', 'nakakapagod', 'dead', 'walang energy'],
                emoji: '😴',
                color: '#95a5a6'
            },
            happy: {
                keywords: ['happy', 'excited', 'great', 'awesome', 'love', 'wonderful', 'masaya', 'excited', 'super', 'ganda'],
                emoji: '😊',
                color: '#f39c12'
            },
            sad: {
                keywords: ['sad', 'depressed', 'down', 'unhappy', 'miserable', 'sad', 'malungkot', 'down', 'heartbroken', 'broken'],
                emoji: '😢',
                color: '#3498db'
            },
            frustrated: {
                keywords: ['frustrated', 'angry', 'irritated', 'annoyed', 'fed up', 'frustrated', 'nakakirot', 'galit', 'nag-iwan', 'nag-give up'],
                emoji: '😤',
                color: '#e74c3c'
            }
        };
    }

    detect(text) {
        if (!text || text.trim().length === 0) {
            return { emotion: 'neutral', emoji: '😐', color: '#60a5ff' };
        }

        const lowerText = text.toLowerCase();
        let detected = { emotion: 'neutral', emoji: '😐', color: '#60a5ff' };
        let maxScore = 0;

        for (const [emotionKey, emotionData] of Object.entries(this.emotions)) {
            let score = 0;
            for (const keyword of emotionData.keywords) {
                if (lowerText.includes(keyword)) score++;
            }

            if (score > maxScore) {
                maxScore = score;
                detected = {
                    emotion: emotionKey,
                    emoji: emotionData.emoji,
                    color: emotionData.color
                };
            }
        }

        return detected;
    }
}

// ============================================
// CONVERSATION MANAGER
// ============================================
class ConversationManager {
    constructor(huggingFaceService, intentDetector, emotionDetector) {
        this.hfService = huggingFaceService;
        this.intentDetector = intentDetector;
        this.emotionDetector = emotionDetector;
        this.history = [];
        this.maxHistoryLength = 5;
    }

    addMessage(text, role) {
        this.history.push({ text, role });
        if (this.history.length > this.maxHistoryLength * 2) {
            this.history = this.history.slice(-this.maxHistoryLength * 2);
        }
    }

    getFormattedHistory() {
        return this.history
            .slice(-this.maxHistoryLength)
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
            .join('\n');
    }

    async generateResponse(userInput) {
        // Detect intent and emotion
        const intent = this.intentDetector.detect(userInput);
        const emotion = this.emotionDetector.detect(userInput);

        // Add user message to history
        this.addMessage(userInput, 'user');

        // Generate context-aware prompt
        const contextPrompt = this.buildContextPrompt(userInput, intent, emotion);
        const history = this.getFormattedHistory();

        try {
            // Get AI response
            let response = await this.hfService.generateResponse(contextPrompt, history);

            // Add context prefix if confidence is high
            if (intent.confidence > 0.5) {
                response = intent.prefix + response;
            }

            // Add assistant message to history
            this.addMessage(response, 'assistant');

            return {
                response,
                intent: intent.intent,
                emotion: emotion.emoji,
                emotionType: emotion.emotion
            };
        } catch (error) {
            console.log('⚠️ AI API failed, using demo mode responses...');
            
            // Fallback: Generate intelligent response from intent/emotion
            const demoResponse = this.generateDemoResponse(userInput, intent, emotion);
            this.addMessage(demoResponse, 'assistant');

            return {
                response: demoResponse,
                intent: intent.intent,
                emotion: emotion.emoji,
                emotionType: emotion.emotion
            };
        }
    }

    generateDemoResponse(userInput, intent, emotion) {
        const responses = {
            task_planning: [
                "Ay, okay lang yan! Gawin nating simple lang - break it down into smaller chunks na kaya mo. Anong first step mo?",
                "Sige, pwede ko i-organize yan para sa'yo. Ano ba ang most important part? Prioritize natin 'yun.",
                "Nice, nice! Kailangan mo talagang mag-set ng timeline. Kailan mo dapat tapos 'yan?",
                "Oo naman! Let me help you map this out - what are the main components? Sabihin mo lang."
            ],
            emotional_support: [
                "Yaya, nakikita ko yan. Heavy talaga 'yan, di ba? What do you need right now? Talk to me.",
                "Ayaw mo mag-alala - normal lang yan, karamihan namin nararanasan yan. Ano ang kailangan mo?",
                "Totoo yan feelings mo, walang problema dyan. Focus tayo sa mga kaya nating gawin, okay?",
                "Nandito ako para sa'yo, bestie. Sabi mo lang kung ano ang nasa isip mo."
            ],
            productivity: [
                "Gaya-gaya! Let's get you focused. Try mo mag-work in 25-minute bursts lang - Pomodoro style. Works like magic, swear.",
                "Energy management ang key dito, bro. Kailan ka usually ma-productive? Morning person ka ba?",
                "Real talk - ang momentum lang ang kailangan mo. Start with smallest task, then snowball nalang.",
                "What's your biggest blocker ngayon? Let's tackle that first, then rolling na tayo."
            ],
            learning: [
                "Ayy, maganda ang tanong! Let me break it down para sa'yo step by step, okay?",
                "Ooh, interesting topic 'yan talaga! Gusto mo ng deep dive, or surface level lang?",
                "You know what, kailangan muna natin malaman ang basics. Ready ka ba? Let's go.",
                "Solid question yan! Maraming related concepts dyan. Which part interests you most?"
            ],
            general: [
                "Ayy, halo ako! Nandito ako para sa'yo. What's going on sa head mo right now?",
                "Yo! Always ready to listen. Ano ba ang nasa isip mo?",
                "Hey! Meron ka ba problema or just wanna chat? Tell me lang.",
                "Ey, sup! What can I do for you ngayon? Say mo lang."
            ]
        };

        const responseList = responses[intent.intent] || responses.general;
        const randomIndex = Math.floor(Math.random() * responseList.length);
        return responseList[randomIndex];
    }

    buildContextPrompt(userInput, intent, emotion) {
        const intentContext = {
            task_planning: 'Help organize tasks and create action plans. Be casual, friendly, use natural Filipino-English mix (Taglish). Give practical advice.',
            emotional_support: 'Provide empathetic and supportive responses. Be like a good friend - understanding, real, no corporate talk.',
            productivity: 'Give tips and strategies to improve focus and productivity. Be encouraging but realistic. Use conversational Taglish.',
            learning: 'Explain concepts clearly and help with learning. Make it relatable and not boring. Be like a friend explaining something, not a textbook.',
            general: 'Be helpful and conversational. Talk like a real person - friendly, understanding, maybe use some Taglish. Ask follow-up questions sometimes.'
        };

        return `You are a helpful, friendly AI assistant that speaks like a real person. You use natural Taglish (Filipino-English mix) in a conversational way - not robotic or formal. ${intentContext[intent.intent] || intentContext.general} Be genuine, sometimes ask follow-up questions to understand better.

User: ${userInput}
Assistant:`;
    }

    clearHistory() {
        this.history = [];
    }
}

// ============================================
// UI CONTROLLER
// ============================================
class UIController {
    constructor() {
        this.messagesContainer = null;
        this.userInput = null;
        this.sendBtn = null;
        this.emotionIndicator = null;
        this.isLoading = false;
    }

    initialize() {
        this.messagesContainer = document.getElementById('messagesContainer');
        this.userInput = document.getElementById('userThought');
        this.sendBtn = document.getElementById('generateBtn');
        this.emotionIndicator = document.getElementById('emotionIndicator');

        if (!this.messagesContainer || !this.userInput || !this.sendBtn) {
            console.error('❌ Required DOM elements not found');
            return false;
        }

        return true;
    }

    addMessage(content, type, metadata = {}) {
        if (!this.messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        if (typeof content === 'string') {
            contentDiv.innerHTML = content;
        } else {
            contentDiv.appendChild(content);
        }

        messageDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(messageDiv);

        // Add metadata if provided (e.g., emotion, intent)
        if (Object.keys(metadata).length > 0) {
            const metaDiv = document.createElement('div');
            metaDiv.className = 'message-meta';
            if (metadata.emotion) {
                metaDiv.innerHTML = `<small>${metadata.emotion} ${metadata.emotionType}</small>`;
            }
            messageDiv.appendChild(metaDiv);
        }

        // Auto scroll to bottom
        setTimeout(() => {
            const chatArea = this.messagesContainer.parentElement;
            if (chatArea) {
                chatArea.scrollTop = chatArea.scrollHeight;
            }
        }, 100);
    }

    showLoading() {
        this.isLoading = true;
        this.sendBtn.disabled = true;
        this.sendBtn.textContent = '⏳';

        const typingDiv = document.createElement('div');
        typingDiv.id = 'typingIndicator';
        typingDiv.className = 'message bot-message';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
        contentDiv.style.padding = '12px 20px';
        
        typingDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(typingDiv);

        // Scroll to typing indicator
        setTimeout(() => {
            const chatArea = this.messagesContainer.parentElement;
            if (chatArea) {
                chatArea.scrollTop = chatArea.scrollHeight;
            }
        }, 50);
    }

    hideLoading() {
        this.isLoading = false;
        this.sendBtn.disabled = false;
        this.sendBtn.textContent = '→';

        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    updateEmotionIndicator(emoji, emotionType) {
        if (!this.emotionIndicator) return;
        
        this.emotionIndicator.textContent = emoji;
        this.emotionIndicator.title = emotionType;
        this.emotionIndicator.style.animation = 'pulse 0.5s ease-out';
        
        setTimeout(() => {
            this.emotionIndicator.style.animation = '';
        }, 500);
    }

    clearInput() {
        if (this.userInput) {
            this.userInput.value = '';
            this.autoResize();
            this.userInput.focus();
        }
    }

    autoResize() {
        if (!this.userInput) return;
        this.userInput.style.height = 'auto';
        this.userInput.style.height = Math.min(this.userInput.scrollHeight, 120) + 'px';
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message bot-message error-message';
        errorDiv.innerHTML = `<div class="message-content" style="background: rgba(255, 107, 107, 0.2); border-left: 3px solid #ff6b6b;">${message}</div>`;
        this.messagesContainer.appendChild(errorDiv);

        setTimeout(() => {
            const chatArea = this.messagesContainer.parentElement;
            if (chatArea) {
                chatArea.scrollTop = chatArea.scrollHeight;
            }
        }, 100);
    }

    formatResponse(response) {
        // Format with proper line breaks and emphasis
        return response
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }
}

// ============================================
// MAIN APPLICATION
// ============================================
class AIAssistant {
    constructor() {
        this.hfService = new HuggingFaceService(API_CONFIG);
        this.intentDetector = new IntentDetector();
        this.emotionDetector = new EmotionDetector();
        this.conversationManager = new ConversationManager(
            this.hfService,
            this.intentDetector,
            this.emotionDetector
        );
        this.uiController = new UIController();
    }

    async initialize() {
        console.log('🚀 Initializing AI Assistant...');

        // Initialize UI
        if (!this.uiController.initialize()) {
            console.error('Failed to initialize UI');
            return;
        }

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.attachEventListeners());
        } else {
            this.attachEventListeners();
        }

        // Check API key
        if (API_CONFIG.API_KEY === 'YOUR_HUGGING_FACE_API_KEY_HERE') {
            this.uiController.showError('⚠️ Oops! May setup pa - kindly set up your Hugging Face API key sa AI_CONFIG.API_KEY. Get one for free dito: https://huggingface.co/settings/tokens. Easy lang!');
        }

        console.log('✅ AI Assistant initialized');
    }

    attachEventListeners() {
        const { sendBtn, userInput } = this.uiController;

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.handleSendMessage());
        }

        if (userInput) {
            userInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.handleSendMessage();
                }
            });
            userInput.addEventListener('input', () => this.uiController.autoResize());
        }

        console.log('✅ Event listeners attached');
    }

    async handleSendMessage() {
        const userText = this.uiController.userInput.value.trim();

        if (!userText) {
            this.uiController.userInput.focus();
            return;
        }

        if (this.uiController.isLoading) {
            return; // Prevent multiple requests
        }

        // Add user message to UI
        this.uiController.addMessage(userText, 'user');
        this.uiController.clearInput();

        // Show loading indicator
        this.uiController.showLoading();

        try {
            // Generate AI response
            const result = await this.conversationManager.generateResponse(userText);

            // Update emotion indicator
            this.uiController.updateEmotionIndicator(result.emotion, result.emotionType);

            // Hide loading and show response with typing effect
            this.uiController.hideLoading();
            await this.typeMessage(result.response);

        } catch (error) {
            this.uiController.hideLoading();
            console.error('Error:', error);
            
            let errorMessage = error.message;
            if (error.message.includes('Invalid API Key')) {
                errorMessage = '❌ Oops, may problema sa API key. Check mo lang kung correct ang key mo, okay?';
            } else if (error.message.includes('timeout')) {
                errorMessage = '⏳ Taking a bit too long - try again lang, bro.';
            }

            this.uiController.showError(errorMessage);
        }
    }

    async typeMessage(message, speed = 20) {
        const formattedMessage = this.uiController.formatResponse(message);
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.style.minHeight = '20px';

        messageDiv.appendChild(contentDiv);
        this.uiController.messagesContainer.appendChild(messageDiv);

        // Typing effect
        let index = 0;
        const chars = formattedMessage.split('');

        return new Promise((resolve) => {
            const typeNextChar = () => {
                if (index < chars.length) {
                    contentDiv.innerHTML = this.sanitizeHTML(chars.slice(0, ++index).join(''));
                    
                    // Auto scroll
                    const chatArea = this.uiController.messagesContainer.parentElement;
                    if (chatArea) {
                        chatArea.scrollTop = chatArea.scrollHeight;
                    }

                    setTimeout(typeNextChar, speed);
                } else {
                    resolve();
                }
            };

            typeNextChar();
        });
    }

    sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    reset() {
        this.conversationManager.clearHistory();
        this.uiController.messagesContainer.innerHTML = '';
        this.uiController.clearInput();
        console.log('✅ Conversation cleared');
    }
}

// ============================================
// INITIALIZE APPLICATION
// ============================================
let aiAssistant;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        aiAssistant = new AIAssistant();
        aiAssistant.initialize();
    });
} else {
    aiAssistant = new AIAssistant();
    aiAssistant.initialize();
}

console.log('✅ AI Assistant script loaded');
