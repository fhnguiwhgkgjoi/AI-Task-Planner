#!/usr/bin/env python3
"""
AI Assistant Backend - Flask Server
Proxies requests to Hugging Face API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configuration
HF_API_KEY = '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'
HF_ENDPOINT = 'https://api-inference.huggingface.co/models/gpt2'
PORT = 3000
TIMEOUT = 45

# ============================================
# LOGGING
# ============================================
def log(message, level="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

# ============================================
# HEALTH CHECK
# ============================================
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'server': 'Running'}), 200

# ============================================
# MAIN API ENDPOINT
# ============================================
@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204

    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Invalid JSON'}), 400

        prompt = data.get('prompt', '').strip()
        history = data.get('history', '').strip()

        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400

        log(f"REQUEST: {prompt[:50]}")

        # Build full prompt with history
        if history:
            full_prompt = f"{history}\nUser: {prompt}\nAssistant:"
        else:
            full_prompt = prompt

        log("HF_CALL: Sending to Hugging Face...")

        # Call Hugging Face API
        response = call_hugging_face(full_prompt)

        if 'error' in response:
            log(f"ERROR: {response['error']}", "ERROR")
            return jsonify({'error': response['error']}), 500

        log("SUCCESS: Generated response")
        return jsonify({'response': response['text']}), 200

    except Exception as e:
        log(f"SERVER ERROR: {str(e)}", "ERROR")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# ============================================
# HUGGING FACE API CALLER
# ============================================
def call_hugging_face(prompt):
    try:
        headers = {
            'Authorization': f'Bearer {HF_API_KEY}',
            'Content-Type': 'application/json',
        }

        payload = {
            'inputs': prompt,
            'parameters': {
                'max_new_tokens': 100,
                'temperature': 0.7,
                'do_sample': True
            }
        }

        log(f"Calling: {HF_ENDPOINT}")
        
        response = requests.post(
            HF_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=TIMEOUT
        )

        log(f"HF_RESPONSE: Status {response.status_code}")

        if not response.ok:
            error_text = response.text[:200]
            log(f"HTTP {response.status_code}: {error_text}", "ERROR")

            if response.status_code == 401:
                return {'error': 'Invalid Hugging Face API key'}
            elif response.status_code == 429:
                return {'error': 'Rate limited by Hugging Face'}
            elif response.status_code in [500, 503]:
                return {'error': 'Hugging Face service unavailable'}
            else:
                return {'error': f'API Error: {response.status_code}'}

        data = response.json()
        log(f"Parsed response: {str(data)[:100]}")

        # Extract generated text
        generated_text = ''

        if isinstance(data, list):
            if len(data) > 0 and 'generated_text' in data[0]:
                generated_text = data[0]['generated_text']
        elif isinstance(data, dict):
            generated_text = data.get('generated_text', '')

        if not generated_text:
            log(f"PARSE ERROR: Could not extract text from {data}", "ERROR")
            return {'error': 'Could not generate response'}

        # Clean response
        text = generated_text.strip()
        text = text.replace('User:', '').replace('Assistant:', '').strip()
        text = text[:500]

        if not text:
            text = 'I understand. How can I help?'

        return {'text': text}

    except requests.exceptions.Timeout:
        log("Request timeout - Hugging Face took too long", "ERROR")
        return {'error': 'Request timeout'}
    except requests.exceptions.ConnectionError as e:
        log(f"Connection error: {str(e)}", "ERROR")
        return {'error': 'Could not connect to Hugging Face'}
    except requests.exceptions.RequestException as e:
        log(f"Request error: {str(e)}", "ERROR")
        return {'error': f'Failed to call API: {str(e)}'}
    except Exception as e:
        log(f"Unexpected error: {str(e)}", "ERROR")
        return {'error': f'Unexpected error: {str(e)}'}

# ============================================
# SERVE STATIC FILES
# ============================================
@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def send_static(path):
    return app.send_from_directory('.', path)

# ============================================
# START SERVER
# ============================================
if __name__ == '__main__':
    print(f"""
╔═══════════════════════════════════════════════╗
║  🤖 AI ASSISTANT BACKEND - READY             ║
╚═══════════════════════════════════════════════╝

✅ Server running on: http://localhost:{PORT}
✅ Health check: http://localhost:{PORT}/health
✅ API endpoint: POST http://localhost:{PORT}/api/chat

📝 Hugging Face Model: gpt2
⏱️  Timeout: {TIMEOUT} seconds

🛑 Press Ctrl+C to stop
    """)

    app.run(host='0.0.0.0', port=PORT, debug=False, use_reloader=False)
