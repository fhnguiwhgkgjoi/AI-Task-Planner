// ============================================
// BACKEND SERVER - HUGGING FACE API PROXY
// ============================================
// Run: node server.js
// Then access: http://localhost:3000

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// ============================================
// MIDDLEWARE (Order matters!)
// ============================================
// Enable CORS for all routes
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

// Parse JSON bodies
app.use(express.json());

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// ============================================
// API PROXY ENDPOINT - HANDLES BOTH POST and OPTIONS
// ============================================
app.options('/api/chat', cors()); // Handle preflight requests

app.post('/api/chat', async (req, res) => {
    try {
        console.log('📨 Received request:', req.body);
        
        const { prompt, history } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log('📤 Sending to Hugging Face...');

        // Build full prompt with history
        const fullPrompt = history 
            ? `${history}\nUser: ${prompt}\nAssistant:` 
            : `${prompt}`;

        // Call Hugging Face API
        const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer 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`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: fullPrompt,
                parameters: {
                    max_length: 150,
                    temperature: 0.7,
                    top_p: 0.95,
                    do_sample: true,
                    return_full_text: false
                }
            })
        });

        if (!response.ok) {
            console.error(`❌ Hugging Face API error: ${response.status}`);
            const errorData = await response.json().catch(() => ({}));
            
            if (response.status === 401) {
                return res.status(401).json({ 
                    error: 'Invalid API Key'
                });
            } else if (response.status === 429) {
                return res.status(429).json({ 
                    error: 'Rate limited. Please wait a moment.'
                });
            }
            
            return res.status(response.status).json({ 
                error: `API Error: ${response.status}`
            });
        }

        const data = await response.json();
        console.log('✅ Response received from Hugging Face');

        // Extract generated text
        if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
            let text = data[0].generated_text.trim();

            // Clean up response
            text = text.replace(/\n+/g, ' ').trim();
            text = text.replace(/User:|Assistant:/g, '').trim();

            // Limit to 3 sentences
            const sentences = text.match(/[^.!?]*[.!?]+/g) || [text];
            const cleanedText = sentences.slice(0, 3).join(' ').trim();

            console.log('📤 Sending response to client');
            return res.json({ 
                response: cleanedText || 'I understand. How can I help you further?'
            });
        }

        return res.status(400).json({ 
            error: 'Invalid response format from API'
        });

    } catch (error) {
        console.error('❌ Server Error:', error.message);
        return res.status(500).json({ 
            error: error.message || 'Internal server error'
        });
    }
});

// Serve static files (HTML, CSS, JS) from current directory
// This MUST be AFTER the API routes
app.use(express.static(__dirname));

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   🤖 AI ASSISTANT SERVER RUNNING       ║
╚════════════════════════════════════════╝

📍 Access URL: http://localhost:${PORT}
📁 Serving files from: ${__dirname}

✅ API Endpoint: POST http://localhost:${PORT}/api/chat
✅ Health Check: GET http://localhost:${PORT}/health

🛑 Press Ctrl+C to stop the server
    `);
});
