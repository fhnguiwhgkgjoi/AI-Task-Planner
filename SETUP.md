# 🤖 AI Assistant Setup Guide

## Overview
This AI assistant is now powered by Hugging Face's GPT-2 model using their inference API. It features:
- ✅ Real AI-powered responses via Hugging Face API
- ✅ Intent detection (task planning, emotional support, productivity, learning)
- ✅ Emotion recognition
- ✅ Conversation history management
- ✅ Typing effect and loading indicators
- ✅ Mobile-optimized interface
- ✅ Error handling and timeouts
- ✅ Modular, easy-to-understand code

## Getting Started

### Step 1: Get a Hugging Face API Key

1. Go to https://huggingface.co/settings/tokens
2. Click "New token"
3. Give it a name (e.g., "AI Assistant")
4. Select "Read" permission
5. Click "Generate token"
6. Copy the token

### Step 2: Configure API Key

**Option A: Direct Configuration (Development)**
```javascript
// In ai-assistant.js, find this section:
const API_CONFIG = {
    ENDPOINT: 'https://api-inference.huggingface.co/models/gpt2',
    API_KEY: 'YOUR_HUGGING_FACE_API_KEY_HERE', // ← Replace with your token
    TIMEOUT: 30000,
    MAX_TOKENS: 150,
    TEMPERATURE: 0.7
};
```

Replace `'YOUR_HUGGING_FACE_API_KEY_HERE'` with your token.

**Option B: Environment Variable (Production)**
You would need a backend to securely store the API key. For now, use Option A for development.

### Step 3: Test the Setup

1. Open `index.html` in your browser
2. Type a message and hit Ctrl+Enter or click the send button
3. You should see a loading indicator (⏳)
4. The AI will respond within 30 seconds

## Features Explained

### 🧠 Intent Detection
The system automatically detects what you want:
- **Task Planning**: Messages about organizing, scheduling, projects
- **Emotional Support**: Messages about feelings and emotions
- **Productivity**: Messages about focus, concentration, motivation
- **Learning**: Messages asking for explanations
- **General**: Casual conversation

### 😊 Emotion Recognition
Detects emotional keywords and updates the indicator emoji:
- 😰 Stressed
- 😵 Overwhelmed
- 😴 Tired
- 😊 Happy
- 😢 Sad

### 💬 Conversation Management
- Maintains last 5 conversation turns in context
- Uses history to provide coherent responses
- Clear history between sessions

### ⌨️ User Interactions
- **Send**: Click button or Ctrl+Enter
- **Typing Effect**: Smooth character-by-character display
- **Mobile**: Fully responsive touch-friendly interface

## Code Architecture

### Classes Overview

#### `HuggingFaceService`
Handles API communication
```javascript
const hf = new HuggingFaceService(API_CONFIG);
const response = await hf.generateResponse('Hello!', conversationHistory);
```

#### `IntentDetector`
Identifies user intent
```javascript
const detector = new IntentDetector();
const intent = detector.detect('I need to organize my tasks');
// Returns: { intent: 'task_planning', prefix: '...', confidence: 0.8 }
```

#### `EmotionDetector`
Recognizes emotions
```javascript
const emotions = new EmotionDetector();
const emotion = emotions.detect('I feel stressed');
// Returns: { emotion: 'stressed', emoji: '😰', color: '#ff6b6b' }
```

#### `ConversationManager`
Orchestrates conversation flow
```javascript
const manager = new ConversationManager(hfService, intentDetector, emotionDetector);
const result = await manager.generateResponse('Hello!');
// Returns: { response, intent, emotion, emotionType }
```

#### `UIController`
Manages all UI operations
```javascript
const ui = new UIController();
ui.addMessage('Hello!', 'user');
ui.showLoading();
ui.hideLoading();
ui.updateEmotionIndicator('😊', 'happy');
```

#### `AIAssistant`
Main application class that ties everything together

## Customization

### Change Model
Replace in `api-assistant.js`:
```javascript
ENDPOINT: 'https://api-inference.huggingface.co/models/gpt2'
// With other Hugging Face models like:
// 'https://api-inference.huggingface.co/models/facebook/opt-350m'
// 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1'
```

### Adjust Response Length
```javascript
MAX_TOKENS: 150  // Increase for longer responses
```

### Adjust Temperature (0.0 - 1.0)
```javascript
TEMPERATURE: 0.7  
// Lower = more deterministic (0.3)
// Higher = more creative (0.9)
```

### Adjust Typing Speed
In `AIAssistant.typeMessage()`:
```javascript
await this.typeMessage(result.response, 20); // 20ms per character
```

### Add Custom Intents
In `IntentDetector`:
```javascript
this.intents.custom_intent = {
    keywords: ['keyword1', 'keyword2'],
    response: 'Custom response prefix. '
};
```

## Troubleshooting

### "API Key not configured"
- Make sure you set the API key in `API_CONFIG.API_KEY`
- Get your key from https://huggingface.co/settings/tokens

### "Invalid API Key"
- Double-check your token is correct
- Make sure it's a valid "Read" token
- Regenerate if needed

### "Rate limited"
- You've exceeded Hugging Face API rate limits
- Wait a moment and try again
- Upgrade your Hugging Face account for higher limits

### Request Timeout
- The API is taking too long to respond
- Check your internet connection
- Try a shorter prompt

### Model Taking Time to Load
- First request to a model can be slower (model warming up)
- Subsequent requests are faster

## Performance Tips

1. **Keep prompts concise** - Shorter inputs = faster responses
2. **Use context wisely** - System maintains last 5 turns automatically
3. **Manage history** - Call `aiAssistant.reset()` to clear history if needed
4. **Monitor tokens** - Default is 150 max tokens per response

## API Free Tier Limits

**Hugging Face Free Tier:**
- Rate limit: ~1 request per 10 seconds
- Model timeout: ~30 seconds
- No request limit, but community-based

**To increase:**
- Upgrade to Pro account: $9/month
- Get your own inference endpoints

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## Mobile Optimization

- Fully responsive design
- Touch-friendly 44px+ buttons
- Smooth scrolling with momentum
- Handles notches and safe areas
- No zoom on focus

## Security Notes

**⚠️ IMPORTANT: For Production:**
- Never expose API keys in frontend code
- Use a backend server to proxy API calls
- Implement rate limiting on backend
- Add authentication for your application

**For Development:** The current setup is fine.

## Advanced: Using with Backend

Create a backend endpoint:
```javascript
POST /api/chat
{
  "message": "user message",
  "history": [...]
}
```

Then in `HuggingFaceService`:
```javascript
async generateResponse(prompt, history) {
    const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: prompt, history })
    });
    return await response.json();
}
```

## Resetting the Assistant

```javascript
aiAssistant.reset(); // Clears history and messages
```

## Resources

- [Hugging Face Inference API Docs](https://huggingface.co/docs/api-inference/index)
- [Available Models](https://huggingface.co/models)
- [API Token Management](https://huggingface.co/settings/tokens)

## Support

For issues:
1. Check the browser console (F12) for error messages
2. Verify API key is set correctly
3. Check internet connection
4. Try with a different prompt
5. Clear browser cache and reload

---

**Happy coding!** 🚀
