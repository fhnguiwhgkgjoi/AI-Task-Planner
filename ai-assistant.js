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
// LANGUAGE DETECTOR
// ============================================
class LanguageDetector {
    constructor() {
        this.languages = {
            tagalog: {
                codes: ['tl', 'fil'],
                keywords: ['ako', 'mo', 'natin', 'yan', 'naman', 'talaga', 'kasi', 'lang', 'pano', 'ano', 'saan', 'kailan'],
                commonWords: ['ang', 'sa', 'ng', 'da', 'ba', 'pa', 'na', 'rin']
            },
            spanish: {
                codes: ['es', 'es-ES', 'es-MX'],
                keywords: ['estoy', 'está', 'ayuda', 'gracias', 'por favor', 'quiero', 'necesito', 'cómo', 'qué', 'dónde'],
                commonWords: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un']
            },
            french: {
                codes: ['fr', 'fr-FR'],
                keywords: ['je', 'tu', 'il', 'aide', 'merci', 'veux', 'besoin', 'comment', 'quoi', 'où'],
                commonWords: ['le', 'la', 'de', 'et', 'à', 'un', 'est']
            },
            german: {
                codes: ['de', 'de-DE'],
                keywords: ['ich', 'du', 'hilfe', 'danke', 'möchte', 'brauche', 'wie', 'was', 'wo'],
                commonWords: ['der', 'die', 'das', 'und', 'ein', 'ist']
            },
            portuguese: {
                codes: ['pt', 'pt-BR', 'pt-PT'],
                keywords: ['eu', 'você', 'me', 'ajuda', 'obrigado', 'quero', 'preciso', 'como', 'o que', 'onde'],
                commonWords: ['o', 'a', 'de', 'que', 'e', 'um', 'para']
            },
            japanese: {
                codes: ['ja'],
                keywords: ['です', 'ます', 'ください', 'ありがとう', 'すみません', 'わかりません', 'どうしよう'],
                commonWords: ['の', 'に', 'は', 'を', 'た', 'が', 'で']
            },
            korean: {
                codes: ['ko'],
                keywords: ['입니다', '것', '모르겠습니다', '도움', '감사합니다', '필요', '어떻게'],
                commonWords: ['이', '그', '저', '것', '수', '있', '있지']
            },
            chinese: {
                codes: ['zh', 'zh-CN', 'zh-TW'],
                keywords: ['我', '你', '他', '帮助', '谢谢', '想', '需要', '怎么', '什么', '哪里'],
                commonWords: ['的', '一', '是', '在', '不', '了', '有']
            },
            english: {
                codes: ['en', 'en-US', 'en-GB'],
                keywords: ['i', 'you', 'help', 'please', 'thank', 'want', 'need', 'how', 'what', 'where'],
                commonWords: ['the', 'a', 'is', 'and', 'to', 'of', 'in']
            }
        };
    }

    detect(text) {
        if (!text || text.trim().length === 0) {
            return { language: 'english', code: 'en', confidence: 0 };
        }

        const lowerText = text.toLowerCase();
        let detectedLanguage = 'english';
        let maxScore = 0;

        for (const [lang, data] of Object.entries(this.languages)) {
            let score = 0;

            // Check keywords (more weight)
            for (const keyword of data.keywords) {
                if (lowerText.includes(keyword)) score += 3;
            }

            // Check common words (less weight)
            for (const word of data.commonWords) {
                if (lowerText.includes(word)) score += 1;
            }

            if (score > maxScore) {
                maxScore = score;
                detectedLanguage = lang;
            }
        }

        return {
            language: detectedLanguage,
            code: this.languages[detectedLanguage].codes[0],
            confidence: Math.min(maxScore / 20, 1)
        };
    }
}

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
                keywords: {
                    english: ['plan', 'organize', 'schedule', 'deadline', 'project', 'task', 'break down', 'submit', 'organize', 'schedule', 'tasks'],
                    tagalog: ['plano', 'organize', 'deadline', 'tasks', 'gagawin', 'kailangan', 'project', 'submit'],
                    spanish: ['plan', 'organizar', 'agenda', 'plazo', 'proyecto', 'tarea', 'organizar'],
                    french: ['plan', 'organiser', 'calendrier', 'échéance', 'projet', 'tâche'],
                    portuguese: ['plano', 'organizar', 'agenda', 'prazo', 'projeto', 'tarefa'],
                    japanese: ['計画', '整理', 'スケジュール', '期限', 'プロジェクト', 'タスク'],
                    korean: ['계획', '정리', '일정', '마감', '프로젝트', '작업'],
                    chinese: ['计划', '组织', '日程', '截止', '项目', '任务'],
                    german: ['plan', 'organisieren', 'zeitplan', 'frist', 'projekt', 'aufgabe']
                },
                response: 'task_planning'
            },
            emotional_support: {
                keywords: {
                    english: ['feel', 'sad', 'happy', 'stressed', 'anxious', 'tired', 'overwhelmed', 'frustrated', 'emotion'],
                    tagalog: ['stressed', 'anxious', 'overwhelmed', 'hindi ko kaya', 'nakakapagod', 'down', 'malungkot', 'nasasa', 'worried'],
                    spanish: ['triste', 'feliz', 'estresado', 'ansioso', 'cansado', 'abrumado', 'frustrado'],
                    french: ['triste', 'heureux', 'stressé', 'anxieux', 'fatigué', 'accablé', 'frustré'],
                    portuguese: ['triste', 'feliz', 'estressado', 'ansioso', 'cansado', 'sobrecarregado', 'frustrado'],
                    japanese: ['悲しい', '幸せ', 'ストレス', '不安', '疲れた', 'ショック', 'イライラ'],
                    korean: ['슬프다', '행복하다', '스트레스', '불안', '피곤하다', '압도', '짜증'],
                    chinese: ['难过', '开心', '压力', '焦虑', '疲劳', '不堪重负', '沮丧'],
                    german: ['traurig', 'glücklich', 'gestresst', 'ängstlich', 'müde', 'überwältigt', 'frustriert']
                },
                response: 'emotional_support'
            },
            productivity: {
                keywords: {
                    english: ['focus', 'concentrate', 'distracted', 'procrastinate', 'lazy', 'motivation', 'energy'],
                    tagalog: ['focus', 'productive', 'concentrate', 'hindi makafocus', 'tamad', 'walang motivation', 'lazy'],
                    spanish: ['enfoque', 'concentrarse', 'distraído', 'procrastinar', 'perezoso', 'motivación'],
                    french: ['focus', 'se concentrer', 'distrait', 'procrastiner', 'paresseux', 'motivation'],
                    portuguese: ['foco', 'concentrar', 'distraído', 'procrastinar', 'preguiçoso', 'motivação'],
                    japanese: ['集中', '専念', '注意散漫', '先延ばし', '怠け', 'モチベーション'],
                    korean: ['집중', '집중하다', '산만', '미루다', '게으르다', '동기'],
                    chinese: ['集中', '专注', '分心', '拖延', '懒散', '动力'],
                    german: ['fokus', 'konzentrieren', 'abgelenkt', 'aufschieben', 'faul', 'motivation']
                },
                response: 'productivity'
            },
            learning: {
                keywords: {
                    english: ['learn', 'study', 'understand', 'explain', 'how to', 'teach', 'course', 'education'],
                    tagalog: ['aral', 'study', 'maintindihan', 'turuan', 'pano', 'school', 'subject'],
                    spanish: ['aprender', 'estudiar', 'entender', 'explicar', 'enseñar', 'curso', 'educación'],
                    french: ['apprendre', 'étudier', 'comprendre', 'expliquer', 'enseigner', 'cours', 'éducation'],
                    portuguese: ['aprender', 'estudar', 'entender', 'explicar', 'ensinar', 'curso', 'educação'],
                    japanese: ['学習', '勉強', '理解', '説明', '教える', 'コース'],
                    korean: ['학습', '공부', '이해', '설명', '가르치다', '과정'],
                    chinese: ['学习', '学习', '理解', '解释', '教', '课程', '教育'],
                    german: ['lernen', 'studieren', 'verstehen', 'erklären', 'unterrichten', 'kurs']
                },
                response: 'learning'
            },
            general: {
                keywords: {
                    english: ['hello', 'hi', 'how are you', 'help', 'what'],
                    tagalog: ['hey', 'sup', 'kumusta', 'hi', 'hello'],
                    spanish: ['hola', 'cómo estás', 'ayuda', 'qué'],
                    french: ['bonjour', 'comment allez-vous', 'aide', 'quoi'],
                    portuguese: ['olá', 'como vai', 'ajuda', 'o que'],
                    japanese: ['こんにちは', 'お疲れ', '助け', 'なに'],
                    korean: ['안녕하세요', '어떻게', '도움', '뭐'],
                    chinese: ['你好', '你好吗', '帮助', '什么'],
                    german: ['hallo', 'wie geht', 'hilfe', 'was']
                },
                response: 'general'
            }
        };
    }

    detect(userInput, language = 'english') {
        const lowerInput = userInput.toLowerCase();
        let detectedIntent = 'general';
        let maxMatches = 0;

        for (const [intent, data] of Object.entries(this.intents)) {
            let matches = 0;
            const keywords = data.keywords[language] || data.keywords.english;
            
            for (const keyword of keywords) {
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
                keywords: {
                    english: ['stressed', 'anxious', 'panic', 'worry', 'nervous', 'pressure'],
                    tagalog: ['stressed', 'anxious', 'walang peace of mind', 'kailan ko tatapusin'],
                    spanish: ['estresado', 'ansioso', 'pánico', 'preocupado', 'nervioso', 'presión'],
                    french: ['stressé', 'anxieux', 'panique', 'inquiet', 'nerveux', 'pression'],
                    portuguese: ['estressado', 'ansioso', 'pânico', 'preocupado', 'nervoso', 'pressão'],
                    japanese: ['ストレス', '不安', 'パニック', '心配', '緊張', '圧力'],
                    korean: ['스트레스', '불안', '공황', '걱정', '긴장', '압박'],
                    chinese: ['压力', '焦虑', '恐慌', '担心', '紧张', '压力'],
                    german: ['gestresst', 'ängstlich', 'panik', 'sorge', 'nervös', 'druck']
                },
                emoji: '😰',
                color: '#ff6b6b'
            },
            overwhelmed: {
                keywords: {
                    english: ['overwhelmed', 'too much', 'can\'t handle', 'drowning', 'chaos'],
                    tagalog: ['overwhelmed', 'sobrang dami', 'hindi ko kaya', 'talo ako'],
                    spanish: ['abrumado', 'demasiado', 'no puedo', 'caos'],
                    french: ['accablé', 'trop', 'ne peux pas', 'chaos'],
                    portuguese: ['sobrecarregado', 'demais', 'não posso', 'caos'],
                    japanese: ['圧倒', '多すぎ', 'できない', 'カオス'],
                    korean: ['압도', '너무', '할 수 없다', '혼란'],
                    chinese: ['不堪重负', '太多', '无法处理', '混乱'],
                    german: ['überwältigt', 'zu viel', 'kann nicht', 'chaos']
                },
                emoji: '😵',
                color: '#ff8c42'
            },
            tired: {
                keywords: {
                    english: ['tired', 'exhausted', 'fatigue', 'sleep', 'drained', 'sleepy'],
                    tagalog: ['pagod', 'nakakapagod', 'dead', 'walang energy'],
                    spanish: ['cansado', 'agotado', 'fatiga', 'sueño', 'drenado'],
                    french: ['fatigue', 'épuisé', 'fatigue', 'sommeil', 'drainé'],
                    portuguese: ['cansado', 'exausto', 'fadiga', 'sono', 'esgotado'],
                    japanese: ['疲れた', '疲労', '睡眠', 'エネルギー消耗'],
                    korean: ['피곤하다', '피로', '수면', '에너지 소모'],
                    chinese: ['累', '疲惫', '疲劳', '睡眠', '耗尽'],
                    german: ['müde', 'erschöpft', 'müdigkeit', 'schlaf', 'erschöpft']
                },
                emoji: '😴',
                color: '#95a5a6'
            },
            happy: {
                keywords: {
                    english: ['happy', 'excited', 'great', 'awesome', 'love', 'wonderful'],
                    tagalog: ['masaya', 'excited', 'super', 'ganda'],
                    spanish: ['feliz', 'emocionado', 'genial', 'increíble', 'amor', 'maravilloso'],
                    french: ['heureux', 'excité', 'super', 'incroyable', 'amour', 'merveilleux'],
                    portuguese: ['feliz', 'animado', 'ótimo', 'incrível', 'amor', 'maravilhoso'],
                    japanese: ['幸せ', '興奮', '素晴らしい', '素敵', '愛', '素晴らしい'],
                    korean: ['행복한', '흥분', '좋은', '멋진', '사랑', '놀라운'],
                    chinese: ['开心', '兴奋', '很好', '很棒', '爱', '美妙'],
                    german: ['glücklich', 'aufgeregt', 'großartig', 'toll', 'liebe', 'wunderbar']
                },
                emoji: '😊',
                color: '#f39c12'
            },
            sad: {
                keywords: {
                    english: ['sad', 'depressed', 'down', 'unhappy', 'miserable'],
                    tagalog: ['sad', 'malungkot', 'down', 'heartbroken', 'broken'],
                    spanish: ['triste', 'deprimido', 'desgraciado', 'infeliz'],
                    french: ['triste', 'déprimé', 'malheureux', 'misérable'],
                    portuguese: ['triste', 'deprimido', 'infeliz', 'miserável'],
                    japanese: ['悲しい', '落ち込んだ', '不幸', '惨めな'],
                    korean: ['슬프다', '우울', '불행', '비참한'],
                    chinese: ['难过', '沮丧', '不幸', '悲惨'],
                    german: ['traurig', 'deprimiert', 'unglücklich', 'elend']
                },
                emoji: '😢',
                color: '#3498db'
            },
            frustrated: {
                keywords: {
                    english: ['frustrated', 'angry', 'irritated', 'annoyed', 'fed up'],
                    tagalog: ['frustrated', 'nakakirot', 'galit', 'nag-iwan', 'nag-give up'],
                    spanish: ['frustrado', 'enojado', 'irritado', 'incómodo', 'harto'],
                    french: ['frustré', 'en colère', 'irrité', 'agacé', 'rempli'],
                    portuguese: ['frustrado', 'zangado', 'irritado', 'incomodado', 'cheio'],
                    japanese: ['フラストレーション', '怒った', 'イライラ', '不快'],
                    korean: ['좌절', '화난', '짜증', '짜증'],
                    chinese: ['沮丧', '生气', '烦躁', '厌烦'],
                    german: ['frustriert', 'wütend', 'gereizt', 'genervt', 'kotzt']
                },
                emoji: '😤',
                color: '#e74c3c'
            }
        };
    }

    detect(text, language = 'english') {
        if (!text || text.trim().length === 0) {
            return { emotion: 'neutral', emoji: '😐', color: '#60a5ff' };
        }

        const lowerText = text.toLowerCase();
        let detected = { emotion: 'neutral', emoji: '😐', color: '#60a5ff' };
        let maxScore = 0;

        for (const [emotionKey, emotionData] of Object.entries(this.emotions)) {
            let score = 0;
            const keywords = emotionData.keywords[language] || emotionData.keywords.english;
            
            for (const keyword of keywords) {
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
    constructor(huggingFaceService, intentDetector, emotionDetector, languageDetector) {
        this.hfService = huggingFaceService;
        this.intentDetector = intentDetector;
        this.emotionDetector = emotionDetector;
        this.languageDetector = languageDetector;
        this.history = [];
        this.maxHistoryLength = 5;
        this.currentLanguage = 'english';
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
        // Detect language, intent and emotion
        const langDetection = this.languageDetector.detect(userInput);
        this.currentLanguage = langDetection.language;

        const intent = this.intentDetector.detect(userInput, this.currentLanguage);
        const emotion = this.emotionDetector.detect(userInput, this.currentLanguage);

        // Add user message to history
        this.addMessage(userInput, 'user');

        // Generate context-aware prompt
        const contextPrompt = this.buildContextPrompt(userInput, intent, emotion, this.currentLanguage);
        const history = this.getFormattedHistory();

        try {
            // Get AI response
            let response = await this.hfService.generateResponse(contextPrompt, history);

            // Add assistant message to history
            this.addMessage(response, 'assistant');

            return {
                response,
                intent: intent.intent,
                emotion: emotion.emoji,
                emotionType: emotion.emotion,
                language: this.currentLanguage
            };
        } catch (error) {
            console.log('⚠️ AI API failed, using demo mode responses...');
            
            // Fallback: Generate intelligent response from intent/emotion
            const demoResponse = this.generateDemoResponse(userInput, intent, emotion, this.currentLanguage);
            this.addMessage(demoResponse, 'assistant');

            return {
                response: demoResponse,
                intent: intent.intent,
                emotion: emotion.emoji,
                emotionType: emotion.emotion,
                language: this.currentLanguage
            };
        }
    }

    generateDemoResponse(userInput, intent, emotion, language = 'english') {
        const responses = {
            task_planning: {
                english: [
                    "Alright! Let's break this down into smaller pieces. What's your first move?",
                    "I can help organize that. What matters most to you right now?",
                    "Let's do this! When do you need it done?",
                    "Cool, cool. Let me help map out the main steps. What's the core of it?"
                ],
                tagalog: [
                    "Ay, okay lang yan! Gawin nating simple lang - break it down into smaller chunks na kaya mo. Anong first step mo?",
                    "Sige, pwede ko i-organize yan para sa'yo. Ano ba ang most important part? Prioritize natin 'yun.",
                    "Nice, nice! Kailangan mo talagang mag-set ng timeline. Kailan mo dapat tapos 'yan?",
                    "Oo naman! Let me help you map this out - what are the main components? Sabihin mo lang."
                ],
                spanish: [
                    "¡Claro! Desglosemos esto en partes más pequeñas. ¿Cuál es tu primer paso?",
                    "Puedo ayudarte a organizar eso. ¿Qué es lo más importante ahora?",
                    "¡Vamos! ¿Cuándo lo necesitas?",
                    "Bien, bien. Ayúdame a trazar los pasos principales. ¿Cuál es lo esencial?"
                ],
                french: [
                    "D'accord! Décomposons cela en petites parties. Quel est votre premier pas?",
                    "Je peux vous aider à l'organiser. Qu'est-ce qui est le plus important maintenant?",
                    "Allons-y! Quand en avez-vous besoin?",
                    "Bien, bien. Aidez-moi à tracer les étapes principales. Quel est l'essentiel?"
                ],
                portuguese: [
                    "Claro! Vamos dividir isso em partes menores. Qual é seu primeiro passo?",
                    "Posso ajudá-lo a organizar isso. O que é mais importante agora?",
                    "Vamos! Quando você precisa?",
                    "Bem, bem. Ajude-me a traçar os passos principais. Qual é o essencial?"
                ],
                japanese: [
                    "わかりました！これをより小さな部分に分割しましょう。最初のステップは何ですか？",
                    "それを整理するのを手伝うことができます。今何が最も重要ですか？",
                    "さあ！いつ必要ですか？",
                    "よし、よし。主な手順をトレースするのを手伝ってください。本質は何ですか？"
                ],
                korean: [
                    "알겠습니다! 이것을 더 작은 부분으로 나누어서 생각해봅시다. 첫 번째 단계는 무엇인가요?",
                    "그것을 정리하는 데 도움을 드릴 수 있습니다. 지금 가장 중요한 것은 무엇인가요?",
                    "시작해봅시다! 언제까지 필요하신가요?",
                    "좋아요, 좋아요. 주요 단계를 추적하는 데 도움을 주세요. 핵심은 무엇인가요?"
                ],
                chinese: [
                    "好的！让我们把这个分解成更小的部分。你的第一步是什么？",
                    "我可以帮你组织这个。现在什么最重要？",
                    "走起！你什么时候需要？",
                    "好的，好的。让我帮你追踪主要步骤。本质是什么？"
                ],
                german: [
                    "Alles klar! Lassen Sie uns dies in kleinere Teile aufteilen. Was ist Ihr erster Schritt?",
                    "Ich kann Ihnen dabei helfen, das zu organisieren. Was ist jetzt am wichtigsten?",
                    "Los geht's! Wann brauchst du es?",
                    "Gut, gut. Helfen Sie mir, die Hauptschritte zu verfolgen. Was ist das Wesentliche?"
                ]
            },
            emotional_support: {
                english: [
                    "I see you, that sounds really tough. What would help you most right now?",
                    "It's totally normal to feel like this. What do you need from me?",
                    "Your feelings matter. Let's focus on what you can do.",
                    "I'm here for you. What's weighing on you?"
                ],
                tagalog: [
                    "Yaya, nakikita ko yan. Heavy talaga 'yan, di ba? What do you need right now? Talk to me.",
                    "Ayaw mo mag-alala - normal lang yan, karamihan namin nararanasan yan. Ano ang kailangan mo?",
                    "Totoo yan feelings mo, walang problema dyan. Focus tayo sa mga kaya nating gawin, okay?",
                    "Nandito ako para sa'yo, bestie. Sabi mo lang kung ano ang nasa isip mo."
                ],
                spanish: [
                    "Te veo, eso suena muy difícil. ¿Qué te ayudaría más ahora?",
                    "Es totalmente normal sentirse así. ¿Qué necesitas de mí?",
                    "Tus sentimientos importan. Centrémonos en lo que puedes hacer.",
                    "Estoy aquí para ti. ¿Qué te preocupa?"
                ],
                french: [
                    "Je te vois, ça semble vraiment dur. Qu'est-ce qui t'aiderait le plus maintenant?",
                    "C'est totalement normal de se sentir ainsi. Qu'as-tu besoin de moi?",
                    "Tes sentiments comptent. Concentrons-nous sur ce que tu peux faire.",
                    "Je suis là pour toi. Qu'est-ce qui te préoccupe?"
                ],
                portuguese: [
                    "Eu te vejo, isso parece muito difícil. O que mais o ajudaria agora?",
                    "É totalmente normal se sentir assim. O que você precisa de mim?",
                    "Seus sentimentos importam. Vamos focar no que você pode fazer.",
                    "Estou aqui para você. O que o preocupa?"
                ],
                japanese: [
                    "あなたを見ています、それは本当に難しいと思いますね。今、あなたを最も助けるものは何ですか？",
                    "このように感じるのは完全に普通です。私から何が必要ですか？",
                    "あなたの気持ちは大切です。あなたができることに焦点を当てましょう。",
                    "あなたのためにここにいます。あなたを心配させているのは何ですか？"
                ],
                korean: [
                    "당신을 보고 있습니다. 정말 힘들어 보이네요. 지금 당신을 가장 도와줄 수 있는 것은 무엇일까요?",
                    "이렇게 느끼는 것은 완전히 정상입니다. 당신은 저에게서 무엇이 필요하신가요?",
                    "당신의 감정은 중요합니다. 당신이 할 수 있는 것에 집중해봅시다.",
                    "당신을 위해 여기 있습니다. 당신을 걱정하게 하는 것은 무엇인가요?"
                ],
                chinese: [
                    "我看到你了，这听起来真的很难。现在什么对你帮助最大？",
                    "有这种感觉是完全正常的。你需要我什么?",
                    "你的感情很重要。让我们专注于你能做的事情。",
                    "我在这里。你担心的是什么?"
                ],
                german: [
                    "Ich sehe dich, das klingt wirklich schwierig. Was hilft dir jetzt am meisten?",
                    "Sich so zu fühlen ist völlig normal. Was brauchst du von mir?",
                    "Deine Gefühle sind wichtig. Konzentrieren wir uns auf das, was du tun kannst.",
                    "Ich bin für dich da. Was macht dir Sorgen?"
                ]
            },
            productivity: {
                english: [
                    "Let's boost your focus! Try working in 25-minute bursts. It really works.",
                    "Energy management is key. When do you feel most productive?",
                    "Start small, build momentum. What's one tiny task you can do?",
                    "What's your biggest blocker right now? Let's tackle it first."
                ],
                tagalog: [
                    "Gaya-gaya! Let's get you focused. Try mo mag-work in 25-minute bursts lang - Pomodoro style. Works like magic, swear.",
                    "Energy management ang key dito, bro. Kailan ka usually ma-productive? Morning person ka ba?",
                    "Real talk - ang momentum lang ang kailangan mo. Start with smallest task, then snowball nalang.",
                    "What's your biggest blocker ngayon? Let's tackle that first, then rolling na tayo."
                ],
                spanish: [
                    "¡Aumentemos tu enfoque! Intenta trabajar en ráfagas de 25 minutos. Realmente funciona.",
                    "La gestión de la energía es clave. ¿Cuándo te sientes más productivo?",
                    "Empieza pequeño, construye impulso. ¿Cuál es una pequeña tarea que puedes hacer?",
                    "¿Cuál es tu mayor obstáculo ahora? Abordémoslo primero."
                ],
                french: [
                    "Augmentons votre concentration! Essayez de travailler par rafales de 25 minutes. Ça marche vraiment.",
                    "La gestion de l'énergie est essentielle. Quand vous sentez-vous plus productif?",
                    "Commencez petit, construisez de l'élan. Quelle est une petite tâche que vous pouvez faire?",
                    "Quel est votre plus grand obstacle maintenant? Abordons-le en premier."
                ],
                portuguese: [
                    "Vamos aumentar seu foco! Tente trabalhar em rajadas de 25 minutos. Funciona realmente.",
                    "A gestão de energia é fundamental. Quando você se sente mais produtivo?",
                    "Comece pequeno, construa impulso. Qual é uma pequena tarefa que você pode fazer?",
                    "Qual é seu maior obstáculo agora? Vamos abordá-lo primeiro."
                ],
                japanese: [
                    "フォーカスを高めましょう！25分単位で作業してみてください。本当に効きます。",
                    "エネルギー管理が重要です。いつが最も生産性を感じますか？",
                    "小さく始める、勢いをつける。できる小さなタスクは何ですか？",
                    "今、最大の障害は何ですか？まずそれに対処しましょう。"
                ],
                korean: [
                    "포커스를 높이자! 25분 단위로 일해보세요. 정말 효과가 있습니다.",
                    "에너지 관리가 핵심입니다. 언제 가장 생산성을 느끼시나요?",
                    "작게 시작하세요, 추진력을 만드세요. 할 수 있는 작은 작업이 무엇인가요?",
                    "지금 가장 큰 장애물은 무엇인가요? 먼저 그것을 다루어 봅시다."
                ],
                chinese: [
                    "让我们提高您的专注力！尝试以25分钟为单位工作。真的有效。",
                    "能量管理是关键。你什么时候感到最有效率？",
                    "从小开始，建立动力。你能做的一个小任务是什么？",
                    "你现在最大的障碍是什么？让我们先处理它。"
                ],
                german: [
                    "Erhöhen wir deinen Fokus! Versuchen Sie, in 25-Minuten-Blöcken zu arbeiten. Es funktioniert wirklich.",
                    "Energiemanagement ist der Schlüssel. Wann fühlen Sie sich am produktivsten?",
                    "Klein anfangen, Schwung aufbauen. Was ist eine kleine Aufgabe, die du tun kannst?",
                    "Was ist dein größtes Hindernis jetzt? Gehen Sie es zuerst an."
                ]
            },
            learning: {
                english: [
                    "Great question! Let me explain this step by step, okay?",
                    "I love this topic! Want a deep dive or just the basics?",
                    "You know what, let's start with the fundamentals. Ready?",
                    "Excellent! There's so much connected to this. What interests you most?"
                ],
                tagalog: [
                    "Ayy, maganda ang tanong! Let me break it down para sa'yo step by step, okay?",
                    "Ooh, interesting topic 'yan talaga! Gusto mo ng deep dive, or surface level lang?",
                    "You know what, kailangan muna natin malaman ang basics. Ready ka ba? Let's go.",
                    "Solid question yan! Maraming related concepts dyan. Which part interests you most?"
                ],
                spanish: [
                    "¡Gran pregunta! Déjame explicar esto paso a paso, ¿está bien?",
                    "¡Me encanta este tema! ¿Quieres profundizar o solo lo básico?",
                    "Sabes qué, comencemos con lo fundamental. ¿Listo?",
                    "¡Excelente! Hay tanto conectado a esto. ¿Qué te interesa más?"
                ],
                french: [
                    "Excellente question! Laissez-moi expliquer cela étape par étape, d'accord?",
                    "J'adore ce sujet! Voulez-vous un approfondissement ou juste les bases?",
                    "Tu sais, commençons par les principes fondamentaux. Prêt?",
                    "Excellent! Il y a beaucoup de choses connectées à cela. Qu'est-ce qui t'intéresse le plus?"
                ],
                portuguese: [
                    "Ótima pergunta! Deixe-me explicar isso passo a passo, tudo bem?",
                    "Eu adoro este tópico! Quer um mergulho profundo ou apenas o básico?",
                    "Sabe, vamos começar com o fundamental. Pronto?",
                    "Excelente! Há muito ligado a isso. O que te interessa mais?"
                ],
                japanese: [
                    "素晴らしい質問！これをステップバイステップで説明させてください、大丈夫ですか？",
                    "このトピックが大好きです！詳しく知りたいですか、それとも基本だけですか？",
                    "あなたは何を知っていますか、基本から始めましょう。準備はいいですか？",
                    "素晴らしい！これには非常に多くのことが関連しています。あなたが最も興味を持っているのは何ですか？"
                ],
                korean: [
                    "좋은 질문입니다! 이것을 단계별로 설명해드리겠습니다. 괜찮으신가요?",
                    "난 이 주제를 사랑합니다! 깊이 있는 설명을 원하시나요, 아니면 기본만?",
                    "알다시피, 기초부터 시작합시다. 준비됐나요?",
                    "훌륭합니다! 이것과 관련된 많은 것들이 있습니다. 무엇이 가장 관심을 띠나요?"
                ],
                chinese: [
                    "很好的问题！让我一步步为你解释，好吗？",
                    "我喜欢这个话题！你想深入学习还是只要基础知识？",
                    "你知道吗，让我们从基础开始。准备好了吗？",
                    "太好了！有很多东西与此相关。你最感兴趣的是什么？"
                ],
                german: [
                    "Großartige Frage! Lassen Sie mich dies Schritt für Schritt erklären, einverstanden?",
                    "Ich liebe dieses Thema! Möchten Sie einen tieferen Einblick oder nur die Grundlagen?",
                    "Weißt du was, fangen wir mit den Grundlagen an. Bereit?",
                    "Ausgezeichnet! Es gibt so viel, das damit verbunden ist. Was interessiert dich am meisten?"
                ]
            },
            general: {
                english: [
                    "Hey there! I'm all ears. What's going on?",
                    "Always happy to chat! What's on your mind?",
                    "Hey! Got something to talk about? I'm here.",
                    "What's up? Tell me what's happening."
                ],
                tagalog: [
                    "Ayy, halo ako! Nandito ako para sa'yo. What's going on sa head mo right now?",
                    "Yo! Always ready to listen. Ano ba ang nasa isip mo?",
                    "Hey! Meron ka ba problema or just wanna chat? Tell me lang.",
                    "Ey, sup! What can I do for you ngayon? Say mo lang."
                ],
                spanish: [
                    "¡Hola! Tengo los oídos abiertos. ¿Qué pasa?",
                    "¡Siempre feliz de charlar! ¿Qué está en tu mente?",
                    "¡Oye! ¿Tienes algo de lo que hablar? Estoy aquí.",
                    "¿Qué tal? Cuéntame qué está pasando."
                ],
                french: [
                    "Salut! Je suis tout ouïe. Qu'est-ce qu'il y a?",
                    "Toujours heureux de discuter! Qu'est-ce qui te préoccupe?",
                    "Hé! Tu as quelque chose dont parler? Je suis là.",
                    "Quoi de neuf? Dis-moi ce qui se passe."
                ],
                portuguese: [
                    "Oi! Estou todo ouvidos. O que está acontecendo?",
                    "Sempre feliz em conversar! O que você tem em mente?",
                    "Opa! Tem algo para falar? Estou aqui.",
                    "E aí? Conte-me o que está acontecendo."
                ],
                japanese: [
                    "やあ！耳を傾けています。何が起こっていますか？",
                    "いつでも喜んでチャットします！何が考えていますか？",
                    "ちょっと！話すことがありますか？ここにいます。",
                    "どうしたんですか？何が起こっているか教えてください。"
                ],
                korean: [
                    "안녕하세요! 귀 기울여 듣겠습니다. 무슨 일인가요?",
                    "항상 기꺼이 대화합니다! 무엇이 생각나세요?",
                    "이봐요! 할 말이 있으신가요? 저 여기 있습니다.",
                    "뭐가 좋아요? 무슨 일이 일어나고 있는지 알려주세요."
                ],
                chinese: [
                    "嘿! 我洗耳恭听。怎么了？",
                    "总是很乐意聊天！你的想法是什么？",
                    "嘿！有话要说吗？我在这。",
                    "怎么样？告诉我发生了什么。"
                ],
                german: [
                    "Hallo! Ich bin ganz Ohr. Was ist los?",
                    "Immer glücklich zu plaudern! Was beschäftigt dich?",
                    "Hey! Hast du etwas zum Reden? Ich bin hier.",
                    "Was ist los? Sag mir, was passiert."
                ]
            }
        };

        const responseList = responses[intent.intent]?.[language] || responses[intent.intent]?.['english'] || responses.general[language] || responses.general['english'];
        const randomIndex = Math.floor(Math.random() * responseList.length);
        return responseList[randomIndex];
    }

    buildContextPrompt(userInput, intent, emotion, language = 'english') {
        const intentContext = {
            task_planning: 'Help organize tasks and create action plans. Be casual, friendly',
            emotional_support: 'Provide empathetic and supportive responses. Be like a good friend - understanding, real, no corporate talk.',
            productivity: 'Give tips and strategies to improve focus and productivity. Be encouraging but realistic.',
            learning: 'Explain concepts clearly and help with learning. Make it relatable and not boring.',
            general: 'Be helpful and conversational. Talk like a real person - friendly, understanding. Ask follow-up questions sometimes.'
        };

        const languageInstructions = {
            english: 'Respond in English. Be conversational and natural.',
            tagalog: 'Respond in natural Taglish (Filipino-English mix). Use real conversational tone, not formal.',
            spanish: 'Responde en español. Sé conversacional e natural.',
            french: 'Répondez en français. Soyez conversationnel et naturel.',
            portuguese: 'Responda em português. Seja conversacional e natural.',
            japanese: '日本語で応答してください。 会話的で自然です。',
            korean: '한국어로 응답하세요. 대화형이고 자연스럽습니다.',
            chinese: '用中文回复。 交谈自然。',
            german: 'Antworten Sie auf Deutsch. Seien Sie gesprächig und natürlich.'
        };

        return `You are a helpful, friendly AI assistant. ${intentContext[intent.intent] || intentContext.general} ${languageInstructions[language] || languageInstructions.english}

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
        this.languageDetector = new LanguageDetector();
        this.intentDetector = new IntentDetector();
        this.emotionDetector = new EmotionDetector();
        this.conversationManager = new ConversationManager(
            this.hfService,
            this.intentDetector,
            this.emotionDetector,
            this.languageDetector
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
