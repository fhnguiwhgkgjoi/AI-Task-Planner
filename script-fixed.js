// ============================================
// ADVANCED AI TASK PLANNER WITH NLP - FIXED
// ============================================

// Advanced NLP Emotion Detection System
class EmotionDetector {
    constructor() {
        this.emotions = {
            stressed: {
                keywords: ['stressed', 'anxious', 'panic', 'worry', 'nervous', 'tense', 'pressure', 'stress'],
                strength: ['very stressed', 'extremely anxious', 'total panic', 'so stressed'],
                emoji: '😰',
                color: '#ff6b6b',
                type: 'urgent'
            },
            overwhelmed: {
                keywords: ['overwhelmed', 'too much', 'can\'t handle', 'drowning', 'chaos', 'crazy', 'insane'],
                strength: ['completely overwhelmed', 'totally drowning'],
                emoji: '😵',
                color: '#ff8c42',
                type: 'urgent'
            },
            tired: {
                keywords: ['tired', 'exhausted', 'fatigue', 'sleep', 'drained', 'burnt', 'sleepy', 'dead'],
                strength: ['so tired', 'completely exhausted', 'dead inside'],
                emoji: '😴',
                color: '#95a5a6',
                type: 'recovery'
            },
            lazy: {
                keywords: ['lazy', 'demotivated', 'can\'t focus', 'procrastinating', 'unmotivated', 'no energy'],
                strength: ['so lazy', 'completely unmotivated'],
                emoji: '😑',
                color: '#bdc3c7',
                type: 'motivation'
            },
            sad: {
                keywords: ['sad', 'depressed', 'down', 'unhappy', 'miserable', 'heartbroken', 'blue', 'low'],
                strength: ['so sad', 'deeply depressed', 'completely broken'],
                emoji: '😢',
                color: '#3498db',
                type: 'emotional'
            },
            confused: {
                keywords: ['confused', 'lost', 'don\'t know', 'unclear', 'uncertain', 'stuck', 'bewildered'],
                strength: ['so confused', 'totally lost', 'completely stuck'],
                emoji: '😕',
                color: '#9b59b6',
                type: 'clarity'
            },
            frustrated: {
                keywords: ['frustrated', 'angry', 'irritated', 'annoyed', 'fed up', 'pissed', 'mad', 'furious'],
                strength: ['so frustrated', 'really angry', 'completely furious'],
                emoji: '😤',
                color: '#e74c3c',
                type: 'urgent'
            },
            hopeful: {
                keywords: ['hopeful', 'excited', 'motivated', 'ready', 'pumped', 'determined', 'confident'],
                strength: ['very excited', 'super motivated', 'unstoppable'],
                emoji: '🔥',
                color: '#f39c12',
                type: 'positive'
            }
        };
    }

    detect(text) {
        if (!text || text.trim().length === 0) {
            return { emotion: 'neutral', emoji: '😐', color: '#60a5ff', confidence: 0.5, type: 'neutral' };
        }

        const lowerText = text.toLowerCase();
        let detected = { emotion: 'neutral', emoji: '😐', color: '#60a5ff', confidence: 0, type: 'neutral' };
        let maxScore = 0;

        for (const [emotionKey, emotionData] of Object.entries(this.emotions)) {
            let score = 0;
            
            // Strength keywords count more (×3)
            for (const keyword of emotionData.strength || []) {
                if (lowerText.includes(keyword)) score += 3;
            }
            
            // Regular keywords count as ×1
            for (const keyword of emotionData.keywords) {
                if (lowerText.includes(keyword)) score += 1;
            }

            if (score > maxScore) {
                maxScore = score;
                detected = {
                    emotion: emotionKey,
                    emoji: emotionData.emoji,
                    color: emotionData.color,
                    confidence: Math.min(score / 10, 1),
                    type: emotionData.type
                };
            }
        }

        return detected;
    }
}

// AI Task Planner - Generates personalized action plans
class AITaskPlanner {
    constructor() {
        this.emotionDetector = new EmotionDetector();
        this.conversationHistory = [];
    }

    generatePlan(input, emotion) {
        this.conversationHistory.push(input);

        return {
            interpretation: this.interpretEmotion(emotion),
            breakdown: this.createBreakdown(input, emotion),
            schedule: this.createSchedule(emotion),
            mistakes: this.getCommonMistakes(emotion),
            motivation: this.generateMotivation(emotion),
            firstStep: this.getFirstStep(emotion)
        };
    }

    interpretEmotion(emotion) {
        const interpretations = {
            stressed: `I can feel the pressure you're under. Let's break this down into manageable pieces so it feels less overwhelming.`,
            overwhelmed: `You're carrying too much right now. We'll focus on ONE priority and ignore everything else for now.`,
            tired: `Your body is telling you something important—rest is self-care. Let's work WITH your energy level.`,
            lazy: `Motivation follows action, not the other way around. Let's start tiny and build momentum.`,
            sad: `I hear you. Sometimes we need to move through sadness gently. Small wins can help shift things.`,
            confused: `Clarity will come through action. Let's break down the confusion into simple, clear steps.`,
            frustrated: `That frustration is fuel. Let's channel it into focused, productive action.`,
            hopeful: `Love the energy! Let's capitalize on your momentum and make real progress TODAY.`,
            neutral: `Let's turn that thought into a solid, actionable plan.`
        };

        return interpretations[emotion.emotion] || interpretations.neutral;
    }

    createBreakdown(input, emotion) {
        if (input.match(/study|exam|homework|school|learn|class/i)) {
            return [
                '📚 Pick ONE subject to focus on',
                '⏱️ Use 25-minute Pomodoro sessions',
                '✍️ Take active notes (summarize, don\'t just read)',
                '🔄 Review & test yourself after each section',
                '💪 Build consistent study habit tomorrow'
            ];
        }

        if (input.match(/work|project|deadline|coding|design|job|boss|meeting/i)) {
            return [
                '✅ Break project into 3-5 concrete tasks',
                '🎯 Prioritize by deadline and impact',
                '🚀 Start with the easiest win to build momentum',
                '🔗 Complete one piece at a time',
                '📊 Track progress as you go'
            ];
        }

        if (input.match(/exercise|workout|gym|fitness|run|walk/i)) {
            return [
                '💪 Start small (15 mins is enough)',
                '🎯 Pick one type of exercise',
                '⏰ Same time each day builds habit',
                '🎉 Celebrate the habit, not just the results',
                '📈 Increase intensity next week'
            ];
        }

        if (emotion.emotion === 'overwhelmed' || emotion.emotion === 'stressed') {
            return [
                '🧘 Take 5 deep breaths RIGHT NOW',
                '📝 Brain dump: write everything down',
                '🎯 Pick just ONE thing for TODAY',
                '⏰ Work on it for 30 mins max',
                '🎉 Celebrate this single win'
            ];
        }

        if (emotion.emotion === 'tired' || emotion.emotion === 'lazy') {
            return [
                '😴 Sleep is your #1 priority tonight',
                '💧 Hydrate: drink water NOW',
                '🚶 Move your body for 5 mins',
                '🎯 Do ONE tiny task (2 mins max)',
                '🔋 Rest without guilt'
            ];
        }

        return [
            '🔍 Identify the core problem clearly',
            '🔨 Break into small concrete tasks',
            '🥇 Start with the easiest piece',
            '⚡ Build momentum from small wins',
            '📈 Scale up as you gain confidence'
        ];
    }

    createSchedule(emotion) {
        const schedules = {
            overwhelmed: [
                { time: '0 min', task: 'Breathe & ground yourself' },
                { time: '5 min', task: 'Brain dump everything' },
                { time: '10 min', task: 'Identify ONE priority' },
                { time: '20 min', task: 'Work on just that ONE thing' },
                { time: '25 min', task: 'Take a break & celebrate' }
            ],
            exhausted: [
                { time: 'Now', task: 'Rest - no guilt' },
                { time: 'Later today', task: 'Tiny 5-min task' },
                { time: 'Tomorrow', task: 'Full session' },
                { time: 'This week', task: 'Build back momentum' }
            ],
            stressed: [
                { time: 'First', task: 'Pause & ground yourself (3 mins)' },
                { time: 'Then', task: 'Break work into chunks (5 mins)' },
                { time: 'Start', task: '25-min focused session' },
                { time: 'After', task: '5-min break & review progress' }
            ]
        };

        return schedules[emotion.emotion] || [
            { time: 'Start', task: 'Prepare workspace' },
            { time: '5 min in', task: 'Get into flow' },
            { time: '25 min', task: 'Work session' },
            { time: '30 min', task: 'Break & reflect' }
        ];
    }

    getCommonMistakes(emotion) {
        const mistakes = {
            overwhelmed: [
                'Trying to do everything at once',
                'No clear priority (do ALL the things)',
                'Expecting perfection on first try',
                'Taking too many breaks',
                'Comparing with others\' progress'
            ],
            lazy: [
                'Waiting for motivation to strike',
                'All-or-nothing thinking',
                'Huge tasks instead of tiny steps',
                'No rewards for small wins',
                'Environment full of distractions'
            ],
            stressed: [
                'Not taking breaks (burnout incoming)',
                'Perfectionism over progress',
                'Ignoring physical needs (food, water, sleep)',
                'Multitasking everything',
                'No strategic break timing'
            ]
        };

        return mistakes[emotion.emotion] || [
            'Starting too big',
            'No clear system',
            'Forgetting to celebrate small wins',
            'Comparing to others',
            'No built-in breaks'
        ];
    }

    generateMotivation(emotion) {
        const motivations = {
            stressed: 'You\'ve handled tough situations before. This is manageable. One step at a time.',
            overwhelmed: 'You don\'t need to do it all today. Just ONE priority. You\'ve got this.',
            tired: 'Rest IS productive. Your body knows what it needs. Honor that.',
            lazy: 'Motivation comes AFTER you start, not before. Just 5 minutes. That\'s all.',
            sad: 'Small wins add up. You\'re stronger than you think. Keep going gently.',
            confused: 'Clarity comes through action. Start simple, refine as you go.',
            frustrated: 'That frustration? Channel it. You\'re about to crush this.',
            hopeful: 'This is YOUR momentum. Let\'s make it count. Go go go!',
            neutral: 'You\'ve got this. Let\'s turn thoughts into actions. Go!'
        };

        return motivations[emotion.emotion] || 'You can do this. One step at a time.';
    }

    getFirstStep(emotion) {
        const steps = {
            stressed: '⏰ Set one timer for 30 mins and commit to just that block.',
            overwhelmed: '📝 Write down EVERYTHING in your head to get it out.',
            tired: '😴 Commit to 8 hours sleep tonight. Everything else can wait.',
            lazy: '⏱️ Set a timer for 5 minutes. Start the smallest task. Just 5 minutes.',
            sad: '🎯 Do ONE small thing that usually makes you feel better.',
            confused: '🤔 Write down the main question. Answer it in ONE sentence.',
            frustrated: '💪 Channel this energy. Pick your #1 priority and attack it.',
            hopeful: '🚀 Strike while the iron\'s hot. Start RIGHT NOW.',
            neutral: '✍️ Write down your one concrete next action in 5 words.'
        };

        return `<strong>👉 Your First Move:</strong> ${steps[emotion.emotion] || 'Start with one tiny action right now.'}`;
    }
}

// Initialize
let planner;
let messagesContainer;
let userInput;
let sendBtn;
let emotionIndicator;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

function initializeApp() {
    // Get DOM elements
    messagesContainer = document.getElementById('messagesContainer');
    userInput = document.getElementById('userThought');
    sendBtn = document.getElementById('generateBtn');
    emotionIndicator = document.getElementById('emotionIndicator');

    // Check if elements exist
    if (!sendBtn || !userInput || !messagesContainer) {
        console.error('❌ Critical elements not found in DOM');
        return;
    }

    // Create planner instance
    planner = new AITaskPlanner();

    // Attach event listeners
    sendBtn.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keydown', handleKeydown);
    userInput.addEventListener('input', autoResizeTextarea);

    console.log('✅ AI Task Planner initialized successfully!');
}

function handleKeydown(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
        handleSendMessage();
    }
}

function handleSendMessage() {
    if (!userInput || !planner) return;

    const text = userInput.value.trim();
    if (!text) {
        userInput.focus();
        return;
    }

    // Add user message
    addMessage(text, 'user');

    // Detect emotion
    const emotion = planner.emotionDetector.detect(text);
    updateEmotionIndicator(emotion);

    // Show typing indicator
    showTypingIndicator();

    // Generate AI response after delay
    setTimeout(() => {
        removeTypingIndicator();
        const plan = planner.generatePlan(text, emotion);
        const response = formatPlanAsMessage(plan);
        addMessage(response, 'bot');
    }, 800);

    // Clear input
    userInput.value = '';
    autoResizeTextarea();
    userInput.focus();
}

function addMessage(content, type) {
    if (!messagesContainer) return;

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
    messagesContainer.appendChild(messageDiv);

    // Auto scroll to bottom
    setTimeout(() => {
        const chatArea = messagesContainer.parentElement;
        if (chatArea) {
            chatArea.scrollTop = chatArea.scrollHeight;
        }
    }, 100);
}

function formatPlanAsMessage(plan) {
    return `
        <p style="margin: 0 0 12px 0; font-weight: 500;"><strong>📋 ${plan.interpretation}</strong></p>
        
        <p style="margin: 12px 0 8px 0; font-weight: 600;">🎯 Action Breakdown:</p>
        <ol style="margin: 0 0 12px 0; margin-left: 20px; padding: 0;">
            ${plan.breakdown.map(step => `<li style="margin: 4px 0;">${step}</li>`).join('')}
        </ol>
        
        <p style="margin: 12px 0 8px 0; font-weight: 600;">⏰ Schedule:</p>
        <div style="margin-bottom: 12px;">
            ${plan.schedule.map(s => `
                <div style="margin: 6px 0; padding: 8px; background: rgba(96,165,255,0.1); border-left: 3px solid #60a5ff; border-radius: 4px;">
                    <strong style="color: #60a5ff;">${s.time}:</strong> ${s.task}
                </div>
            `).join('')}
        </div>
        
        <p style="margin: 12px 0 8px 0; font-weight: 600;">🚫 Common Mistakes to Avoid:</p>
        <ul style="margin: 0 0 12px 0; margin-left: 20px; padding: 0;">
            ${plan.mistakes.map(mistake => `<li style="margin: 4px 0; color: #ff6b6b;">${mistake}</li>`).join('')}
        </ul>
        
        <p style="margin: 12px 0 0 0; font-size: 1em; font-style: italic; padding: 10px; background: rgba(245,215,0,0.1); border-radius: 6px; color: #f39c12;">
            <strong>💪 ${plan.motivation}</strong>
        </p>
        
        <div style="margin-top: 12px; padding: 12px; background: rgba(245,87,108,0.1); border-radius: 6px; border-left: 3px solid #f5576c;">
            <strong style="color: #f5576c; font-size: 1.05em;">${plan.firstStep}</strong>
        </div>
    `;
}

function showTypingIndicator() {
    if (!messagesContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicator';
    typingDiv.className = 'message bot-message';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
    
    typingDiv.appendChild(contentDiv);
    messagesContainer.appendChild(typingDiv);

    setTimeout(() => {
        const chatArea = messagesContainer.parentElement;
        if (chatArea) {
            chatArea.scrollTop = chatArea.scrollHeight;
        }
    }, 100);
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function updateEmotionIndicator(emotion) {
    if (!emotionIndicator) return;
    
    emotionIndicator.textContent = emotion.emoji;
    emotionIndicator.style.borderColor = emotion.color;
    emotionIndicator.style.background = `rgba(${hexToRgb(emotion.color)}, 0.2)`;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '96, 165, 255';
}

function autoResizeTextarea() {
    if (!userInput) return;
    
    userInput.style.height = 'auto';
    const newHeight = Math.min(userInput.scrollHeight, 120);
    userInput.style.height = newHeight + 'px';
}

console.log('✅ AI Task Planner script loaded successfully');
