// ============================================
// BACKEND SERVER - HUGGING FACE API PROXY
// ============================================
// Run: node server.js
// Access: http://localhost:3000

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// ============================================
// CONFIGURATION
// ============================================
const HF_API_KEY = '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';
const HF_MODEL = 'gpt2';
const HF_ENDPOINT = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
    res.json({ status: 'OK', server: 'Running' });
});

// ============================================
// MAIN API ENDPOINT
// ============================================
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt, history } = req.body;

        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log('[REQUEST] Received:', prompt.substring(0, 50));

        // Build context
        const fullPrompt = history 
            ? `${history}\nUser: ${prompt}\nAssistant:` 
            : prompt;

        console.log('[HF_CALL] Sending to Hugging Face...');

        // Call Hugging Face with proper error handling
        const hfResponse = await callHuggingFace(fullPrompt);

        if (hfResponse.error) {
            console.error('[HF_ERROR]', hfResponse.error);
            return res.status(500).json({ error: hfResponse.error });
        }

        console.log('[SUCCESS] Generated response');
        return res.json({ response: hfResponse.text });

    } catch (error) {
        console.error('[SERVER_ERROR]', error.message);
        return res.status(500).json({ 
            error: 'Server error: ' + error.message 
        });
    }
});

// ============================================
// HUGGING FACE API CALLER
// ============================================
async function callHuggingFace(prompt) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        const response = await fetch(HF_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 100,
                    temperature: 0.7,
                    do_sample: true
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[HTTP ${response.status}]`, errorText);

            if (response.status === 401) {
                return { error: 'Invalid Hugging Face API key' };
            }
            if (response.status === 429) {
                return { error: 'Rate limited by Hugging Face' };
            }
            if (response.status === 500 || response.status === 503) {
                return { error: 'Hugging Face service temporarily unavailable' };
            }

            return { error: `API Error: ${response.status}` };
        }

        const data = await response.json();
        console.log('[HF_RESPONSE] Received:', JSON.stringify(data).substring(0, 100));

        // Handle response
        let generatedText = '';

        if (Array.isArray(data)) {
            if (data.length > 0 && data[0].generated_text) {
                generatedText = data[0].generated_text;
            }
        } else if (data.generated_text) {
            generatedText = data.generated_text;
        } else if (data[0]?.generated_text) {
            generatedText = data[0].generated_text;
        }

        if (!generatedText) {
            console.error('[PARSE_ERROR] Could not parse response:', JSON.stringify(data));
            return { error: 'Could not generate response' };
        }

        // Clean response
        let text = generatedText.trim();
        text = text.replace(/^User:|^Assistant:/gm, '').trim();
        text = text.substring(0, 500);

        if (!text) {
            return { text: 'I understand. How can I help?' };
        }

        return { text: text };

    } catch (error) {
        console.error('[FETCH_ERROR]', error.message);

        if (error.name === 'AbortError') {
            return { error: 'Request timeout - Hugging Face took too long to respond' };
        }

        return { error: 'Failed to call Hugging Face: ' + error.message };
    }
}

// ============================================
// STATIC FILES
// ============================================
app.use(express.static(__dirname, {
    index: ['index.html']
}));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║  🤖 AI ASSISTANT BACKEND - READY             ║
╚═══════════════════════════════════════════════╝

✅ Server running on: http://localhost:${PORT}
✅ Health check: http://localhost:${PORT}/health
✅ API endpoint: POST http://localhost:${PORT}/api/chat

📝 Hugging Face Model: ${HF_MODEL}
⏱️  Timeout: 45 seconds

🛑 Press Ctrl+C to stop
    `);
});
