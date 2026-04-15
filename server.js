// ============================================
// BACKEND SERVER - HUGGING FACE API PROXY
// ============================================
// Run: node server.js
// Then access: http://localhost:3000

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// ============================================
// API PROXY ENDPOINT
// ============================================
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt, history } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

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
            const errorData = await response.json().catch(() => ({}));
            
            if (response.status === 401) {
                return res.status(401).json({ 
                    error: 'Invalid API Key',
                    details: errorData
                });
            } else if (response.status === 429) {
                return res.status(429).json({ 
                    error: 'Rate limited',
                    details: errorData
                });
            }
            
            return res.status(response.status).json({ 
                error: `API Error: ${response.status}`,
                details: errorData
            });
        }

        const data = await response.json();

        // Extract generated text
        if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
            let text = data[0].generated_text.trim();

            // Clean up response
            text = text.replace(/\n+/g, ' ').trim();
            text = text.replace(/User:|Assistant:/g, '').trim();

            // Limit to 3 sentences
            const sentences = text.match(/[^.!?]*[.!?]+/g) || [text];
            const cleanedText = sentences.slice(0, 3).join(' ').trim();

            return res.json({ 
                response: cleanedText || 'I understand. How can I help you further?'
            });
        }

        return res.status(400).json({ 
            error: 'Invalid response format from API'
        });

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ 
            error: error.message || 'Internal server error'
        });
    }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   🤖 AI ASSISTANT SERVER RUNNING       ║
╚════════════════════════════════════════╝

📍 Server: http://localhost:${PORT}
📁 Static files: ${__dirname}

✅ Open http://localhost:${PORT} in your browser

📝 API Endpoint: POST http://localhost:${PORT}/api/chat
   Body: { "prompt": "your message", "history": "optional conversation history" }

🛑 Press Ctrl+C to stop the server
    `);
});
